const { Op } = require('sequelize');
const { Course, Module, Lesson, QuizQuestion, QuizAttempt, User } = require('../models');
const { getPagination, getPaginatedResponse } = require('../utils/pagination');
const { cacheGet, cacheSet, cacheDel, cacheDelPattern } = require('../utils/cache');
const { logAction } = require('./audit.service');

const getCourses = async ({ tenantId, query }) => {
  const { page, limit, offset } = getPagination(query);
  const search = query.search || '';

  const cacheKey = `courses:${tenantId}:${page}:${limit}:${search}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const where = { tenantId };
  if (search) {
    where.title = { [Op.iLike]: `%${search}%` };
  }
  if (query.published !== undefined) {
    where.isPublished = query.published === 'true';
  }

  const { rows, count } = await Course.findAndCountAll({
    where,
    include: [{ model: User, as: 'instructor', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  const result = getPaginatedResponse(rows, count, page, limit);
  await cacheSet(cacheKey, result, 120);
  return result;
};

const getCourseById = async (id, tenantId) => {
  const cacheKey = `course:${tenantId}:${id}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const course = await Course.findOne({
    where: { id, tenantId },
    include: [
      {
        model: User,
        as: 'instructor',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: Module,
        as: 'modules',
        include: [
          {
            model: Lesson,
            as: 'lessons',
            include: [
              {
                model: QuizQuestion,
                as: 'questions',
                // FIX: actual model fields are 'question' and 'order', not 'questionText'/'orderIndex'
                attributes: ['id', 'question', 'options', 'correctOptionId', 'explanation', 'order'],
              },
            ],
            // FIX: order column is 'order' not 'orderIndex'
            order: [['order', 'ASC']],
          },
        ],
        // FIX: order column is 'order' not 'orderIndex'
        order: [['order', 'ASC']],
      },
    ],
  });

  if (!course) throw Object.assign(new Error('Course not found'), { statusCode: 404 });

  await cacheSet(cacheKey, course, 300);
  return course;
};

const createCourse = async ({ tenantId, instructorId, data, correlationId }) => {
  const course = await Course.create({
    tenantId,
    instructorId,
    ...data,
  });

  await cacheDelPattern(`courses:${tenantId}:*`);

  await logAction({
    userId: instructorId,
    tenantId,
    action: 'CREATE_COURSE',
    resource: 'course',
    resourceId: course.id,
    after: data,
    correlationId,
  });

  return course;
};

const updateCourse = async ({ id, tenantId, userId, data, correlationId }) => {
  const course = await Course.findOne({ where: { id, tenantId } });
  if (!course) throw Object.assign(new Error('Course not found'), { statusCode: 404 });

  const before = course.toJSON();
  await course.update(data);

  await cacheDel(`course:${tenantId}:${id}`);
  await cacheDelPattern(`courses:${tenantId}:*`);

  await logAction({
    userId,
    tenantId,
    action: 'UPDATE_COURSE',
    resource: 'course',
    resourceId: id,
    before,
    after: data,
    correlationId,
  });

  return course;
};

const deleteCourse = async ({ id, tenantId, userId, correlationId }) => {
  const course = await Course.findOne({ where: { id, tenantId } });
  if (!course) throw Object.assign(new Error('Course not found'), { statusCode: 404 });

  await course.destroy();
  await cacheDel(`course:${tenantId}:${id}`);
  await cacheDelPattern(`courses:${tenantId}:*`);

  await logAction({
    userId,
    tenantId,
    action: 'DELETE_COURSE',
    resource: 'course',
    resourceId: id,
    correlationId,
  });
};

const createModule = async ({ courseId, tenantId, userId, data, correlationId }) => {
  const course = await Course.findOne({ where: { id: courseId, tenantId } });
  if (!course) throw Object.assign(new Error('Course not found'), { statusCode: 404 });

  const existingCount = await Module.count({ where: { courseId } });
  const module = await Module.create({
    courseId,
    tenantId,
    title: data.title,
    description: data.description || null,
    // FIX: model field is 'order' not 'orderIndex'
    order: data.order ?? data.orderIndex ?? data.order_index ?? existingCount,
  });

  await cacheDel(`course:${tenantId}:${courseId}`);
  await logAction({ userId, tenantId, action: 'CREATE_MODULE', resource: 'module', resourceId: module.id, correlationId });
  return module;
};

const updateModule = async ({ moduleId, courseId, tenantId, data }) => {
  const module = await Module.findOne({ where: { id: moduleId, courseId } });
  if (!module) throw Object.assign(new Error('Module not found'), { statusCode: 404 });

  await module.update(data);
  await cacheDel(`course:${tenantId}:${courseId}`);
  return module;
};

const createLesson = async ({ moduleId, tenantId, userId, data, correlationId }) => {
  const module = await Module.findOne({ where: { id: moduleId } });
  if (!module) throw Object.assign(new Error('Module not found'), { statusCode: 404 });

  const existingCount = await Lesson.count({ where: { moduleId } });
  const lesson = await Lesson.create({
    moduleId,
    tenantId,
    title: data.title,
    type: data.type || 'TEXT',
    content: data.content || null,
    isPublished: data.isPublished ?? data.is_published ?? false,
    // FIX: model field is 'order' not 'orderIndex'
    order: data.order ?? data.orderIndex ?? data.order_index ?? existingCount,
  });

  await cacheDel(`course:${tenantId}:${module.courseId}`);
  await logAction({ userId, tenantId, action: 'CREATE_LESSON', resource: 'lesson', resourceId: lesson.id, correlationId });
  return lesson;
};

const updateLesson = async ({ lessonId, moduleId, tenantId, data }) => {
  const lesson = await Lesson.findOne({ where: { id: lessonId, moduleId } });
  if (!lesson) throw Object.assign(new Error('Lesson not found'), { statusCode: 404 });

  await lesson.update(data);

  const module = await Module.findByPk(moduleId);
  if (module) await cacheDel(`course:${tenantId}:${module.courseId}`);

  return lesson;
};

const createQuizQuestion = async ({ lessonId, tenantId, userId, data }) => {
  const lesson = await Lesson.findOne({ where: { id: lessonId, type: 'QUIZ' } });
  if (!lesson) throw Object.assign(new Error('Quiz lesson not found'), { statusCode: 404 });

  // Handle both single question and bulk questions array
  const questions = data.questions || [data];

  const created = await QuizQuestion.bulkCreate(
    questions.map((q, i) => ({
      lessonId,
      tenantId,
      // FIX: model field is 'question' not 'questionText'
      question: q.question || q.questionText || q.question_text,
      options: q.options,
      correctOptionId: q.correctOptionId || q.correct_option_id,
      explanation: q.explanation || null,
      // FIX: model field is 'order' not 'orderIndex'
      order: q.order ?? q.orderIndex ?? q.order_index ?? i,
    }))
  );

  const module = await Module.findByPk(lesson.moduleId);
  if (module) await cacheDel(`course:${tenantId}:${module.courseId}`);

  return created.length === 1 ? created[0] : created;
};

const submitQuiz = async ({ lessonId, tenantId, studentId, answers }) => {
  const lesson = await Lesson.findOne({
    where: { id: lessonId, type: 'QUIZ' },
    include: [{ model: QuizQuestion, as: 'questions' }],
  });

  if (!lesson) throw Object.assign(new Error('Quiz not found'), { statusCode: 404 });

  const questions = lesson.questions;
  if (!questions.length) throw Object.assign(new Error('Quiz has no questions'), { statusCode: 400 });

  // answers is an array: [{ question_id, selected_option_id }] — convert to map
  const answerMap = {};
  if (Array.isArray(answers)) {
    answers.forEach(a => { answerMap[a.question_id] = a.selected_option_id; });
  } else {
    Object.assign(answerMap, answers);
  }

  let correctCount = 0;
  const incorrectQuestions = [];

  for (const q of questions) {
    const studentAnswer = answerMap[q.id];
    if (studentAnswer === q.correctOptionId) {
      correctCount++;
    } else {
      const selectedOption = q.options.find(o => o.id === studentAnswer);
      const correctOption = q.options.find(o => o.id === q.correctOptionId);
      incorrectQuestions.push({
        questionId: q.id,
        // FIX: model field is 'question' not 'questionText'
        questionText: q.question,
        yourAnswer: selectedOption ? selectedOption.text : studentAnswer || 'Not answered',
        correctAnswer: correctOption ? correctOption.text : q.correctOptionId,
        explanation: q.explanation || null,
      });
    }
  }

  const score = parseFloat(((correctCount / questions.length) * 100).toFixed(2));
  const passed = score >= 70;

  // FIX: QuizAttempt model has no 'passed' column — don't store it
  // FIX: tenantId required by model
  const attempt = await QuizAttempt.create({
    lessonId,
    tenantId,
    studentId,
    answers: answerMap,
    score,
    totalQuestions: questions.length,
    correctCount,
    incorrectQuestions,
  });

  // 'passed' is computed and returned but not stored (not in model)
  return {
    id: attempt.id,
    score,
    totalQuestions: questions.length,
    correctCount,
    incorrectCount: questions.length - correctCount,
    incorrectQuestions,
    passed,
    completedAt: attempt.completedAt,
  };
};

const getAttempts = async ({ lessonId, studentId }) => {
  const attempts = await QuizAttempt.findAll({
    where: { lessonId, studentId },
    order: [['createdAt', 'DESC']],
    // FIX: 'passed' not in model — removed from attributes
    attributes: ['id', 'score', 'totalQuestions', 'correctCount', 'incorrectQuestions', 'completedAt', 'createdAt'],
  });
  return attempts;
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  createModule,
  updateModule,
  createLesson,
  updateLesson,
  createQuizQuestion,
  submitQuiz,
  getAttempts,
};