const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const ctrl = require('../controllers/admin.controller');
const { validate } = require('../middlewares/validate.middleware');
const { z } = require('zod');

const createInstructorSchema = z.object({
  body: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

// Public route — list tenants for login/register dropdown (no auth needed)
router.get('/tenants', ctrl.getTenants);

// All routes below require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN'));

router.get('/users', ctrl.getUsers);
router.post('/users/instructor', validate(createInstructorSchema), ctrl.createInstructor);
router.patch('/users/:id/approve', ctrl.approveUser);
router.patch('/users/:id/role', ctrl.updateUserRole);
router.get('/audit-logs', ctrl.getAuditLogs);

module.exports = router;
