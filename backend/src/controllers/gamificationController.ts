import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  getUserAchievements,
  getAchievementStats,
  createAchievement,
  deleteAchievement,
} from '../services/achievementService';
import {
  getLeaderboard,
  getUserRank,
  generateLeaderboard,
  refreshAllLeaderboards,
} from '../services/leaderboardService';

/**
 * GET /api/player/achievements - Get user's achievements
 */
export const getMyAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const achievements = await getUserAchievements(req.user!.id);
    res.json({ achievements });
  } catch (error: any) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
};

/**
 * GET /api/player/leaderboard - Get leaderboard
 */
export const getLeaderboardEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    const { type = 'TOTAL_WINS', period = 'WEEKLY' } = req.query;

    const leaderboard = await getLeaderboard(
      type as any,
      period as any
    );

    res.json(leaderboard);
  } catch (error: any) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
};

/**
 * GET /api/player/rank - Get user's rank
 */
export const getMyRank = async (req: AuthRequest, res: Response) => {
  try {
    const { type = 'TOTAL_WINS', period = 'WEEKLY' } = req.query;

    const rank = await getUserRank(
      req.user!.id,
      type as any,
      period as any
    );

    res.json(rank);
  } catch (error: any) {
    console.error('Get user rank error:', error);
    res.status(500).json({ error: 'Failed to get rank' });
  }
};

/**
 * GET /api/admin/achievements/stats - Get achievement statistics (admin)
 */
export const getAchievementStatsEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await getAchievementStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Get achievement stats error:', error);
    res.status(500).json({ error: 'Failed to get achievement stats' });
  }
};

/**
 * POST /api/admin/achievements - Create achievement (admin)
 */
export const createAchievementEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, description, icon, requirement, reward, category } = req.body;

    if (!code || !name || !description || !requirement || reward === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const achievement = await createAchievement({
      code,
      name,
      description,
      icon: icon || 'trophy',
      requirement,
      reward,
      category: category || 'gameplay',
    });

    res.status(201).json(achievement);
  } catch (error: any) {
    console.error('Create achievement error:', error);
    res.status(500).json({ error: 'Failed to create achievement' });
  }
};

/**
 * DELETE /api/admin/achievements/:id - Delete achievement (admin)
 */
export const deleteAchievementEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await deleteAchievement(id);

    res.json({ message: 'Achievement deleted successfully' });
  } catch (error: any) {
    console.error('Delete achievement error:', error);
    res.status(500).json({ error: 'Failed to delete achievement' });
  }
};

/**
 * POST /api/admin/leaderboards/generate - Generate leaderboard (admin)
 */
export const generateLeaderboardEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    const { type, period } = req.body;

    if (!type || !period) {
      return res.status(400).json({ error: 'Missing type or period' });
    }

    const leaderboard = await generateLeaderboard(type, period);

    res.status(201).json(leaderboard);
  } catch (error: any) {
    console.error('Generate leaderboard error:', error);
    res.status(500).json({ error: 'Failed to generate leaderboard' });
  }
};

/**
 * POST /api/admin/leaderboards/refresh - Refresh all leaderboards (admin)
 */
export const refreshLeaderboardsEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    await refreshAllLeaderboards();

    res.json({ message: 'All leaderboards refreshed successfully' });
  } catch (error: any) {
    console.error('Refresh leaderboards error:', error);
    res.status(500).json({ error: 'Failed to refresh leaderboards' });
  }
};
