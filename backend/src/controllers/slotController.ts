import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { executeSpin, replaySpin, ThemeConfig } from '../services/slotEngine';
import { executeSpinTransaction, getBalance } from '../services/walletService';
import { checkAndUnlockAchievements } from '../services/achievementService';
import { getSocketService } from '../services/socketServiceInstance';

/**
 * POST /api/spin - Execute a slot machine spin
 */
export const spin = async (req: AuthRequest, res: Response) => {
  try {
    const { themeId, betAmount } = req.body;
    const userId = req.user!.id;

    // Validate inputs
    if (!themeId || !betAmount) {
      return res.status(400).json({ error: 'Theme ID and bet amount are required' });
    }

    if (betAmount <= 0) {
      return res.status(400).json({ error: 'Bet amount must be positive' });
    }

    // Get current balance
    const currentBalance = await getBalance(userId);
    if (currentBalance < betAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Load active theme
    const theme = await prisma.theme.findFirst({
      where: {
        id: themeId,
        status: 'ACTIVE',
      },
    });

    if (!theme) {
      return res.status(404).json({ error: 'Theme not found or not active' });
    }

    // Parse theme configuration - support both manifest and strict schema formats
    const jsonSchema = theme.jsonSchema as any;
    
    // Check if this is the UI manifest format (has components and base_path)
    if (Array.isArray(jsonSchema.components) && typeof jsonSchema.base_path === 'string') {
      return res.status(400).json({ 
        error: 'Theme must be configured with full schema before playing. Please ensure theme has grid, symbols, and paylines configured.' 
      });
    }

    // Parse as strict schema format
    const themeConfig = jsonSchema as unknown as ThemeConfig;

    // Validate theme config has all required properties for spinning
    if (!themeConfig.grid || !themeConfig.symbols || !themeConfig.paylines) {
      return res.status(400).json({
        error: 'Invalid theme configuration. Theme must have grid, symbols, and paylines.',
      });
    }

    if (!Array.isArray(themeConfig.symbols) || themeConfig.symbols.length === 0) {
      return res.status(400).json({
        error: 'Invalid theme configuration. Theme must have at least one symbol.',
      });
    }

    // Validate global RTP limits (ensure theme config doesn't bypass limits)
    const globalMinRtp = parseFloat(process.env.GLOBAL_MIN_RTP || '85');
    const globalMaxRtp = parseFloat(process.env.GLOBAL_MAX_RTP || '98');

    // Execute spin on server
    const spinResult = executeSpin(themeConfig, betAmount);

    // Calculate RTP for this spin
    const rtpApplied = spinResult.winAmount / betAmount;

    // Store spin log
    const spinLog = await prisma.spin.create({
      data: {
        userId,
        themeId,
        betAmount,
        resultMatrix: spinResult.matrix as any,
        winAmount: spinResult.winAmount,
        seed: spinResult.seed,
        rtpApplied,
      },
    });

    // Execute wallet transaction atomically
    const { newBalance } = await executeSpinTransaction(
      userId,
      betAmount,
      spinResult.winAmount,
      spinLog.id
    );

    // Check and unlock achievements after spin
    const unlockedAchievements = await checkAndUnlockAchievements(userId);

    // Emit realtime events to client
    const socketService = getSocketService();
    if (socketService) {
      socketService.emitSpinResult(userId, {
        ...spinResult,
        spinId: spinLog.id,
      });
      socketService.emitBalanceUpdate(userId, newBalance, {
        betAmount,
        winAmount: spinResult.winAmount,
        spinId: spinLog.id,
      });
      if (unlockedAchievements.length > 0) {
        unlockedAchievements.forEach((achievement) =>
          socketService.emitAchievementUnlocked(userId, achievement)
        );
      }
    }

    // Return result to client
    res.json({
      spinId: spinLog.id,
      matrix: spinResult.matrix,
      winAmount: spinResult.winAmount,
      newBalance,
      winningLines: spinResult.winningLines,
      bonusTriggered: spinResult.bonusTriggered,
      jackpotWon: spinResult.jackpotWon,
      auditId: spinLog.id,
      achievements: unlockedAchievements.length > 0 ? unlockedAchievements : undefined,
    });
  } catch (error: any) {
    console.error('Spin error:', error);
    res.status(500).json({ error: error.message || 'Spin failed' });
  }
};

/**
 * GET /api/spin/history - Get user's spin history
 */
export const getSpinHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const spins = await prisma.spin.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        themeId: true,
        betAmount: true,
        winAmount: true,
        createdAt: true,
        theme: {
          select: {
            name: true,
          },
        },
      },
    });

    res.json({ spins });
  } catch (error: any) {
    console.error('Get spin history error:', error);
    res.status(500).json({ error: 'Failed to get spin history' });
  }
};

/**
 * GET /api/spin/audit/:spinId - Replay a spin for auditing (admin only)
 */
export const auditSpin = async (req: AuthRequest, res: Response) => {
  try {
    const { spinId } = req.params;

    // Get spin log
    const spin = await prisma.spin.findUnique({
      where: { id: spinId },
      include: {
        theme: true,
      },
    });

    if (!spin) {
      return res.status(404).json({ error: 'Spin not found' });
    }

    // Parse theme configuration
    const themeConfig = spin.theme.jsonSchema as unknown as ThemeConfig;

    // Replay spin with stored seed
    const replayResult = replaySpin(themeConfig, spin.betAmount, spin.seed);

    // Verify result matches
    const resultMatches =
      JSON.stringify(replayResult.matrix) === JSON.stringify(spin.resultMatrix) &&
      replayResult.winAmount === spin.winAmount;

    res.json({
      spinId: spin.id,
      userId: spin.userId,
      themeId: spin.themeId,
      betAmount: spin.betAmount,
      winAmount: spin.winAmount,
      seed: spin.seed,
      originalMatrix: spin.resultMatrix,
      replayMatrix: replayResult.matrix,
      resultMatches,
      replayWinAmount: replayResult.winAmount,
      createdAt: spin.createdAt,
    });
  } catch (error: any) {
    console.error('Audit spin error:', error);
    res.status(500).json({ error: 'Audit failed' });
  }
};

/**
 * GET /api/themes - Get all active themes
 */
export const getActiveThemes = async (req: AuthRequest, res: Response) => {
  try {
    const themes = await prisma.theme.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        version: true,
        jsonSchema: true,
        assetManifest: true,
        createdAt: true,
      },
    });

    res.json({ themes });
  } catch (error: any) {
    console.error('Get themes error:', error);
    res.status(500).json({ error: 'Failed to get themes' });
  }
};

/**
 * GET /api/wallet - Get user's wallet info
 */
export const getWallet = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: {
        balance: true,
        currency: true,
        updatedAt: true,
      },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({ wallet });
  } catch (error: any) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: 'Failed to get wallet' });
  }
};