import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { applyReferralBonus, redeemOfferCode } from '../services/walletService';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, referralCode, offerCode } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and display name are required' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Prepare optional referral linkage
    let referredById: string | undefined = undefined;
    const referralProvided = Boolean(referralCode);
    let referralValid = false;
    let referralApplied = false;
    if (referralCode) {
      const referrer = await prisma.user.findFirst({ where: { referralCode } });
      if (referrer) {
        referredById = referrer.id;
        referralValid = true;
      }
    }

    // Create user with a generated referralCode
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        role: 'PLAYER',
        status: 'ACTIVE',
        referredById: referredById,
        // Generate a simple unique referral code (8 chars)
        referralCode: (Math.random().toString(36).slice(2, 10)).toUpperCase(),
      },
    });

    // Create wallet
    await prisma.wallet.create({
      data: {
        userId: newUser.id,
        balance: parseInt(process.env.DEFAULT_STARTING_BALANCE || '10000'),
        currency: 'COINS',
      },
    });

    // Apply admin offer code if provided
    if (offerCode) {
      try {
        await redeemOfferCode(newUser.id, offerCode);
      } catch (e: any) {
        // Non-fatal: report but continue
        console.warn('Offer code redemption failed:', e?.message || e);
      }
    }

    // Apply referral bonus if valid referral
    if (referredById) {
      const newUserBonus = parseInt(process.env.REFERRAL_NEW_USER_BONUS || '500');
      const referrerBonus = parseInt(process.env.REFERRAL_REFERRER_BONUS || '500');
      try {
        await applyReferralBonus(newUser.id, referredById, newUserBonus, referrerBonus);
        referralApplied = true;
      } catch (e: any) {
        console.warn('Referral bonus failed:', e?.message || e);
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: newUser.id, email: newUser.email, role: newUser.role });
    const refreshToken = generateRefreshToken({ userId: newUser.id, email: newUser.email, role: newUser.role });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.session.create({
      data: {
        userId: newUser.id,
        refreshToken,
        expiresAt,
      },
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        referralCode: newUser.referralCode,
      },
      accessToken,
      refreshToken,
      referralStatus: {
        provided: referralProvided,
        valid: referralValid,
        appliedBonus: referralApplied,
        message: referralProvided && !referralValid
          ? 'Referral code invalid. Account created without referral bonuses.'
          : undefined,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
      },
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        referralCode: user.referralCode,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if session exists
    const session = await prisma.session.findFirst({
      where: {
        userId: decoded.userId,
        refreshToken,
        expiresAt: { gte: new Date() },
      },
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    res.json({ accessToken });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await prisma.session.deleteMany({
        where: {
          userId: req.user!.id,
          refreshToken,
        },
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
        lastLogin: true,
        referralCode: true,
        wallets: {
          select: {
            balance: true,
            currency: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export const regenerateReferralCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    let newCode = '';
    let attempts = 0;
    while (!newCode && attempts < 5) {
      const candidate = Math.random().toString(36).slice(2, 10).toUpperCase();
      const existing = await prisma.user.findFirst({ where: { referralCode: candidate } });
      if (!existing) newCode = candidate;
      attempts += 1;
    }
    if (!newCode) {
      return res.status(500).json({ error: 'Could not generate unique referral code' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { referralCode: newCode },
      select: { id: true, referralCode: true },
    });

    res.json({ referralCode: updated.referralCode });
  } catch (error: any) {
    console.error('Regenerate referral code error:', error);
    res.status(500).json({ error: 'Failed to regenerate referral code' });
  }
};
