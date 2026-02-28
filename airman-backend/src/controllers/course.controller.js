const courseService = require('../services/course.service');

const getCourses = async (req, res, next) => {
  try {
    const result = await courseService.getCourses({ tenantId: req.user.tenantId, query: req.query });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getCourse = async (req, res, next) => {
  try {
    const course = await courseService.getCourseById(req.params.id, req.user.tenantId);
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
};

const createCourse = async (req, res, next) => {
  try {
    const course = await courseService.createCourse({
      tenantId: req.user.tenantId,
      instructorId: req.user.id,
      data: req.body,
      correlationId: req.correlationId,
    });
    res.status(201).json({ success: true, data: course });
  } catch (err) { next(err); }
};

const updateCourse = async (req, res, next) => {
  try {
    const course = await courseService.updateCourse({
      id: req.params.id,
      tenantId: req.user.tenantId,
      userId: req.user.id,
      data: req.body,
      correlationId: req.correlationId,
    });
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
};

const deleteCourse = async (req, res, next) => {
  try {
    await courseService.deleteCourse({
      id: req.params.id,
      tenantId: req.user.tenantId,
      userId: req.user.id,
      correlationId: req.correlationId,
    });
    res.json({ success: true, message: 'Course deleted' });
  } catch (err) { next(err); }
};

const createModule = async (req, res, next) => {
  try {
    const module = await courseService.createModule({
      courseId: req.params.courseId,
      tenantId: req.user.tenantId,
      userId: req.user.id,
      data: req.body,
      correlationId: req.correlationId,
    });
    res.status(201).json({ success: true, data: module });
  } catch (err) { next(err); }
};

const updateModule = async (req, res, next) => {
  try {
    const module = await courseService.updateModule({
      moduleId: req.params.moduleId,
      courseId: req.params.courseId,
      tenantId: req.user.tenantId,
      data: req.body,
    });
    res.json({ success: true, data: module });
  } catch (err) { next(err); }
};

const createLesson = async (req, res, next) => {
  try {
    const lesson = await courseService.createLesson({
      moduleId: req.params.moduleId,
      tenantId: req.user.tenantId,
      userId: req.user.id,
      data: req.body,
      correlationId: req.correlationId,
    });
    res.status(201).json({ success: true, data: lesson });
  } catch (err) { next(err); }
};

const updateLesson = async (req, res, next) => {
  try {
    const lesson = await courseService.updateLesson({
      lessonId: req.params.lessonId,
      moduleId: req.params.moduleId,
      tenantId: req.user.tenantId,
      data: req.body,
    });
    res.json({ success: true, data: lesson });
  } catch (err) { next(err); }
};

const createQuizQuestion = async (req, res, next) => {
  try {
    console.log(
      req.params,"aaaaaaaaaaadsadasdasd!!!!!"
    )
    const question = await courseService.createQuizQuestion({
      lessonId: req.params.lessonId,
      tenantId: req.user.tenantId,
      userId: req.user.id,
      data: req.body,
    });
    res.status(201).json({ success: true, data: question });
  } catch (err) { next(err); }
};

const submitQuiz = async (req, res, next) => {
  try {
    const result = await courseService.submitQuiz({
      lessonId: req.params.lessonId,
      tenantId: req.user.tenantId,
      studentId: req.user.id,
      answers: req.body.answers,
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const getAttempts = async (req, res, next) => {
  try {
    const attempts = await courseService.getAttempts({
      lessonId: req.params.lessonId,
      studentId: req.user.id,
    });
    res.json({ success: true, data: attempts });
  } catch (err) { next(err); }
};

module.exports = {
  getCourses, getCourse, createCourse, updateCourse, deleteCourse,
  createModule, updateModule,
  createLesson, updateLesson,
  createQuizQuestion, submitQuiz, getAttempts,
};