import express from 'express';
import {
  getMyAchievements,
  getLeaderboardEndpoint,
  getMyRank,
  getAchievementStatsEndpoint,
  createAchievementEndpoint,
  deleteAchievementEndpoint,
  generateLeaderboardEndpoint,
  refreshLeaderboardsEndpoint,
} from '../controllers/gamificationController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Player endpoints
router.get('/achievements', authenticate, getMyAchievements);
router.get('/leaderboard', authenticate, getLeaderboardEndpoint);
router.get('/rank', authenticate, getMyRank);

// Admin endpoints
router.get('/admin/achievements/stats', authenticate, requireAdmin, getAchievementStatsEndpoint);
router.post('/admin/achievements', authenticate, requireAdmin, createAchievementEndpoint);
router.delete('/admin/achievements/:id', authenticate, requireAdmin, deleteAchievementEndpoint);
router.post('/admin/leaderboards/generate', authenticate, requireAdmin, generateLeaderboardEndpoint);
router.post('/admin/leaderboards/refresh', authenticate, requireAdmin, refreshLeaderboardsEndpoint);

export default router;
