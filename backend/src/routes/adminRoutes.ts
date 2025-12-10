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

export default router;
