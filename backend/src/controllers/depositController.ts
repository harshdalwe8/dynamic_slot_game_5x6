import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';

/**
 * Utility to generate 12-char alphanumeric transaction ID
 */
function generateTransactionRef(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * POST /api/deposits/init - Initialize deposit (get payment link with generated transaction ID)
 */
export const initDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentLinkId, amount } = req.body;
    const userId = req.user!.id;

    // Validate inputs
    if (!paymentLinkId || !amount) {
      return res.status(400).json({ error: 'Payment link ID and amount are required' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Get payment link
    const paymentLink = await prisma.paymentLink.findUnique({
      where: { id: paymentLinkId },
    });

    if (!paymentLink) {
      return res.status(404).json({ error: 'Payment link not found' });
    }

    if (!paymentLink.active) {
      return res.status(400).json({ error: 'Payment link is not active' });
    }

    // Generate unique transaction reference
    let transactionRef = generateTransactionRef();
    let exists = await prisma.deposit.findUnique({ where: { transactionRef } });
    while (exists) {
      transactionRef = generateTransactionRef();
      exists = await prisma.deposit.findUnique({ where: { transactionRef } });
    }

    // Create deposit record
    const deposit = await prisma.deposit.create({
      data: {
        userId,
        paymentLinkId,
        amount: Math.floor(amount * 100), // Store in cents
        transactionRef,
        status: 'PENDING',
      },
    });

    // Generate UPI link
    const upiParams = new URLSearchParams({
      pa: paymentLink.payeeVPA,
      pn: encodeURIComponent(paymentLink.payeeName),
      am: amount.toFixed(2),
      cu: 'INR',
      tr: transactionRef,
      tn: encodeURIComponent(`Deposit via ${paymentLink.name}`),
    });
    const upiLink = `upi://pay?${upiParams.toString()}`;

    res.json({
      deposit: {
        id: deposit.id,
        transactionRef: deposit.transactionRef,
        amount: deposit.amount / 100,
        currency: 'INR',
        paymentLink: {
          name: paymentLink.name,
          payeeVPA: paymentLink.payeeVPA,
          payeeName: paymentLink.payeeName,
        },
      },
      upiLink,
    });
  } catch (error: any) {
    console.error('Init deposit error:', error);
    res.status(500).json({ error: 'Failed to initialize deposit' });
  }
};

/**
 * POST /api/deposits/:depositId/upload-screenshot - Upload payment screenshot
 */
export const uploadDepositScreenshot = async (req: AuthRequest, res: Response) => {
  try {
    const { depositId } = req.params;
    const userId = req.user!.id;

    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
    });

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    if (deposit.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (deposit.status !== 'PENDING') {
      return res.status(400).json({ error: 'Deposit is not in pending state' });
    }

    // TODO: Handle file upload to cloud storage (AWS S3, etc.)
    // For now, assume screenshotUrl is passed in body
    const { screenshotUrl } = req.body;

    if (!screenshotUrl) {
      return res.status(400).json({ error: 'Screenshot URL is required' });
    }

    // Update deposit status
    const updated = await prisma.deposit.update({
      where: { id: depositId },
      data: {
        screenshotUrl,
        status: 'SCREENSHOT_UPLOADED',
      },
    });

    res.json({ deposit: updated, message: 'Screenshot uploaded. Awaiting admin approval.' });
  } catch (error: any) {
    console.error('Upload deposit screenshot error:', error);
    res.status(500).json({ error: 'Failed to upload screenshot' });
  }
};

/**
 * GET /api/deposits/my - Get current user's deposits
 */
export const getMyDeposits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, limit = '50', offset = '0' } = req.query;

    const where: any = { userId };
    if (status) where.status = status;

    const deposits = await prisma.deposit.findMany({
      where,
      include: {
        paymentLink: { select: { name: true, payeeVPA: true, payeeName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.deposit.count({ where });

    res.json({ deposits, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
  } catch (error: any) {
    console.error('Get my deposits error:', error);
    res.status(500).json({ error: 'Failed to get deposits' });
  }
};

/**
 * GET /api/deposits/:depositId - Get single deposit details
 */
export const getDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const { depositId } = req.params;
    const userId = req.user!.id;

    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
      include: {
        paymentLink: true,
      },
    });

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    // Check ownership (unless admin)
    if (deposit.userId !== userId && !['SUPER_ADMIN', 'SUPPORT_STAFF'].includes(req.user!.role as string)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({ deposit });
  } catch (error: any) {
    console.error('Get deposit error:', error);
    res.status(500).json({ error: 'Failed to get deposit' });
  }
};

/**
 * GET /api/payment-links/active - Get active payment links for player
 */
export const getActivePaymentLinks = async (req: AuthRequest, res: Response) => {
  try {
    const paymentLinks = await prisma.paymentLink.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        payeeVPA: true,
        payeeName: true,
      },
    });

    res.json({ paymentLinks });
  } catch (error: any) {
    console.error('Get active payment links error:', error);
    res.status(500).json({ error: 'Failed to get payment links' });
  }
};
