/**
 * PUT /api/admin/users/:userId/balance - Update user wallet balance
 * Only SUPER_ADMIN and SUPPORT_STAFF
 */
export const updateUserBalance = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { balance } = req.body;
    const adminId = req.user?.id;

    // Only allow SUPER_ADMIN and SUPPORT_STAFF
    if (!req.user || !['SUPER_ADMIN', 'SUPPORT_STAFF'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    if (typeof balance !== 'number' || balance < 0) {
      return res.status(400).json({ error: 'Invalid balance value' });
    }

    // Find wallet
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found for user' });
    }

    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { userId },
      data: { balance },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        admin: { connect: { id: adminId } },
        action: 'UPDATE_USER_BALANCE',
        objectType: 'user',
        objectId: userId,
        payload: { previousBalance: wallet.balance, newBalance: balance },
        ip: req.ip || '',
      },
    });

    res.json({
      message: 'User balance updated successfully',
      wallet: updatedWallet,
    });
  } catch (error: any) {
    console.error('Update user balance error:', error);
    res.status(500).json({ error: 'Failed to update user balance' });
  }
};
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { validateThemeJson, validateAssetManifest } from '../utils/themeValidator';

/**
 * POST /api/admin/themes - Create a new theme
 */
export const createTheme = async (req: AuthRequest, res: Response) => {
  try {
    const { name, jsonSchema, configuration, themeId, assetManifest, minBet, maxBet } = req.body;
    const createdBy = req.user!.id;

    // Use configuration or jsonSchema (configuration takes precedence)
    const baseSchema = configuration || jsonSchema;
    if (!baseSchema) {
      return res.status(400).json({ error: 'configuration or jsonSchema is required' });
    }

    // Extract or use provided themeId
    const finalThemeId = themeId || baseSchema.themeId;
    if (!finalThemeId) {
      return res.status(400).json({ error: 'themeId is required' });
    }

    // Add minBet, maxBet, and name to jsonSchema if provided
    const enhancedJsonSchema = {
      ...baseSchema,
      themeId: finalThemeId,
      name: name || baseSchema.name,
      ...(minBet !== undefined && { minBet }),
      ...(maxBet !== undefined && { maxBet }),
    };

    // Validate theme JSON
    const jsonValidation = validateThemeJson(enhancedJsonSchema);
    if (!jsonValidation.valid) {
      return res.status(400).json({
        error: 'Invalid theme JSON',
        details: jsonValidation.errors,
      });
    }

    // Validate asset manifest if provided
    if (assetManifest) {
      const assetValidation = validateAssetManifest(assetManifest);
      if (!assetValidation.valid) {
        return res.status(400).json({
          error: 'Invalid asset manifest',
          details: assetValidation.errors,
        });
      }
    }

    // Create theme in draft status
    const theme = await prisma.theme.create({
      data: {
        id: finalThemeId,
        name,
        version: 1,
        status: 'DRAFT',
        jsonSchema: enhancedJsonSchema,
        assetManifest: assetManifest || {},
        minBet: minBet !== undefined ? minBet : 10,
        maxBet: maxBet !== undefined ? maxBet : 1000,
        createdBy,
      },
    });

    // Create first version
    await prisma.themeVersion.create({
      data: {
        themeId: theme.id,
        version: 1,
        json: enhancedJsonSchema,
        assets: assetManifest || {},
        notes: 'Initial version',
      },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: createdBy,
        action: 'CREATE_THEME',
        objectType: 'theme',
        objectId: theme.id,
        payload: { name, version: 1 },
        ip: req.ip || 'unknown',
      },
    });

    res.status(201).json({ theme });
  } catch (error: any) {
    console.error('Create theme error:', error);
    res.status(500).json({ error: 'Failed to create theme' });
  }
};

/**
 * PUT /api/admin/themes/:themeId - Update theme
 */
export const updateTheme = async (req: AuthRequest, res: Response) => {
  try {
    const { themeId } = req.params;
    const { name, configuration, jsonSchema, assetManifest, notes, minBet, maxBet } = req.body;
    const adminId = req.user!.id;

    // Get existing theme
    const existingTheme = await prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!existingTheme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    // Use configuration or jsonSchema (configuration takes precedence)
    const updatedJsonSchema = configuration || jsonSchema;
    
    // Merge minBet/maxBet if provided
    const enhancedJsonSchema = updatedJsonSchema ? {
      ...updatedJsonSchema,
      // Ensure themeId is present for validation; prefer body themeId, else param or existing
      themeId: (updatedJsonSchema as any).themeId || (req.body.themeId as string) || existingTheme.id,
      name: name || (updatedJsonSchema as any).name || existingTheme.name,
      ...(minBet !== undefined && { minBet }),
      ...(maxBet !== undefined && { maxBet }),
    } : null;

    // Validate if provided
    if (enhancedJsonSchema) {
      const validation = validateThemeJson(enhancedJsonSchema);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid theme JSON',
          details: validation.errors,
        });
      }
    }

    if (assetManifest) {
      const validation = validateAssetManifest(assetManifest);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid asset manifest',
          details: validation.errors,
        });
      }
    }

    // Increment version
    const newVersion = existingTheme.version + 1;

    // Update theme
    const updatedTheme = await prisma.theme.update({
      where: { id: themeId },
      data: {
        name: name || existingTheme.name,
        version: newVersion,
        jsonSchema: enhancedJsonSchema || existingTheme.jsonSchema,
        assetManifest: assetManifest || existingTheme.assetManifest,
        minBet: minBet !== undefined ? minBet : existingTheme.minBet,
        maxBet: maxBet !== undefined ? maxBet : existingTheme.maxBet,
        status: 'DRAFT', // Reset to draft on update
      },
    });

    // Create new version record
    await prisma.themeVersion.create({
      data: {
        themeId,
        version: newVersion,
        json: enhancedJsonSchema || existingTheme.jsonSchema,
        assets: assetManifest || existingTheme.assetManifest,
        notes: notes || `Version ${newVersion}`,
      },
    });

    // Log action
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'UPDATE_THEME',
        objectType: 'theme',
        objectId: themeId,
        payload: { newVersion },
        ip: req.ip || 'unknown',
      },
    });

    res.json({ theme: updatedTheme });
  } catch (error: any) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
};

/**
 * POST /api/admin/themes/:themeId/activate - Activate theme
 */
export const activateTheme = async (req: AuthRequest, res: Response) => {
  try {
    const { themeId } = req.params;
    const adminId = req.user!.id;

    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    // Validate before activation
    const validation = validateThemeJson(theme.jsonSchema);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Cannot activate theme with validation errors',
        details: validation.errors,
      });
    }

    // Activate theme
    const updatedTheme = await prisma.theme.update({
      where: { id: themeId },
      data: { status: 'ACTIVE' },
    });

    // Log action
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'ACTIVATE_THEME',
        objectType: 'theme',
        objectId: themeId,
        payload: { version: theme.version },
        ip: req.ip || 'unknown',
      },
    });

    res.json({ theme: updatedTheme });
  } catch (error: any) {
    console.error('Activate theme error:', error);
    res.status(500).json({ error: 'Failed to activate theme' });
  }
};

/**
 * POST /api/admin/themes/:themeId/deactivate - Deactivate theme
 */
export const deactivateTheme = async (req: AuthRequest, res: Response) => {
  try {
    const { themeId } = req.params;
    const adminId = req.user!.id;

    const updatedTheme = await prisma.theme.update({
      where: { id: themeId },
      data: { status: 'DISABLED' },
    });

    // Log action
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'DEACTIVATE_THEME',
        objectType: 'theme',
        objectId: themeId,
        payload: {},
        ip: req.ip || 'unknown',
      },
    });

    res.json({ theme: updatedTheme });
  } catch (error: any) {
    console.error('Deactivate theme error:', error);
    res.status(500).json({ error: 'Failed to deactivate theme' });
  }
};

/**
 * POST /api/admin/themes/:themeId/rollback - Rollback to previous version
 */
export const rollbackTheme = async (req: AuthRequest, res: Response) => {
  try {
    const { themeId } = req.params;
    const { version } = req.body;
    const adminId = req.user!.id;

    if (!version) {
      return res.status(400).json({ error: 'Version number required' });
    }

    // Get version to rollback to
    const themeVersion = await prisma.themeVersion.findFirst({
      where: {
        themeId,
        version: parseInt(version),
      },
    });

    if (!themeVersion) {
      return res.status(404).json({ error: 'Theme version not found' });
    }

    // Update theme with version data
    const updatedTheme = await prisma.theme.update({
      where: { id: themeId },
      data: {
        jsonSchema: themeVersion.json as any,
        assetManifest: themeVersion.assets as any,
        status: 'DRAFT', // Reset to draft after rollback
      },
    });

    // Log action
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'ROLLBACK_THEME',
        objectType: 'theme',
        objectId: themeId,
        payload: { rolledBackToVersion: version },
        ip: req.ip || 'unknown',
      },
    });

    res.json({ theme: updatedTheme });
  } catch (error: any) {
    console.error('Rollback theme error:', error);
    res.status(500).json({ error: 'Failed to rollback theme' });
  }
};

/**
 * GET /api/admin/themes - Get all themes (including drafts)
 */
export const getAllThemes = async (req: AuthRequest, res: Response) => {
  try {
    const themes = await prisma.theme.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        version: true,
        status: true,
        jsonSchema: true,
        minBet: true,
        maxBet: true,
        createdAt: true,
        createdBy: true,
      },
    });

    res.json({ themes });
  } catch (error: any) {
    console.error('Get all themes error:', error);
    res.status(500).json({ error: 'Failed to get themes' });
  }
};

/**
 * GET /api/admin/themes/:themeId - Get theme details
 */
export const getThemeDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { themeId } = req.params;

    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 10,
          select: {
            id: true,
            themeId: true,
            version: true,
            createdAt: true,
            notes: true,
            // Exclude the large 'json' and 'assets' fields to reduce response size
          },
        },
      },
    });

    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    res.json({ theme });
  } catch (error: any) {
    console.error('Get theme details error:', error);
    res.status(500).json({ error: 'Failed to get theme' });
  }
};

/**
 * DELETE /api/admin/themes/:themeId - Delete theme
 */
export const deleteTheme = async (req: AuthRequest, res: Response) => {
  try {
    const { themeId } = req.params;
    const adminId = req.user!.id;

    // Check if theme has spins
    const spinCount = await prisma.spin.count({
      where: { themeId },
    });

    if (spinCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete theme with existing spins. Deactivate instead.',
      });
    }

    // Delete theme and versions (cascade)
    await prisma.theme.delete({
      where: { id: themeId },
    });

    // Log action
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'DELETE_THEME',
        objectType: 'theme',
        objectId: themeId,
        payload: {},
        ip: req.ip || 'unknown',
      },
    });

    res.json({ message: 'Theme deleted successfully' });
  } catch (error: any) {
    console.error('Delete theme error:', error);
    res.status(500).json({ error: 'Failed to delete theme' });
  }
};

/**
 * GET /admin/users - Get all users with optional filtering
 */
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role, status, search, limit = '50', offset = '0' } = req.query;
    const pageLimit = Math.min(parseInt(limit as string) || 50, 100);
    const pageOffset = parseInt(offset as string) || 0;

    // Build filter
    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { displayName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Fetch users
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          status: true,
          createdAt: true,
          lastLogin: true,
          wallets: {
            select: {
              balance: true,
              currency: true
            }
          }
        },
        skip: pageOffset,
        take: pageLimit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      total,
      limit: pageLimit,
      offset: pageOffset,
      hasMore: pageOffset + pageLimit < total,
    });
  } catch (error: any) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * PUT /admin/users/:userId/status - Update user status
 */
export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    const adminId = req.user!.id;

    // Validate status
    const validStatuses = ['ACTIVE', 'BANNED', 'DISABLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: ACTIVE, BANNED, DISABLED',
      });
    }

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cannot ban/disable super admin
    if (existingUser.role === 'SUPER_ADMIN' && status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Cannot change status of super admin users',
      });
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true,
        wallets: {
          select: {
            balance: true,
            currency: true
          }
        }
      },
    });

    // Log action
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'UPDATE_USER_STATUS',
        objectType: 'user',
        objectId: userId,
        payload: { previousStatus: existingUser.status, newStatus: status },
        ip: req.ip || 'unknown',
      },
    });

    res.json({
      message: 'User status updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

/**
 * PUT /admin/users/:userId/role - Update user role
 */
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const adminId = req.user!.id;

    // Validate role
    const validRoles = ['PLAYER', 'SUPPORT_STAFF', 'GAME_MANAGER', 'SUPER_ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be one of: PLAYER, SUPPORT_STAFF, GAME_MANAGER, SUPER_ADMIN',
      });
    }

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only SUPER_ADMIN can promote to SUPER_ADMIN
    if (role === 'SUPER_ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Only super admins can assign super admin role',
      });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true,
        wallets: {
          select: {
            balance: true,
            currency: true
          }
        }
      },
    });

    // Log action
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'UPDATE_USER_ROLE',
        objectType: 'user',
        objectId: userId,
        payload: { previousRole: existingUser.role, newRole: role },
        ip: req.ip || 'unknown',
      },
    });

    res.json({
      message: 'User role updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

/**
 * POST /api/admin/offer-codes - Create a new offer code
 */
export const createOfferCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code, amount, startsAt, endsAt, maxUsage, active = true } = req.body;
    if (!code || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Code and positive amount are required' });
    }
    if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
      return res.status(400).json({ error: 'startsAt must be before endsAt' });
    }

    const existing = await prisma.offerCode.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ error: 'Offer code already exists' });
    }

    const offer = await prisma.offerCode.create({
      data: {
        code,
        amount: Math.floor(amount),
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        endsAt: endsAt ? new Date(endsAt) : null,
        maxUsage: typeof maxUsage === 'number' ? Math.floor(maxUsage) : null,
        active: Boolean(active),
        createdById: req.user!.id,
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'CREATE_OFFER_CODE',
        objectType: 'offer_code',
        objectId: offer.id,
        payload: { code, amount, startsAt, endsAt, maxUsage, active },
        ip: req.ip || 'unknown',
      },
    });

    res.status(201).json({ offer });
  } catch (error: any) {
    console.error('Create offer code error:', error);
    res.status(500).json({ error: 'Failed to create offer code' });
  }
};

/**
 * GET /api/admin/offer-codes - List offer codes
 */
export const listOfferCodes = async (req: AuthRequest, res: Response) => {
  try {
    const offers = await prisma.offerCode.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        amount: true,
        active: true,
        maxUsage: true,
        usageCount: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
      },
    });
    res.json({ offers });
  } catch (error: any) {
    console.error('List offer codes error:', error);
    res.status(500).json({ error: 'Failed to list offer codes' });
  }
};

/**
 * POST /api/admin/offer-codes/:code/deactivate - Deactivate an offer code
 */
export const deactivateOfferCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;
    const offer = await prisma.offerCode.findUnique({ where: { code } });
    if (!offer) {
      return res.status(404).json({ error: 'Offer code not found' });
    }
    const updated = await prisma.offerCode.update({
      where: { id: offer.id },
      data: { active: false },
    });
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'DEACTIVATE_OFFER_CODE',
        objectType: 'offer_code',
        objectId: offer.id,
        payload: { code },
        ip: req.ip || 'unknown',
      },
    });
    res.json({ offer: updated });
  } catch (error: any) {
    console.error('Deactivate offer code error:', error);
    res.status(500).json({ error: 'Failed to deactivate offer code' });
  }
};

/**
 * POST /api/admin/offer-codes/:code/activate - Activate an offer code
 */
export const activateOfferCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;
    const offer = await prisma.offerCode.findUnique({ where: { code } });
    if (!offer) {
      return res.status(404).json({ error: 'Offer code not found' });
    }
    const updated = await prisma.offerCode.update({
      where: { id: offer.id },
      data: { active: true },
    });
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'ACTIVATE_OFFER_CODE',
        objectType: 'offer_code',
        objectId: offer.id,
        payload: { code },
        ip: req.ip || 'unknown',
      },
    });
    res.json({ offer: updated });
  } catch (error: any) {
    console.error('Activate offer code error:', error);
    res.status(500).json({ error: 'Failed to activate offer code' });
  }
};

/**
 * PUT /api/admin/offer-codes/:code - Update offer code details (dates, amount, maxUsage, active)
 */
export const updateOfferCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;
    const { amount, startsAt, endsAt, maxUsage, active } = req.body;

    const offer = await prisma.offerCode.findUnique({ where: { code } });
    if (!offer) {
      return res.status(404).json({ error: 'Offer code not found' });
    }

    if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
      return res.status(400).json({ error: 'startsAt must be before endsAt' });
    }

    const updated = await prisma.offerCode.update({
      where: { id: offer.id },
      data: {
        ...(typeof amount === 'number' && amount > 0 ? { amount: Math.floor(amount) } : {}),
        ...(startsAt ? { startsAt: new Date(startsAt) } : {}),
        ...(endsAt ? { endsAt: new Date(endsAt) } : { endsAt: endsAt === null ? null : undefined }),
        ...(typeof maxUsage === 'number' ? { maxUsage: Math.floor(maxUsage) } : {}),
        ...(typeof active === 'boolean' ? { active } : {}),
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'UPDATE_OFFER_CODE',
        objectType: 'offer_code',
        objectId: offer.id,
        payload: { amount, startsAt, endsAt, maxUsage, active },
        ip: req.ip || 'unknown',
      },
    });

    res.json({ offer: updated });
  } catch (error: any) {
    console.error('Update offer code error:', error);
    res.status(500).json({ error: 'Failed to update offer code' });
  }
};

// ============= PAYMENT LINKS =============

/**
 * POST /api/admin/payment-links - Create a new UPI payment link template
 */
export const createPaymentLink = async (req: AuthRequest, res: Response) => {
  try {
    const { name, payeeVPA, payeeName } = req.body;
    const createdBy = req.user!.id;

    // Validate required fields
    if (!name || !payeeVPA || !payeeName) {
      return res.status(400).json({ error: 'Name, Payee VPA, and Payee Name are required' });
    }

    // Create payment link
    const paymentLink = await prisma.paymentLink.create({
      data: {
        name,
        payeeVPA,
        payeeName,
        createdBy,
        active: true,
      },
    });

    // Log admin action
    try {
      await prisma.adminLog.create({
        data: {
          adminId: createdBy,
          action: 'CREATE_PAYMENT_LINK',
          objectType: 'payment_link',
          objectId: paymentLink.id,
          payload: { name, payeeVPA },
          ip: req.ip || 'unknown',
        },
      });
    } catch (logError) {
      console.error('Failed to create admin log (non-critical):', logError);
    }

    res.status(201).json({ paymentLink });
  } catch (error: any) {
    console.error('Create payment link error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    res.status(500).json({ error: 'Failed to create payment link', details: error.message });
  }
};

/**
 * GET /api/admin/payment-links - Get all payment link templates
 */
export const listPaymentLinks = async (req: AuthRequest, res: Response) => {
  try {
    const paymentLinks = await prisma.paymentLink.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { deposits: true },
        },
      },
    });

    res.json({ paymentLinks });
  } catch (error: any) {
    console.error('List payment links error:', error);
    res.status(500).json({ error: 'Failed to list payment links' });
  }
};

/**
 * PUT /api/admin/payment-links/:id - Update payment link
 */
export const updatePaymentLink = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, payeeVPA, payeeName, active } = req.body;

    const paymentLink = await prisma.paymentLink.findUnique({ where: { id } });
    if (!paymentLink) {
      return res.status(404).json({ error: 'Payment link not found' });
    }

    const updated = await prisma.paymentLink.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(payeeVPA ? { payeeVPA } : {}),
        ...(payeeName ? { payeeName } : {}),
        ...(typeof active === 'boolean' ? { active } : {}),
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'UPDATE_PAYMENT_LINK',
        objectType: 'payment_link',
        objectId: id,
        payload: { name, active },
        ip: req.ip || 'unknown',
      },
    });

    res.json({ paymentLink: updated });
  } catch (error: any) {
    console.error('Update payment link error:', error);
    res.status(500).json({ error: 'Failed to update payment link' });
  }
};

/**
 * DELETE /api/admin/payment-links/:id - Delete payment link
 */
export const deletePaymentLink = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const paymentLink = await prisma.paymentLink.findUnique({ where: { id } });
    if (!paymentLink) {
      return res.status(404).json({ error: 'Payment link not found' });
    }

    await prisma.paymentLink.delete({ where: { id } });

    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'DELETE_PAYMENT_LINK',
        objectType: 'payment_link',
        objectId: id,
        payload: { name: paymentLink.name },
        ip: req.ip || 'unknown',
      },
    });

    res.json({ message: 'Payment link deleted successfully' });
  } catch (error: any) {
    console.error('Delete payment link error:', error);
    res.status(500).json({ error: 'Failed to delete payment link' });
  }
};

/**
 * POST /api/admin/payment-links/:id/toggle - Toggle payment link active status
 */
export const togglePaymentLink = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const paymentLink = await prisma.paymentLink.findUnique({ where: { id } });
    if (!paymentLink) {
      return res.status(404).json({ error: 'Payment link not found' });
    }

    const updated = await prisma.paymentLink.update({
      where: { id },
      data: { active: !paymentLink.active },
    });

    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: updated.active ? 'ACTIVATE_PAYMENT_LINK' : 'DEACTIVATE_PAYMENT_LINK',
        objectType: 'payment_link',
        objectId: id,
        payload: { name: paymentLink.name, active: updated.active },
        ip: req.ip || 'unknown',
      },
    });

    res.json({ paymentLink: updated });
  } catch (error: any) {
    console.error('Toggle payment link error:', error);
    res.status(500).json({ error: 'Failed to toggle payment link' });
  }
};

// ============= DEPOSITS MANAGEMENT =============

/**
 * GET /api/admin/deposits - Get all user deposits (admin view)
 */
export const listDeposits = async (req: AuthRequest, res: Response) => {
  try {
    const { status, userId, limit = '50', offset = '0' } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const deposits = await prisma.deposit.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, displayName: true } },
        paymentLink: { select: { id: true, name: true, payeeVPA: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.deposit.count({ where });

    res.json({ deposits, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
  } catch (error: any) {
    console.error('List deposits error:', error);
    res.status(500).json({ error: 'Failed to list deposits' });
  }
};

/**
 * PUT /api/admin/deposits/:depositId/approve - Approve deposit and credit wallet
 */
export const approveDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const { depositId } = req.params;

    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
      include: { user: true },
    });

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    if (deposit.status !== 'SCREENSHOT_UPLOADED') {
      return res.status(400).json({ error: 'Deposit is not awaiting approval' });
    }

    // Credit user wallet
    await prisma.wallet.update({
      where: { userId: deposit.userId },
      data: { balance: { increment: deposit.amount } },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: deposit.userId,
        amount: deposit.amount,
        type: 'CREDIT',
        balanceAfter: (await prisma.wallet.findUnique({ where: { userId: deposit.userId } }))?.balance || 0,
        reason: `Deposit approved - UPI Transfer (${deposit.transactionRef})`,
        reference: deposit.id,
      },
    });

    // Update deposit status
    const updated = await prisma.deposit.update({
      where: { id: depositId },
      data: { status: 'APPROVED' },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'APPROVE_DEPOSIT',
        objectType: 'deposit',
        objectId: depositId,
        payload: { userId: deposit.userId, amount: deposit.amount, transactionRef: deposit.transactionRef },
        ip: req.ip || 'unknown',
      },
    });

    res.json({ deposit: updated, message: 'Deposit approved and wallet credited' });
  } catch (error: any) {
    console.error('Approve deposit error:', error);
    res.status(500).json({ error: 'Failed to approve deposit' });
  }
};

/**
 * PUT /api/admin/deposits/:depositId/reject - Reject deposit
 */
export const rejectDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const { depositId } = req.params;
    const { reason } = req.body;

    const deposit = await prisma.deposit.findUnique({ where: { id: depositId } });

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    const updated = await prisma.deposit.update({
      where: { id: depositId },
      data: { status: 'REJECTED' },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'REJECT_DEPOSIT',
        objectType: 'deposit',
        objectId: depositId,
        payload: { userId: deposit.userId, reason },
        ip: req.ip || 'unknown',
      },
    });

    res.json({ deposit: updated, message: 'Deposit rejected' });
  } catch (error: any) {
    console.error('Reject deposit error:', error);
    res.status(500).json({ error: 'Failed to reject deposit' });
  }
};
