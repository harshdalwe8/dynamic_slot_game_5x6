import { Router } from 'express';
import {
  spin,
  getSpinHistory,
  auditSpin,
  getActiveThemes,
  getWallet,
} from '../controllers/slotController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { spinLimiter } from '../middleware/rateLimiter';

const router = Router();

// Player routes
router.post('/spin', authenticate, spinLimiter, spin);
router.get('/spin/history', authenticate, getSpinHistory);
router.get('/themes', authenticate, getActiveThemes);
router.get('/wallet', authenticate, getWallet);

// Admin routes
router.get('/spin/audit/:spinId', authenticate, requireAdmin, auditSpin);

export default router;