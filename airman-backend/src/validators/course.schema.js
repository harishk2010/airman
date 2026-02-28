const { z } = require('zod');

const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    thumbnailUrl: z.string().url().optional(),
    isPublished: z.boolean().optional(),
  }),
});

const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    thumbnailUrl: z.string().url().optional(),
    isPublished: z.boolean().optional(),
  }),
});

const createModuleSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    order: z.number().int().min(0).optional(),
  }),
});

const createLessonSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    type: z.enum(['TEXT', 'QUIZ']),
    content: z.string().optional(),
    order: z.number().int().min(0).optional(),
  }),
});

const createQuizQuestionSchema = z.object({
  body: z.object({
    questions: z.array(
      z.object({
        question: z.string().min(1),
        options: z.array(
          z.object({
            id: z.string(),
            text: z.string(),
          })
        ).min(2).max(6),
        correctOptionId: z.string(),
        explanation: z.string().nullable().optional(),
        order: z.number().int().min(0).optional(),
      })
    ),
  }),
});
const submitQuizSchema = z.object({
  body: z.object({
    answers: z.array(
      z.object({
        question_id: z.string(),
        selected_option_id: z.string(),
      })
    ).min(1),
  }),
});
module.exports = {
  createCourseSchema,
  updateCourseSchema,
  createModuleSchema,
  createLessonSchema,
  createQuizQuestionSchema,
  submitQuizSchema,
};
