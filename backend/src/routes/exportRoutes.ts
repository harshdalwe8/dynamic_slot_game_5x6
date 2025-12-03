import express from 'express';
import {
  exportSpinsCSV,
  exportTransactionsCSV,
  exportUsersCSV,
  exportRTPReportCSV,
  exportAdminLogsCSV,
} from '../controllers/exportController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// All export routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/export/spins
 * Export spin logs to CSV
 * Query params: userId, themeId, startDate, endDate
 */
router.get('/spins', exportSpinsCSV);

/**
 * GET /api/admin/export/transactions
 * Export transactions to CSV
 * Query params: userId, type, startDate, endDate
 */
router.get('/transactions', exportTransactionsCSV);

/**
 * GET /api/admin/export/users
 * Export users to CSV
 * Query params: role, status, startDate, endDate
 */
router.get('/users', exportUsersCSV);

/**
 * GET /api/admin/export/rtp
 * Export RTP report to CSV
 * Query params: startDate, endDate
 */
router.get('/rtp', exportRTPReportCSV);

/**
 * GET /api/admin/export/admin-logs
 * Export admin action logs to CSV
 * Query params: adminId, action, startDate, endDate
 */
router.get('/admin-logs', exportAdminLogsCSV);

export default router;
