import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { validateThemeJson, validateAssetManifest } from '../utils/themeValidator';

/**
 * POST /api/admin/themes - Create a new theme
 */
export const createTheme = async (req: AuthRequest, res: Response) => {
  try {
    const { name, jsonSchema, assetManifest } = req.body;
    const createdBy = req.user!.id;

    // Validate theme JSON
    const jsonValidation = validateThemeJson(jsonSchema);
    if (!jsonValidation.valid) {
      return res.status(400).json({
        error: 'Invalid theme JSON',
        details: jsonValidation.errors,
      });
    }

    // Validate asset manifest
    const assetValidation = validateAssetManifest(assetManifest);
    if (!assetValidation.valid) {
      return res.status(400).json({
        error: 'Invalid asset manifest',
        details: assetValidation.errors,
      });
    }

    // Create theme in draft status
    const theme = await prisma.theme.create({
      data: {
        id: jsonSchema.themeId,
        name,
        version: 1,
        status: 'DRAFT',
        jsonSchema,
        assetManifest,
        createdBy,
      },
    });

    // Create first version
    await prisma.themeVersion.create({
      data: {
        themeId: theme.id,
        version: 1,
        json: jsonSchema,
        assets: assetManifest,
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
    const { name, jsonSchema, assetManifest, notes } = req.body;
    const adminId = req.user!.id;

    // Get existing theme
    const existingTheme = await prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!existingTheme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    // Validate if provided
    if (jsonSchema) {
      const validation = validateThemeJson(jsonSchema);
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
        jsonSchema: jsonSchema || existingTheme.jsonSchema,
        assetManifest: assetManifest || existingTheme.assetManifest,
        status: 'DRAFT', // Reset to draft on update
      },
    });

    // Create new version record
    await prisma.themeVersion.create({
      data: {
        themeId,
        version: newVersion,
        json: jsonSchema || existingTheme.jsonSchema,
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
