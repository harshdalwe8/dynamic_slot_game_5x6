import prisma from '../config/db';
import { TransactionType } from '@prisma/client';

// Import socketService - will be lazy loaded to avoid circular dependency
let socketService: any = null;
const getSocketService = () => {
  if (!socketService) {
    try {
      socketService = require('../app').socketService;
    } catch (e) {
      // Socket service not available yet
    }
  }
  return socketService;
};

export interface WalletTransaction {
  userId: string;
  amount: number;
  type: TransactionType;
  reason: string;
  reference?: string;
  adminId?: string;
}

/**
 * Get user's wallet balance
 */
export async function getBalance(userId: string): Promise<number> {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { balance: true },
  });
  
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  
  return wallet.balance;
}

/**
 * Atomically update wallet and create transaction record
 */
export async function executeTransaction(transaction: WalletTransaction): Promise<{
  newBalance: number;
  transactionId: string;
}> {
  return await (prisma.$transaction as any)(async (tx: any) => {
    // Get current wallet
    const wallet = await tx.wallet.findUnique({
      where: { userId: transaction.userId },
    });
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    
    // Calculate new balance
    const newBalance = wallet.balance + transaction.amount;
    
    // Prevent negative balance
    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }
    
    // Update wallet
    await tx.wallet.update({
      where: { userId: transaction.userId },
      data: { balance: newBalance },
    });
    
    // Create transaction record
    const txRecord = await tx.transaction.create({
      data: {
        userId: transaction.userId,
        amount: transaction.amount,
        type: transaction.type,
        balanceAfter: newBalance,
        reference: transaction.reference,
        reason: transaction.reason,
        adminId: transaction.adminId,
      },
    });
    
    // Emit balance update via Socket.IO
    const socket = getSocketService();
    if (socket) {
      socket.emitBalanceUpdate(transaction.userId, newBalance, {
        id: txRecord.id,
        amount: transaction.amount,
        type: transaction.type,
        reason: transaction.reason,
      });
    }
    
    return {
      newBalance,
      transactionId: txRecord.id,
    };
  });
}

/**
 * Debit from wallet (for bets)
 */
export async function debit(
  userId: string,
  amount: number,
  reason: string,
  reference?: string
): Promise<{ newBalance: number; transactionId: string }> {
  return executeTransaction({
    userId,
    amount: -Math.abs(amount),
    type: 'DEBIT',
    reason,
    reference,
  });
}

/**
 * Credit to wallet (for wins)
 */
export async function credit(
  userId: string,
  amount: number,
  reason: string,
  reference?: string
): Promise<{ newBalance: number; transactionId: string }> {
  return executeTransaction({
    userId,
    amount: Math.abs(amount),
    type: 'CREDIT',
    reason,
    reference,
  });
}

/**
 * Execute spin transaction (debit bet, credit win in single transaction)
 */
export async function executeSpinTransaction(
  userId: string,
  betAmount: number,
  winAmount: number,
  spinId: string
): Promise<{ newBalance: number }> {
  // First get the current wallet balance
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  // Calculate net change
  const netChange = winAmount - betAmount;
  const newBalance = wallet.balance + netChange;

  // Prevent negative balance
  if (newBalance < 0) {
    throw new Error('Insufficient balance');
  }

  // Use batch transaction to execute all updates atomically
  await prisma.$transaction([
    // Update wallet balance
    prisma.wallet.update({
      where: { userId },
      data: { balance: newBalance },
    }),
    // Create debit transaction for bet
    prisma.transaction.create({
      data: {
        userId,
        amount: -betAmount,
        type: 'SPIN',
        balanceAfter: wallet.balance - betAmount,
        reference: spinId,
        reason: 'Spin bet',
      },
    }),
    // Create credit transaction for win (if any)
    ...(winAmount > 0 ? [
      prisma.transaction.create({
        data: {
          userId,
          amount: winAmount,
          type: 'WIN',
          balanceAfter: newBalance,
          reference: spinId,
          reason: 'Spin win',
        },
      }),
    ] : []),
  ]);

  return { newBalance };
}

/**
 * Get transaction history
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  return await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    select: {
      id: true,
      amount: true,
      type: true,
      balanceAfter: true,
      reference: true,
      reason: true,
      createdAt: true,
    },
  });
}

/**
 * Admin manual adjustment
 */
export async function adminAdjustment(
  userId: string,
  amount: number,
  reason: string,
  adminId: string
): Promise<{ newBalance: number; transactionId: string }> {
  return executeTransaction({
    userId,
    amount,
    type: 'MANUAL',
    reason,
    adminId,
    reference: `admin_adjustment_${Date.now()}`,
  });
}

/**
 * Apply referral bonus to a new user and optionally the referrer.
 * Both credits are executed atomically.
 */
export async function applyReferralBonus(
  newUserId: string,
  referrerUserId: string,
  newUserAmount: number,
  referrerAmount: number
): Promise<{ newUserBalance: number; referrerBalance?: number }> {
  return await (prisma.$transaction as any)(async (tx: any) => {
    // Validate wallets
    const [newUserWallet, refWallet] = await Promise.all([
      tx.wallet.findUnique({ where: { userId: newUserId } }),
      tx.wallet.findUnique({ where: { userId: referrerUserId } }),
    ]);
    if (!newUserWallet || !refWallet) {
      throw new Error('Wallet not found for referral participants');
    }

    // Credit new user
    const newUserBalance = newUserWallet.balance + Math.abs(newUserAmount);
    await tx.wallet.update({ where: { userId: newUserId }, data: { balance: newUserBalance } });
    await tx.transaction.create({
      data: {
        userId: newUserId,
        amount: Math.abs(newUserAmount),
        type: 'REFERRAL',
        balanceAfter: newUserBalance,
        reason: 'Referral signup bonus',
        reference: `referral_${referrerUserId}`,
      },
    });

    // Credit referrer if any amount specified
    let referrerBalance: number | undefined = undefined;
    if (referrerAmount && referrerAmount > 0) {
      const nextRefBalance = refWallet.balance + Math.abs(referrerAmount);
      await tx.wallet.update({ where: { userId: referrerUserId }, data: { balance: nextRefBalance } });
      await tx.transaction.create({
        data: {
          userId: referrerUserId,
          amount: Math.abs(referrerAmount),
          type: 'REFERRAL',
          balanceAfter: nextRefBalance,
          reason: 'Referral reward for inviting user',
          reference: `referral_${newUserId}`,
        },
      });
      referrerBalance = nextRefBalance;
    }

    return { newUserBalance, referrerBalance };
  });
}

/**
 * Redeem an admin-issued offer code for a user.
 * Validates code, usage, expiration, and per-user redemption.
 */
export async function redeemOfferCode(
  userId: string,
  code: string
): Promise<{ newBalance: number }> {
  return await (prisma.$transaction as any)(async (tx: any) => {
    const offer = await tx.offerCode.findUnique({ where: { code } });
    if (!offer || !offer.active) {
      throw new Error('Invalid or inactive offer code');
    }
    const now = new Date();
    if (offer.startsAt && offer.startsAt > now) {
      throw new Error('Offer code is not yet active');
    }
    if (offer.endsAt && offer.endsAt < now) {
      throw new Error('Offer code has expired');
    }
    if (offer.maxUsage && offer.usageCount >= offer.maxUsage) {
      throw new Error('Offer code usage limit reached');
    }

    // Prevent multiple redemption by same user
    const existingRedemption = await tx.offerRedemption.findFirst({
      where: { userId, offerCodeId: offer.id },
    });
    if (existingRedemption) {
      throw new Error('Offer code already redeemed');
    }

    // Credit wallet and create coupon transaction
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error('Wallet not found');
    const newBalance = wallet.balance + Math.abs(offer.amount);
    await tx.wallet.update({ where: { userId }, data: { balance: newBalance } });
    await tx.transaction.create({
      data: {
        userId,
        amount: Math.abs(offer.amount),
        type: 'COUPON',
        balanceAfter: newBalance,
        reason: 'Signup offer code',
        reference: `offer_${offer.code}`,
      },
    });

    // Update offer usage and record redemption
    await tx.offerCode.update({
      where: { id: offer.id },
      data: { usageCount: offer.usageCount + 1 },
    });
    await tx.offerRedemption.create({
      data: { userId, offerCodeId: offer.id },
    });

    // Emit balance update via socket
    const socket = getSocketService();
    if (socket) {
      socket.emitBalanceUpdate(userId, newBalance, {
        id: `offer_${offer.code}`,
        amount: Math.abs(offer.amount),
        type: 'COUPON',
        reason: 'Signup offer code',
      });
    }

    return { newBalance };
  });
}
