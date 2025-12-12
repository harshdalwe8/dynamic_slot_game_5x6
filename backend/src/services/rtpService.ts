import prisma from '../config/db';

/**
 * Calculate RTP for a specific theme over a time window
 */
export async function calculateThemeRTP(
  themeId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const spins = await prisma.spin.findMany({
    where: {
      themeId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      betAmount: true,
      winAmount: true,
    },
  });

  if (spins.length === 0) {
    return 0;
  }

  const totalBet = spins.reduce((sum, spin) => sum + spin.betAmount, 0);
  const totalWin = spins.reduce((sum, spin) => sum + spin.winAmount, 0);

  return totalBet > 0 ? (totalWin / totalBet) * 100 : 0;
}

/**
 * Calculate global RTP across all themes
 */
export async function calculateGlobalRTP(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const spins = await prisma.spin.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      betAmount: true,
      winAmount: true,
    },
  });

  if (spins.length === 0) {
    return 0;
  }

  const totalBet = spins.reduce((sum, spin) => sum + spin.betAmount, 0);
  const totalWin = spins.reduce((sum, spin) => sum + spin.winAmount, 0);

  return totalBet > 0 ? (totalWin / totalBet) * 100 : 0;
}

/**
 * Create RTP snapshot for a theme
 */
export async function createRTPSnapshot(
  themeId: string,
  startDate: Date,
  endDate: Date
): Promise<void> {
  const rtp = await calculateThemeRTP(themeId, startDate, endDate);

  await prisma.rTPSnapshot.create({
    data: {
      themeId,
      calculatedRTP: rtp,
      windowStart: startDate,
      windowEnd: endDate,
    },
  });
}

/**
 * Get RTP snapshots for a theme
 */
export async function getThemeRTPHistory(
  themeId: string,
  limit: number = 30
) {
  return await prisma.rTPSnapshot.findMany({
    where: { themeId },
    orderBy: { windowEnd: 'desc' },
    take: limit,
  });
}

/**
 * Get current RTP for all active themes
 */
export async function getCurrentRTPForAllThemes() {
  const themes = await prisma.theme.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true },
  });

  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const rtpData = await Promise.all(
    themes.map(async (theme) => {
      const rtp = await calculateThemeRTP(theme.id, last24Hours, now);
      const spinCount = await prisma.spin.count({
        where: {
          themeId: theme.id,
          createdAt: {
            gte: last24Hours,
            lte: now,
          },
        },
      });

      return {
        themeId: theme.id,
        themeName: theme.name,
        rtp,
        spinCount,
        period: '24h',
      };
    })
  );

  return rtpData;
}

/**
 * Get RTP statistics with breakdown
 */
export async function getRTPStatistics(
  themeId?: string,
  startDate?: Date,
  endDate?: Date
) {
  const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  const whereClause: any = {
    createdAt: {
      gte: start,
      lte: end,
    },
  };

  if (themeId) {
    whereClause.themeId = themeId;
  }

  const spins = await prisma.spin.findMany({
    where: whereClause,
    select: {
      betAmount: true,
      winAmount: true,
      themeId: true,
      theme: {
        select: {
          name: true,
        },
      },
    },
  });

  const totalBet = spins.reduce((sum, spin) => sum + spin.betAmount, 0);
  const totalWin = spins.reduce((sum, spin) => sum + spin.winAmount, 0);
  const totalSpins = spins.length;
  const avgBet = totalSpins > 0 ? totalBet / totalSpins : 0;
  const avgWin = totalSpins > 0 ? totalWin / totalSpins : 0;

  // Calculate win distribution
  const wins = spins.filter((s) => s.winAmount > 0).length;
  const losses = spins.filter((s) => s.winAmount === 0).length;
  const bigWins = spins.filter((s) => s.winAmount >= s.betAmount * 10).length;

  return {
    period: {
      start,
      end,
    },
    overall: {
      rtp: totalBet > 0 ? (totalWin / totalBet) * 100 : 0,
      totalSpins,
      totalBet,
      totalWin,
      avgBet,
      avgWin,
    },
    distribution: {
      wins,
      losses,
      bigWins,
      winRate: totalSpins > 0 ? (wins / totalSpins) * 100 : 0,
    },
  };
}

/**
 * Get RTP breakdown per theme (aggregated) for CSV/export and dashboards
 */
export async function getRTPBreakdown(
  startDate?: Date,
  endDate?: Date,
  themeId?: string
) {
  const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  const themeWhere = themeId
    ? { id: themeId }
    : { status: 'ACTIVE' as const };

  const themes = await prisma.theme.findMany({
    where: themeWhere,
    select: { id: true, name: true, status: true },
  });

  const breakdown = await Promise.all(
    themes.map(async (theme) => {
      const aggregate = await prisma.spin.aggregate({
        where: {
          themeId: theme.id,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        _sum: {
          betAmount: true,
          winAmount: true,
        },
        _count: true,
      });

      const totalSpins = aggregate._count;
      const totalBet = Number(aggregate._sum.betAmount || 0);
      const totalWin = Number(aggregate._sum.winAmount || 0);
      const rtp = totalBet > 0 ? (totalWin / totalBet) * 100 : 0;

      return {
        themeId: theme.id,
        themeName: theme.name,
        status: theme.status,
        totalSpins,
        totalBet,
        totalWin,
        rtp,
        period: {
          start,
          end,
        },
      };
    })
  );

  return breakdown;
}

/**
 * Generate daily RTP snapshots for all active themes (cron job)
 */
export async function generateDailyRTPSnapshots() {
  const themes = await prisma.theme.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  for (const theme of themes) {
    await createRTPSnapshot(theme.id, yesterday, now);
  }

  console.log(`Generated RTP snapshots for ${themes.length} themes`);
}
