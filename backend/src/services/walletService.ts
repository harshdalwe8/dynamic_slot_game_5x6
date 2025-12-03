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
  return await (prisma.$transaction as any)(async (tx: any) => {
    // Get current wallet
    const wallet = await tx.wallet.findUnique({
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
    
    // Update wallet
    await tx.wallet.update({
      where: { userId },
      data: { balance: newBalance },
    });
    
    // Create debit transaction for bet
    await tx.transaction.create({
      data: {
        userId,
        amount: -betAmount,
        type: 'SPIN',
        balanceAfter: wallet.balance - betAmount,
        reference: spinId,
        reason: 'Spin bet',
      },
    });
    
    // Create credit transaction for win (if any)
    if (winAmount > 0) {
      await tx.transaction.create({
        data: {
          userId,
          amount: winAmount,
          type: 'WIN',
          balanceAfter: newBalance,
          reference: spinId,
          reason: 'Spin win',
        },
      });
    }
    
    return { newBalance };
  });
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
