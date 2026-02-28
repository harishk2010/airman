const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimit.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema, refreshSchema } = require('../validators/auth.schema');
const { register, login, refreshToken, logout, me } = require('../controllers/auth.controller');

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

module.exports = router;
