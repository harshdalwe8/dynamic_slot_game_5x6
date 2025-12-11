import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { getFileUrl, deleteUploadedFiles } from '../config/multer';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/admin/upload/theme-assets/:themeId
 * Upload multiple assets for a theme
 */
export const uploadThemeAssetsEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    const { themeId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Verify theme exists
    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      // Delete uploaded files
      deleteUploadedFiles(files);
      return res.status(404).json({ error: 'Theme not found' });
    }

    // Process uploaded files
    const uploadedAssets = files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: getFileUrl(file),
      path: file.path,
    }));

    // Update theme's asset manifest. Support two shapes:
    // - New style: { base_path: string, components: [{ placeholder, file_name, url }] }
    // - Legacy style: { assets: [ { filename, originalName, ... } ] }
    const currentManifest = (theme.assetManifest as any) || {};
    const now = new Date().toISOString();
    let updatedManifest: any = {};

    if (Array.isArray(currentManifest.components)) {
      // Default/theme-driven flow: update components entries
      const basePath = currentManifest.base_path || `themes/${themeId}/`;
      const components: any[] = currentManifest.components.map((c: any) => ({ ...c }));

      for (const file of files) {
        const orig = file.originalname;
        const fileUrl = getFileUrl(file);

        // Try to match by component.file_name (decoded) or by file name equality
        const matchIndex = components.findIndex((c) => {
          const candidate = (c.file_name || '').toString();
          try {
            if (decodeURIComponent(candidate) === orig) return true;
          } catch (_) {}
          if (candidate === orig) return true;
          if (candidate && candidate.toLowerCase() === orig.toLowerCase()) return true;
          return false;
        });

        if (matchIndex >= 0) {
          components[matchIndex] = {
            ...components[matchIndex],
            file_name: file.filename,
            url: fileUrl,
          };
        } else {
          // Add as a new component entry if no matching placeholder
          const placeholder = path.parse(orig).name;
          components.push({ placeholder, file_name: file.filename, url: fileUrl });
        }
      }

      updatedManifest = {
        ...currentManifest,
        base_path: currentManifest.base_path || basePath,
        components,
        updatedAt: now,
      };
    } else {
      // Legacy flow: keep previous behavior where assets is an array of objects
      updatedManifest = {
        ...currentManifest,
        assets: [...(currentManifest.assets || []), ...uploadedAssets],
        updatedAt: now,
      };
    }

    await prisma.theme.update({
      where: { id: themeId },
      data: {
        assetManifest: updatedManifest as any,
      },
    });

    // Optionally create a theme version snapshot (captures assets change)
    try {
      await prisma.themeVersion.create({
        data: {
          themeId: themeId,
          version: theme.version,
          json: theme.jsonSchema,
          assets: updatedManifest as any,
          notes: 'Assets upload',
        },
      });
    } catch (verr) {
      // non-fatal: log and continue
      console.warn('Failed to create themeVersion snapshot:', verr);
    }

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'UPLOAD_THEME_ASSETS',
        objectType: 'theme',
        objectId: themeId,
        payload: {
          fileCount: files.length,
          files: uploadedAssets.map((a) => a.filename),
        },
        ip: req.ip || 'unknown',
      },
    });

    res.status(200).json({
      message: 'Assets uploaded successfully',
      theme: {
        id: theme.id,
        name: theme.name,
      },
      uploadedAssets,
    });
  } catch (error: any) {
    console.error('Upload theme assets error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      deleteUploadedFiles(req.files as Express.Multer.File[]);
    }
    
    res.status(500).json({ error: 'Failed to upload assets' });
  }
};

// (uploadThemeJSONEndpoint removed)

/**
 * POST /api/admin/upload/image
 * Upload a single image
 */
export const uploadImageEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageData = {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: getFileUrl(file),
    };

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'UPLOAD_IMAGE',
        objectType: 'asset',
        objectId: file.filename,
        payload: imageData,
        ip: req.ip || 'unknown',
      },
    });

    res.status(200).json({
      message: 'Image uploaded successfully',
      image: imageData,
    });
  } catch (error: any) {
    console.error('Upload image error:', error);
    
    if (req.file) {
      deleteUploadedFiles(req.file);
    }
    
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

/**
 * DELETE /api/admin/upload/asset/:filename
 * Delete an uploaded asset
 */
export const deleteAssetEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    const { filename } = req.params;

    // Security check: prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const uploadDir = path.join(process.cwd(), 'uploads');
    const possiblePaths = [
      path.join(uploadDir, 'assets', filename),
      path.join(uploadDir, 'themes', filename),
    ];

    let deleted = false;
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'DELETE_ASSET',
        objectType: 'asset',
        objectId: filename,
        payload: { filename },
        ip: req.ip || 'unknown',
      },
    });

    res.json({ message: 'Asset deleted successfully' });
  } catch (error: any) {
    console.error('Delete asset error:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
};

/**
 * GET /api/admin/upload/assets
 * List all uploaded assets
 */
export const listAssetsEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    const uploadDir = path.join(process.cwd(), 'uploads');
    const assetsDir = path.join(uploadDir, 'assets');

    if (!fs.existsSync(assetsDir)) {
      return res.json({ assets: [] });
    }

    const files = fs.readdirSync(assetsDir);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    const assets = files.map((filename) => {
      const filePath = path.join(assetsDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename,
        size: stats.size,
        url: `${baseUrl}/uploads/assets/${filename}`,
        createdAt: stats.birthtime,
      };
    });

    res.json({ assets });
  } catch (error: any) {
    console.error('List assets error:', error);
    res.status(500).json({ error: 'Failed to list assets' });
  }
};

/**
 * GET /api/admin/upload/theme-assets/:themeId
 * List assets for a specific theme
 */
export const listThemeAssetsEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    const { themeId } = req.params;

    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
      select: {
        id: true,
        name: true,
        assetManifest: true,
      },
    });

    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    const manifest = (theme.assetManifest as any) || { assets: [] };

    res.json({
      themeId: theme.id,
      themeName: theme.name,
      assets: manifest.assets || [],
    });
  } catch (error: any) {
    console.error('List theme assets error:', error);
    res.status(500).json({ error: 'Failed to list theme assets' });
  }
};
