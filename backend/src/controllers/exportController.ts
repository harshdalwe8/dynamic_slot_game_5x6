import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { Parser } from 'json2csv';
import { getRTPBreakdown } from '../services/rtpService';

/**
 * GET /api/admin/export/spins - Export spin logs to CSV
 */
export const exportSpinsCSV = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, themeId, startDate, endDate } = req.query;

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
      include: {
        user: {
          select: {
            email: true,
            displayName: true,
          },
        },
        theme: {
          select: {
            name: true,
          },
        },
      },
    });

    const csvData = spins.map((spin) => ({
      spinId: spin.id,
      userId: spin.userId,
      userEmail: spin.user.email,
      userName: spin.user.displayName,
      themeId: spin.themeId,
      themeName: spin.theme.name,
      betAmount: spin.betAmount,
      winAmount: spin.winAmount,
      rtp: spin.rtpApplied,
      seed: spin.seed,
      createdAt: spin.createdAt.toISOString(),
    }));

    const parser = new Parser();
    const csv = parser.parse(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=spins-${Date.now()}.csv`);
    res.send(csv);

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'EXPORT_SPINS',
        objectType: 'spin',
        objectId: 'bulk',
        payload: { count: spins.length, filters: whereClause },
        ip: req.ip || 'unknown',
      },
    });
  } catch (error: any) {
    console.error('Export spins CSV error:', error);
    res.status(500).json({ error: 'Failed to export spins' });
  }
};

/**
 * GET /api/admin/export/transactions - Export transactions to CSV
 */
export const exportTransactionsCSV = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, type, startDate, endDate } = req.query;

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
      include: {
        user: {
          select: {
            email: true,
            displayName: true,
          },
        },
      },
    });

    const csvData = transactions.map((tx) => ({
      transactionId: tx.id,
      userId: tx.userId,
      userEmail: tx.user.email,
      userName: tx.user.displayName,
      amount: tx.amount,
      type: tx.type,
      balanceAfter: tx.balanceAfter,
      reference: tx.reference || '',
      reason: tx.reason,
      adminId: tx.adminId || '',
      createdAt: tx.createdAt.toISOString(),
    }));

    const parser = new Parser();
    const csv = parser.parse(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions-${Date.now()}.csv`);
    res.send(csv);

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'EXPORT_TRANSACTIONS',
        objectType: 'transaction',
        objectId: 'bulk',
        payload: { count: transactions.length, filters: whereClause },
        ip: req.ip || 'unknown',
      },
    });
  } catch (error: any) {
    console.error('Export transactions CSV error:', error);
    res.status(500).json({ error: 'Failed to export transactions' });
  }
};

/**
 * GET /api/admin/export/users - Export users to CSV
 */
export const exportUsersCSV = async (req: AuthRequest, res: Response) => {
  try {
    const { role, status, startDate, endDate } = req.query;

    const whereClause: any = {};

    if (role) whereClause.role = role as string;
    if (status) whereClause.status = status as string;
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate as string);
      if (endDate) whereClause.createdAt.lte = new Date(endDate as string);
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
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

    const csvData = users.map((user) => ({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      balance: user.wallets[0]?.balance || 0,
      currency: user.wallets[0]?.currency || 'COINS',
      totalSpins: user._count.spins,
      totalTransactions: user._count.transactions,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString() || '',
    }));

    const parser = new Parser();
    const csv = parser.parse(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=users-${Date.now()}.csv`);
    res.send(csv);

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'EXPORT_USERS',
        objectType: 'user',
        objectId: 'bulk',
        payload: { count: users.length, filters: whereClause },
        ip: req.ip || 'unknown',
      },
    });
  } catch (error: any) {
    console.error('Export users CSV error:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
};

/**
 * GET /api/admin/export/rtp - Export RTP report to CSV
 */
export const exportRTPReportCSV = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const breakdown = await getRTPBreakdown(start, end);

    const csvRows = breakdown.map((row) => ({
      themeId: row.themeId,
      themeName: row.themeName,
      status: row.status,
      totalSpins: row.totalSpins,
      totalBet: row.totalBet,
      totalWin: row.totalWin,
      rtp: row.rtp.toFixed(2),
      period: `${start.toISOString()} to ${end.toISOString()}`,
    }));

    const parser = new Parser();
    const csv = parser.parse(csvRows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=rtp-report-${Date.now()}.csv`);
    res.send(csv);

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'EXPORT_RTP_REPORT',
        objectType: 'report',
        objectId: 'rtp',
        payload: { 
          themes: breakdown.length, 
          period: { 
            start: start.toISOString(), 
            end: end.toISOString() 
          } 
        },
        ip: req.ip || 'unknown',
      },
    });
  } catch (error: any) {
    console.error('Export RTP report CSV error:', error);
    res.status(500).json({ error: 'Failed to export RTP report' });
  }
};

/**
 * GET /api/admin/export/admin-logs - Export admin logs to CSV
 */
export const exportAdminLogsCSV = async (req: AuthRequest, res: Response) => {
  try {
    const { adminId, action, startDate, endDate } = req.query;

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
      include: {
        admin: {
          select: {
            email: true,
            displayName: true,
            role: true,
          },
        },
      },
    });

    const csvData = logs.map((log) => ({
      logId: log.id,
      adminId: log.adminId,
      adminEmail: log.admin.email,
      adminName: log.admin.displayName,
      adminRole: log.admin.role,
      action: log.action,
      objectType: log.objectType,
      objectId: log.objectId,
      payload: JSON.stringify(log.payload),
      ip: log.ip,
      createdAt: log.createdAt.toISOString(),
    }));

    const parser = new Parser();
    const csv = parser.parse(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=admin-logs-${Date.now()}.csv`);
    res.send(csv);
  } catch (error: any) {
    console.error('Export admin logs CSV error:', error);
    res.status(500).json({ error: 'Failed to export admin logs' });
  }
};
