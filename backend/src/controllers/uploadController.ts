import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { getFileUrl, deleteUploadedFiles } from '../config/multer';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/admin/upload/theme-assets/:themeId
 * Upload multiple UI assets for a theme (balance, background, buttons, reels, etc.)
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
      deleteUploadedFiles(files);
      return res.status(404).json({ error: 'Theme not found' });
    }

    // Create theme directory structure: public/theme/{theme_name}/assets/
    const themeName = theme.name.toLowerCase().replace(/\s+/g, '_');
    const assetsDir = path.join(process.cwd(), 'public', 'theme', themeName, 'assets');
    
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    const movedFiles: Array<{ key: string; filename: string; originalName: string; path: string; url: string; }> = [];

    try {
      for (const file of files) {
        const assetKey = path.parse(file.originalname).name;
        const ext = path.extname(file.originalname).toLowerCase();
        const allowedExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

        if (!allowedExts.includes(ext)) {
          throw new Error(`Unsupported file type: ${ext}`);
        }

        const newFilename = `${assetKey}${ext}`;
        const newPath = path.join(assetsDir, newFilename);

        // Move file from temp upload location to theme assets directory
        fs.renameSync(file.path, newPath);

        movedFiles.push({
          key: assetKey,
          filename: newFilename,
          originalName: file.originalname,
          path: `public/theme/${themeName}/assets/${newFilename}`,
          url: `/theme/${themeName}/assets/${newFilename}`,
        });
      }

      // Update theme's assetManifest in database
      const currentAssetManifest = (theme.assetManifest as any) || {};
      const updatedAssetManifest = { ...currentAssetManifest };

      movedFiles.forEach((file) => {
        updatedAssetManifest[file.key] = {
          filename: file.filename,
          path: file.path,
          url: file.url,
        };
      });

      await prisma.theme.update({
        where: { id: themeId },
        data: { assetManifest: updatedAssetManifest },
      });
    } catch (err: any) {
      deleteUploadedFiles(files);
      movedFiles.forEach((file) => {
        const fullPath = path.join(process.cwd(), file.path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
      return res.status(400).json({ error: err.message || 'Invalid assets' });
    }

    res.json({
      message: 'Theme assets uploaded successfully',
      files: movedFiles,
      themeDirectory: `public/theme/${themeName}/assets`,
    });
  } catch (error: any) {
    console.error('Upload theme assets error:', error);
    res.status(500).json({ error: 'Failed to upload theme assets' });
  }
};

/**
 * POST /api/admin/upload/theme-symbols/:themeId
 * Upload symbol images for a theme
 */
export const uploadThemeSymbolsEndpoint = async (req: AuthRequest, res: Response) => {
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
      deleteUploadedFiles(files);
      return res.status(404).json({ error: 'Theme not found' });
    }

    const jsonSchema = theme.jsonSchema as any;
    const allowedSymbols = new Set(
      Array.isArray(jsonSchema?.symbols)
        ? jsonSchema.symbols.map((s: any) => String(s.id).toLowerCase())
        : []
    );

    // Create theme directory structure: public/theme/{theme_name}/symbols/
    const themeName = theme.name.toLowerCase().replace(/\s+/g, '_');
    const themeDir = path.join(process.cwd(), 'public', 'theme', themeName, 'symbols');
    
    if (!fs.existsSync(themeDir)) {
      fs.mkdirSync(themeDir, { recursive: true });
    }

    const movedFiles: Array<{ symbolId: string; filename: string; originalName: string; path: string; url: string; }> = [];

    try {
      for (const file of files) {
        const symbolIdRaw = path.parse(file.originalname).name;
        const symbolId = symbolIdRaw.replace(/[^\w-]/g, '').toLowerCase();
        const ext = path.extname(file.originalname).toLowerCase();
        const allowedExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

        if (!symbolId) {
          throw new Error('Invalid symbol filename');
        }

        if (allowedSymbols.size > 0 && !allowedSymbols.has(symbolId)) {
          throw new Error(`Symbol ${symbolId} not defined in theme schema`);
        }

        if (!allowedExts.includes(ext)) {
          throw new Error(`Unsupported file type for symbol ${symbolId}`);
        }

        const newFilename = `${symbolId}${ext}`;
        const newPath = path.join(themeDir, newFilename);

        // Move file from temp upload location to theme directory
        fs.renameSync(file.path, newPath);

        movedFiles.push({
          symbolId,
          filename: newFilename,
          originalName: file.originalname,
          path: `public/theme/${themeName}/symbols/${newFilename}`,
          url: `/theme/${themeName}/symbols/${newFilename}`,
        });
      }
    } catch (err: any) {
      deleteUploadedFiles(files);
      movedFiles.forEach((file) => {
        const fullPath = path.join(process.cwd(), file.path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
      return res.status(400).json({ error: err.message || 'Invalid assets' });
    }

    // Update theme's jsonSchema to reflect new asset paths
    if (jsonSchema.symbols && Array.isArray(jsonSchema.symbols)) {
      jsonSchema.symbols = jsonSchema.symbols.map((symbol: any) => {
        const uploadedFile = movedFiles.find(
          (f) => f.symbolId === String(symbol.id).toLowerCase()
        );
        if (uploadedFile) {
          return {
            ...symbol,
            asset: uploadedFile.path,
          };
        }
        return symbol;
      });
      
      // Update theme in database
      await prisma.theme.update({
        where: { id: themeId },
        data: { jsonSchema },
      });
    }

    res.json({
      message: 'Symbols uploaded successfully',
      files: movedFiles,
      themeDirectory: `public/theme/${themeName}/symbols`,
    });
  } catch (error: any) {
    console.error('Upload theme symbols error:', error);
    res.status(500).json({ error: 'Failed to upload symbols' });
  }
};

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
