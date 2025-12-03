import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import {
  calculateThemeRTP,
  calculateGlobalRTP,
  getCurrentRTPForAllThemes,
  getRTPStatistics,
  getThemeRTPHistory,
} from '../services/rtpService';

/**
 * GET /api/admin/reports/rtp - Get RTP report
 */
export const getRTPReport = async (req: AuthRequest, res: Response) => {
  try {
    const { themeId, startDate, endDate, period } = req.query;

    let start: Date;
    let end: Date = new Date();

    // Parse period
    if (period) {
      const now = Date.now();
      switch (period) {
        case '24h':
          start = new Date(now - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          start = new Date(now - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          start = new Date(now - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          start = new Date(now - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(now - 7 * 24 * 60 * 60 * 1000);
      }
    } else {
      start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      end = endDate ? new Date(endDate as string) : new Date();
    }

    const statistics = await getRTPStatistics(
      themeId as string | undefined,
      start,
      end
    );

    res.json({ report: statistics });
  } catch (error: any) {
    console.error('Get RTP report error:', error);
    res.status(500).json({ error: 'Failed to get RTP report' });
  }
};

/**
 * GET /api/admin/reports/rtp/themes - Get RTP for all themes
 */
export const getAllThemesRTP = async (req: AuthRequest, res: Response) => {
  try {
    const rtpData = await getCurrentRTPForAllThemes();
    res.json({ themes: rtpData });
  } catch (error: any) {
    console.error('Get all themes RTP error:', error);
    res.status(500).json({ error: 'Failed to get themes RTP' });
  }
};

/**
 * GET /api/admin/reports/rtp/history/:themeId - Get RTP history for theme
 */
export const getThemeRTPHistoryEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    const { themeId } = req.params;
    const limit = parseInt(req.query.limit as string) || 30;

    const history = await getThemeRTPHistory(themeId, limit);
    res.json({ history });
  } catch (error: any) {
    console.error('Get theme RTP history error:', error);
    res.status(500).json({ error: 'Failed to get RTP history' });
  }
};

/**
 * GET /api/admin/reports/spins - Get spin logs report
 */
export const getSpinLogsReport = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, themeId, startDate, endDate, limit = '100', offset = '0' } = req.query;

    const whereClause: any = {};

    if (userId) whereClause.userId = userId as string;
    if (themeId) whereClause.themeId = themeId as string;
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate as string);
      if (endDate) whereClause.createdAt.lte = new Date(endDate as string);
    }

    const spins = await prisma.spin.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
        theme: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const total = await prisma.spin.count({ where: whereClause });

    res.json({ spins, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
  } catch (error: any) {
    console.error('Get spin logs error:', error);
    res.status(500).json({ error: 'Failed to get spin logs' });
  }
};

/**
 * GET /api/admin/reports/users - Get user activity report
 */
export const getUserActivityReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, limit = '50', offset = '0' } = req.query;

    const whereClause: any = {};
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate as string);
      if (endDate) whereClause.createdAt.lte = new Date(endDate as string);
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true,
        wallets: {
          select: {
            balance: true,
            currency: true,
          },
        },
        _count: {
          select: {
            spins: true,
            transactions: true,
          },
        },
      },
    });

    const total = await prisma.user.count({ where: whereClause });

    res.json({ users, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
  } catch (error: any) {
    console.error('Get user activity report error:', error);
    res.status(500).json({ error: 'Failed to get user activity report' });
  }
};

/**
 * GET /api/admin/reports/transactions - Get transaction report
 */
export const getTransactionReport = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, type, startDate, endDate, limit = '100', offset = '0' } = req.query;

    const whereClause: any = {};

    if (userId) whereClause.userId = userId as string;
    if (type) whereClause.type = type as string;
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate as string);
      if (endDate) whereClause.createdAt.lte = new Date(endDate as string);
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    const total = await prisma.transaction.count({ where: whereClause });

    res.json({ transactions, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
  } catch (error: any) {
    console.error('Get transaction report error:', error);
    res.status(500).json({ error: 'Failed to get transaction report' });
  }
};

/**
 * GET /api/admin/reports/theme-performance - Get theme performance metrics
 */
export const getThemePerformance = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const themes = await prisma.theme.findMany({
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    const performance = await Promise.all(
      themes.map(async (theme) => {
        const spins = await prisma.spin.findMany({
          where: {
            themeId: theme.id,
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          select: {
            betAmount: true,
            winAmount: true,
            userId: true,
          },
        });

        const totalSpins = spins.length;
        const totalBet = spins.reduce((sum, s) => sum + s.betAmount, 0);
        const totalWin = spins.reduce((sum, s) => sum + s.winAmount, 0);
        const uniqueUsers = new Set(spins.map((s) => s.userId)).size;
        const rtp = totalBet > 0 ? (totalWin / totalBet) * 100 : 0;

        return {
          themeId: theme.id,
          themeName: theme.name,
          status: theme.status,
          totalSpins,
          totalBet,
          totalWin,
          uniqueUsers,
          rtp,
          avgBetPerSpin: totalSpins > 0 ? totalBet / totalSpins : 0,
        };
      })
    );

    res.json({ performance, period: { start, end } });
  } catch (error: any) {
    console.error('Get theme performance error:', error);
    res.status(500).json({ error: 'Failed to get theme performance' });
  }
};

/**
 * GET /api/admin/reports/admin-logs - Get admin activity logs
 */
export const getAdminLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { adminId, action, startDate, endDate, limit = '100', offset = '0' } = req.query;

    const whereClause: any = {};

    if (adminId) whereClause.adminId = adminId as string;
    if (action) whereClause.action = action as string;
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate as string);
      if (endDate) whereClause.createdAt.lte = new Date(endDate as string);
    }

    const logs = await prisma.adminLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
          },
        },
      },
    });

    const total = await prisma.adminLog.count({ where: whereClause });

    res.json({ logs, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
  } catch (error: any) {
    console.error('Get admin logs error:', error);
    res.status(500).json({ error: 'Failed to get admin logs' });
  }
};
