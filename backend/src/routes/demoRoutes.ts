import { Router, Request, Response } from 'express';
import { executeSpin, ThemeConfig } from '../services/slotEngine';
import prisma from '../config/db';

const demoRoutes = Router();

/**
 * POST /api/demo/spin - Execute a demo spin without wallet deduction
 * No authentication required
 * Returns mock spin results for theme preview
 */
demoRoutes.post('/spin', async (req: Request, res: Response) => {
  try {
    const { themeId, betAmount } = req.body;

    // Validate inputs
    if (!themeId || !betAmount) {
      return res.status(400).json({ error: 'Theme ID and bet amount are required' });
    }

    if (betAmount <= 0 || !Number.isFinite(betAmount)) {
      return res.status(400).json({ error: 'Bet amount must be a positive number' });
    }

    // Load theme (no authentication check for demo)
    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    // Parse theme configuration
    const jsonSchema = theme.jsonSchema as any;
    const themeConfig = jsonSchema as unknown as ThemeConfig;

    // Validate theme config
    if (!themeConfig.grid || !themeConfig.symbols || !themeConfig.paylines) {
      return res.status(400).json({
        error: 'Invalid theme configuration',
      });
    }

    // Execute demo spin
    const spinResult = executeSpin(themeConfig, betAmount);

    // Return demo result (no wallet transaction, no logging)
    return res.status(200).json({
      result: spinResult.result,
      winAmount: spinResult.winAmount,
      winningLines: spinResult.winningLines,
      multiplier: spinResult.multiplier,
      rtpApplied: spinResult.rtpApplied,
    });
  } catch (error: any) {
    console.error('Demo spin error:', error);
    return res.status(500).json({
      error: 'Failed to execute demo spin',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/demo/themes/:themeId/preview - Get theme preview data
 * Returns theme configuration and metadata for preview
 */
demoRoutes.get('/themes/:themeId/preview', async (req: Request, res: Response) => {
  try {
    const { themeId } = req.params;

    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    // Return safe preview data (exclude sensitive config if needed)
    return res.status(200).json({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      minBet: (theme.jsonSchema as any).minBet || 10,
      maxBet: (theme.jsonSchema as any).maxBet || 500,
      rtp: (theme.jsonSchema as any).rtp || 96.5,
      status: theme.status,
      createdAt: theme.createdAt,
    });
  } catch (error: any) {
    console.error('Error fetching theme preview:', error);
    return res.status(500).json({
      error: 'Failed to fetch theme preview',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default demoRoutes;
