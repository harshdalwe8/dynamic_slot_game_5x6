import prisma from '../config/db';

/**
 * Check and unlock achievements for a user based on their activity
 */
export const checkAndUnlockAchievements = async (userId: string) => {
  try {
    // Get all achievements
    const achievements = await prisma.achievement.findMany();

    // Get user stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        spins: true,
        transactions: {
          where: { type: 'WIN' },
        },
        wallets: true,
        achievements: {
          include: {
            achievement: true,
          },
        },
      },
    });

    if (!user) return [];

    const totalSpins = user.spins.length;
    const totalWins = user.transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const biggestWin = Math.max(...user.spins.map((s) => s.winAmount), 0);
    const currentBalance = user.wallets[0]?.balance || 0;

    const unlockedAchievements = [];

    for (const achievement of achievements) {
      // Check if already unlocked
      const alreadyUnlocked = user.achievements.some(
        (ua) => ua.achievementId === achievement.id
      );

      if (alreadyUnlocked) continue;

      // Check if requirements are met
      const requirement = achievement.requirement as any;
      let meetsRequirement = false;

      switch (requirement.type) {
        case 'spins':
          meetsRequirement = totalSpins >= requirement.count;
          break;
        case 'total_wins':
          meetsRequirement = totalWins >= requirement.amount;
          break;
        case 'biggest_win':
          meetsRequirement = biggestWin >= requirement.amount;
          break;
        case 'balance':
          meetsRequirement = currentBalance >= requirement.amount;
          break;
        case 'consecutive_wins':
          // Check last N spins for consecutive wins
          const lastNSpins = user.spins.slice(-requirement.count);
          meetsRequirement =
            lastNSpins.length === requirement.count &&
            lastNSpins.every((s) => s.winAmount > 0);
          break;
        default:
          meetsRequirement = false;
      }

      if (meetsRequirement) {
        // Unlock achievement and grant reward
        await (prisma.$transaction as any)(async (tx: any) => {
          // Create user achievement
          await tx.userAchievement.create({
            data: {
              userId,
              achievementId: achievement.id,
              progress: 100,
            },
          });

          // Credit reward to wallet
          if (achievement.reward > 0) {
            const wallet = await tx.wallet.findUnique({
              where: { userId },
            });

            if (wallet) {
              const newBalance = wallet.balance + achievement.reward;

              await tx.wallet.update({
                where: { userId },
                data: { balance: newBalance },
              });

              await tx.transaction.create({
                data: {
                  userId,
                  amount: achievement.reward,
                  type: 'BONUS',
                  balanceAfter: newBalance,
                  reason: `Achievement unlocked: ${achievement.name}`,
                },
              });
            }
          }
        });

        unlockedAchievements.push(achievement);
      }
    }

    return unlockedAchievements;
  } catch (error) {
    console.error('Check achievements error:', error);
    return [];
  }
};

/**
 * Get all achievements with user progress
 */
export const getUserAchievements = async (userId: string) => {
  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
    });

    const achievementsWithProgress = achievements.map((achievement) => {
      const userAchievement = userAchievements.find(
        (ua) => ua.achievementId === achievement.id
      );

      return {
        ...achievement,
        unlocked: !!userAchievement,
        unlockedAt: userAchievement?.unlockedAt || null,
        progress: userAchievement?.progress || 0,
      };
    });

    return achievementsWithProgress;
  } catch (error) {
    console.error('Get user achievements error:', error);
    throw error;
  }
};

/**
 * Get achievement statistics
 */
export const getAchievementStats = async () => {
  try {
    const totalAchievements = await prisma.achievement.count();

    const unlockedStats = await prisma.userAchievement.groupBy({
      by: ['achievementId'],
      _count: {
        userId: true,
      },
    });

    const achievements = await prisma.achievement.findMany();

    const statsWithDetails = achievements.map((achievement) => {
      const stat = unlockedStats.find((s) => s.achievementId === achievement.id);
      const unlockedCount = stat?._count.userId || 0;

      return {
        id: achievement.id,
        code: achievement.code,
        name: achievement.name,
        category: achievement.category,
        totalUnlocked: unlockedCount,
        reward: achievement.reward,
      };
    });

    return {
      totalAchievements,
      achievements: statsWithDetails,
    };
  } catch (error) {
    console.error('Get achievement stats error:', error);
    throw error;
  }
};

/**
 * Create a new achievement (admin)
 */
export const createAchievement = async (data: {
  code: string;
  name: string;
  description: string;
  icon: string;
  requirement: any;
  reward: number;
  category: string;
}) => {
  try {
    const achievement = await prisma.achievement.create({
      data,
    });

    return achievement;
  } catch (error) {
    console.error('Create achievement error:', error);
    throw error;
  }
};

/**
 * Delete an achievement (admin)
 */
export const deleteAchievement = async (achievementId: string) => {
  try {
    // Delete user achievements first
    await prisma.userAchievement.deleteMany({
      where: { achievementId },
    });

    // Delete achievement
    await prisma.achievement.delete({
      where: { id: achievementId },
    });

    return true;
  } catch (error) {
    console.error('Delete achievement error:', error);
    throw error;
  }
};
