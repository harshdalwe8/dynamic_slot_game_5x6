import express from 'express';
import {
  uploadThemeAssetsEndpoint,
  uploadThemeSymbolsEndpoint,
  uploadImageEndpoint,
  deleteAssetEndpoint,
  listAssetsEndpoint,
  listThemeAssetsEndpoint,
} from '../controllers/uploadController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { uploadThemeAssets, uploadImage } from '../config/multer';

const router = express.Router();

// All upload routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

/**
 * POST /api/admin/upload/theme-assets/:themeId
 * Upload multiple assets (images, JSON) for a theme
 * Accepts: multipart/form-data with field name "assets"
 */
router.post('/theme-assets/:themeId', uploadThemeAssets.array('assets', 50), uploadThemeAssetsEndpoint);

/**
 * POST /api/admin/upload/theme-symbols/:themeId
 * Upload theme symbol images
 * Accepts: multipart/form-data with field name "symbols"
 */
router.post('/theme-symbols/:themeId', uploadThemeAssets.array('symbols', 50), uploadThemeSymbolsEndpoint);

// (theme-json endpoint removed)

/**
 * POST /api/admin/upload/image
 * Upload a single image
 * Accepts: multipart/form-data with field name "image"
 */
router.post('/image', uploadImage.single('image'), uploadImageEndpoint);

/**
 * GET /api/admin/upload/assets
 * List all uploaded assets
 */
router.get('/assets', listAssetsEndpoint);

/**
 * GET /api/admin/upload/theme-assets/:themeId
 * List assets for a specific theme
 */
router.get('/theme-assets/:themeId', listThemeAssetsEndpoint);

/**
 * DELETE /api/admin/upload/asset/:filename
 * Delete an uploaded asset by filename
 */
router.delete('/asset/:filename', deleteAssetEndpoint);

export default router;
