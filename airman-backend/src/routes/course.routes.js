const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize, requireApproved } = require('../middlewares/rbac.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createCourseSchema, updateCourseSchema, createModuleSchema,
  createLessonSchema, createQuizQuestionSchema, submitQuizSchema,
} = require('../validators/course.schema');
const ctrl = require('../controllers/course.controller');

router.use(authenticate);

// Courses
router.get('/', requireApproved, ctrl.getCourses);
router.get('/:id', requireApproved, ctrl.getCourse);
router.post('/', authorize('INSTRUCTOR', 'ADMIN'), validate(createCourseSchema), ctrl.createCourse);
router.put('/:id', authorize('INSTRUCTOR', 'ADMIN'), validate(updateCourseSchema), ctrl.updateCourse);
router.delete('/:id', authorize('INSTRUCTOR', 'ADMIN'), ctrl.deleteCourse);

// Modules
router.post('/:courseId/modules', authorize('INSTRUCTOR', 'ADMIN'), validate(createModuleSchema), ctrl.createModule);

// Lessons
router.post('/:courseId/modules/:moduleId/lessons', authorize('INSTRUCTOR', 'ADMIN'), validate(createLessonSchema), ctrl.createLesson);
router.put('/:courseId/modules/:moduleId/lessons/:lessonId', authorize('INSTRUCTOR', 'ADMIN'), ctrl.updateLesson);

// Quiz
router.post('/:courseId/modules/:moduleId/lessons/:lessonId/questions', authorize('INSTRUCTOR', 'ADMIN'), validate(createQuizQuestionSchema), ctrl.createQuizQuestion);
router.post('/:courseId/modules/:moduleId/lessons/:lessonId/submit', requireApproved, validate(submitQuizSchema), ctrl.submitQuiz);
router.get('/:courseId/modules/:moduleId/lessons/:lessonId/attempts', requireApproved, ctrl.getAttempts);

module.exports = router;
