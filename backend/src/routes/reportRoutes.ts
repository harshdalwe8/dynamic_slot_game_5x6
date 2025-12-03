import express from 'express';
import {
  getRTPReport,
  getAllThemesRTP,
  getThemeRTPHistoryEndpoint,
  getSpinLogsReport,
  getUserActivityReport,
  getTransactionReport,
  getThemePerformance,
  getAdminLogs,
} from '../controllers/reportController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// All report routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/reports/rtp
 * Get RTP report with statistics
 * Query params: themeId, startDate, endDate, period
 */
router.get('/rtp', getRTPReport);

/**
 * GET /api/admin/reports/rtp/all
 * Get current RTP for all active themes
 */
router.get('/rtp/all', getAllThemesRTP);

/**
 * GET /api/admin/reports/rtp/history/:themeId
 * Get historical RTP data for a theme
 * Query params: limit
 */
router.get('/rtp/history/:themeId', getThemeRTPHistoryEndpoint);

/**
 * GET /api/admin/reports/spins
 * Get spin logs with filters
 * Query params: userId, themeId, startDate, endDate, limit, offset
 */
router.get('/spins', getSpinLogsReport);

/**
 * GET /api/admin/reports/users
 * Get user activity report
 * Query params: limit, offset
 */
router.get('/users', getUserActivityReport);

/**
 * GET /api/admin/reports/transactions
 * Get transaction report
 * Query params: userId, type, startDate, endDate, limit, offset
 */
router.get('/transactions', getTransactionReport);

/**
 * GET /api/admin/reports/themes
 * Get theme performance metrics
 * Query params: startDate, endDate
 */
router.get('/themes', getThemePerformance);

/**
 * GET /api/admin/reports/admin-logs
 * Get admin action audit logs
 * Query params: adminId, action, limit, offset
 */
router.get('/admin-logs', getAdminLogs);

export default router;
