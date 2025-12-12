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

    // Map to include configuration
    const themesWithConfig = themes.map(theme => ({
      ...theme,
      configuration: theme.jsonSchema,
    }));

    res.json({ themes: themesWithConfig });
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
