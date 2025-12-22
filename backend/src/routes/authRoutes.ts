import { Router } from 'express';
import { register, login, refreshToken, logout, getProfile, regenerateReferralCode } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);
router.post('/referral/regenerate', authenticate, regenerateReferralCode);

export default router;
