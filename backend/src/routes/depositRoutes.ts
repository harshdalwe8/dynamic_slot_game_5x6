import { Router } from 'express';
import {
  initDeposit,
  uploadDepositScreenshot,
  getMyDeposits,
  getDeposit,
  getActivePaymentLinks,
} from '../controllers/depositController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Player routes (require authentication)
router.post('/deposits/init', authenticate, initDeposit);
router.post('/deposits/:depositId/upload-screenshot', authenticate, uploadDepositScreenshot);
router.get('/deposits/my', authenticate, getMyDeposits);
router.get('/deposits/:depositId', authenticate, getDeposit);
router.get('/payment-links/active', authenticate, getActivePaymentLinks);

export default router;
