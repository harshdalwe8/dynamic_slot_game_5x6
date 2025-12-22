import { Router } from 'express';
import {
  createTheme,
  updateTheme,
  activateTheme,
  deactivateTheme,
  rollbackTheme,
  getAllThemes,
  getThemeDetails,
  deleteTheme,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  updateUserBalance,
  createOfferCode,
  listOfferCodes,
  deactivateOfferCode,
  activateOfferCode,
  updateOfferCode,
  createPaymentLink,
  listPaymentLinks,
  updatePaymentLink,
  deletePaymentLink,
  togglePaymentLink,
  listDeposits,
  approveDeposit,
  rejectDeposit,
} from '../controllers/adminController';

import { authenticate, requireAdmin, requireSuperAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Update user balance (SUPER_ADMIN, SUPPORT_STAFF only)
router.put('/users/:userId/balance', updateUserBalance);

// Theme management
router.post('/themes', createTheme);
router.get('/themes', getAllThemes);
router.get('/themes/:themeId', getThemeDetails);
router.put('/themes/:themeId', updateTheme);
router.post('/themes/:themeId/activate', activateTheme);
router.post('/themes/:themeId/deactivate', deactivateTheme);
router.post('/themes/:themeId/rollback', rollbackTheme);
router.delete('/themes/:themeId', requireSuperAdmin, deleteTheme);

// User management
router.get('/users', getAllUsers);
router.put('/users/:userId/status', updateUserStatus);
router.put('/users/:userId/role', requireSuperAdmin, updateUserRole);

// Offer codes management
router.post('/offer-codes', createOfferCode);
router.get('/offer-codes', listOfferCodes);
router.post('/offer-codes/:code/deactivate', deactivateOfferCode);
router.post('/offer-codes/:code/activate', activateOfferCode);
router.put('/offer-codes/:code', updateOfferCode);

// Payment links management
router.post('/payment-links', createPaymentLink);
router.get('/payment-links', listPaymentLinks);
router.put('/payment-links/:id', updatePaymentLink);
router.delete('/payment-links/:id', deletePaymentLink);
router.post('/payment-links/:id/toggle', togglePaymentLink);

// Deposits management
router.get('/deposits', listDeposits);
router.put('/deposits/:depositId/approve', approveDeposit);
router.put('/deposits/:depositId/reject', rejectDeposit);

export default router;
