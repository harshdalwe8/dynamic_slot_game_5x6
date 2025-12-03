import prisma from '../config/db';

type LeaderboardType = 'TOTAL_WINS' | 'BIGGEST_WIN' | 'MOST_SPINS' | 'HIGHEST_BALANCE';
type LeaderboardPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';

/**
 * Generate leaderboard for a specific type and period
 */
export const generateLeaderboard = async (
  type: LeaderboardType,
  period: LeaderboardPeriod
) => {
  try {
    const { startDate, endDate } = getDateRange(period);

    // Get user data based on type
    let entries: any[] = [];

    switch (type) {
      case 'TOTAL_WINS':
        entries = await getTotalWinsLeaderboard(startDate, endDate);
        break;
      case 'BIGGEST_WIN':
        entries = await getBiggestWinLeaderboard(startDate, endDate);
        break;
      case 'MOST_SPINS':
        entries = await getMostSpinsLeaderboard(startDate, endDate);
        break;
      case 'HIGHEST_BALANCE':
        entries = await getHighestBalanceLeaderboard();
        break;
    }

    // Create leaderboard
    const leaderboard = await prisma.leaderboard.create({
      data: {
        type,
        period,
        startDate,
        endDate,
      },
    });

    // Create leaderboard entries with ranks
    const rankedEntries = entries.map((entry, index) => ({
      leaderboardId: leaderboard.id,
      userId: entry.userId,
      userEmail: entry.email,
      displayName: entry.displayName,
      score: entry.score,
      rank: index + 1,
    }));

    await prisma.leaderboardEntry.createMany({
      data: rankedEntries,
    });

    return {
      ...leaderboard,
      entries: rankedEntries,
    };
  } catch (error) {
    console.error('Generate leaderboard error:', error);
    throw error;
  }
};

/**
 * Get current leaderboard
 */
export const getLeaderboard = async (type: LeaderboardType, period: LeaderboardPeriod) => {
  try {
    const { startDate, endDate } = getDateRange(period);

    const leaderboard = await prisma.leaderboard.findFirst({
      where: {
        type,
        period,
        startDate: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        entries: {
          orderBy: {
            rank: 'asc',
          },
          take: 100, // Top 100
        },
      },
    });

    if (!leaderboard) {
      // Generate new leaderboard if not found
      return await generateLeaderboard(type, period);
    }

    return leaderboard;
  } catch (error) {
    console.error('Get leaderboard error:', error);
    throw error;
  }
};

/**
 * Get user rank in leaderboard
 */
export const getUserRank = async (
  userId: string,
  type: LeaderboardType,
  period: LeaderboardPeriod
) => {
  try {
    const leaderboard = await getLeaderboard(type, period);

    const userEntry = leaderboard.entries.find((entry) => entry.userId === userId);

    return {
      rank: userEntry?.rank || null,
      score: userEntry?.score || 0,
      total: leaderboard.entries.length,
    };
  } catch (error) {
    console.error('Get user rank error:', error);
    throw error;
  }
};

/**
 * Helper: Get date range for period
 */
function getDateRange(period: LeaderboardPeriod): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = now;
  let startDate: Date;

  switch (period) {
    case 'DAILY':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'WEEKLY':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'MONTHLY':
      startDate = new Date(now);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'ALL_TIME':
      startDate = new Date(0); // Unix epoch
      break;
    default:
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
  }

  return { startDate, endDate };
}

/**
 * Helper: Get total wins leaderboard
 */
async function getTotalWinsLeaderboard(startDate: Date, endDate: Date) {
  const results = await prisma.transaction.groupBy({
    by: ['userId'],
    where: {
      type: 'WIN',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
    orderBy: {
      _sum: {
        amount: 'desc',
      },
    },
    take: 100,
  });

  const userIds = results.map((r) => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  });

  return results.map((result) => {
    const user = users.find((u) => u.id === result.userId);
    return {
      userId: result.userId,
      email: user?.email || '',
      displayName: user?.displayName || '',
      score: result._sum.amount || 0,
    };
  });
}

/**
 * Helper: Get biggest win leaderboard
 */
async function getBiggestWinLeaderboard(startDate: Date, endDate: Date) {
  const spins = await prisma.spin.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
        },
      },
    },
    orderBy: {
      winAmount: 'desc',
    },
    take: 100,
  });

  // Group by user and get max win
  const userMaxWins = new Map<
    string,
    { userId: string; email: string; displayName: string; score: number }
  >();

  for (const spin of spins) {
    const existing = userMaxWins.get(spin.userId);
    if (!existing || spin.winAmount > existing.score) {
      userMaxWins.set(spin.userId, {
        userId: spin.userId,
        email: spin.user.email,
        displayName: spin.user.displayName,
        score: spin.winAmount,
      });
    }
  }

  return Array.from(userMaxWins.values()).sort((a, b) => b.score - a.score);
}

/**
 * Helper: Get most spins leaderboard
 */
async function getMostSpinsLeaderboard(startDate: Date, endDate: Date) {
  const results = await prisma.spin.groupBy({
    by: ['userId'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 100,
  });

  const userIds = results.map((r) => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  });

  return results.map((result) => {
    const user = users.find((u) => u.id === result.userId);
    return {
      userId: result.userId,
      email: user?.email || '',
      displayName: user?.displayName || '',
      score: result._count.id,
    };
  });
}

/**
 * Helper: Get highest balance leaderboard
 */
async function getHighestBalanceLeaderboard() {
  const wallets = await prisma.wallet.findMany({
    orderBy: {
      balance: 'desc',
    },
    take: 100,
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

  return wallets.map((wallet) => ({
    userId: wallet.userId,
    email: wallet.user.email,
    displayName: wallet.user.displayName,
    score: wallet.balance,
  }));
}

/**
 * Refresh all leaderboards (for cron job)
 */
export const refreshAllLeaderboards = async () => {
  try {
    const types: LeaderboardType[] = [
      'TOTAL_WINS',
      'BIGGEST_WIN',
      'MOST_SPINS',
      'HIGHEST_BALANCE',
    ];
    const periods: LeaderboardPeriod[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME'];

    for (const type of types) {
      for (const period of periods) {
        await generateLeaderboard(type, period);
      }
    }

    console.log('All leaderboards refreshed successfully');
  } catch (error) {
    console.error('Refresh leaderboards error:', error);
    throw error;
  }
};
