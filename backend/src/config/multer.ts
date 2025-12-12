import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const sanitizeFilename = (name: string) => name.replace(/[^\w.-]/g, '_');
const hasUnsafePathSegment = (name: string) => name.includes('..') || name.includes('/') || name.includes('\\');

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
const themesDir = path.join(uploadDir, 'themes');
const assetsDir = path.join(uploadDir, 'assets');

// Create directories if they don't exist
[uploadDir, themesDir, assetsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration for theme assets
const themeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const themeId = req.params.id || req.body.themeId || 'temp';
    const safeThemeId = sanitizeFilename(themeId);
    const themeUploadDir = path.join(themesDir, safeThemeId);
    
    // Create theme-specific directory
    if (!fs.existsSync(themeUploadDir)) {
      fs.mkdirSync(themeUploadDir, { recursive: true });
    }
    
    cb(null, themeUploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname);
    const basename = sanitizeFilename(path.basename(file.originalname, ext));
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

// Storage configuration for general assets
const assetStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, assetsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname);
    const basename = sanitizeFilename(path.basename(file.originalname, ext));
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

// File filter for images
const imageFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    if (hasUnsafePathSegment(file.originalname)) {
      cb(new Error('Invalid file name'));
    } else {
      cb(null, true);
    }
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

// File filter for JSON
const jsonFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
    if (hasUnsafePathSegment(file.originalname)) {
      cb(new Error('Invalid file name'));
    } else {
      cb(null, true);
    }
  } else {
    cb(new Error('Invalid file type. Only JSON files are allowed.'));
  }
};

// File filter for theme assets (images + JSON)
const themeAssetFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/json',
  ];
  
  if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.json')) {
    if (hasUnsafePathSegment(file.originalname)) {
      cb(new Error('Invalid file name'));
    } else {
      cb(null, true);
    }
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and JSON files are allowed.'));
  }
};

// Multer upload configurations
export const uploadThemeAssets = multer({
  storage: themeStorage,
  fileFilter: themeAssetFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 100, // Max 100 files per request
  },
});

export const uploadImage = multer({
  storage: assetStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
});

export const uploadJSON = multer({
  storage: assetStorage,
  fileFilter: jsonFileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB per file
  },
});

export const uploadGeneral = multer({
  storage: assetStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
});

// Helper function to delete uploaded files
export const deleteUploadedFiles = (files: Express.Multer.File | Express.Multer.File[]) => {
  const fileArray = Array.isArray(files) ? files : [files];
  
  fileArray.forEach((file) => {
    if (file && file.path) {
      try {
        fs.unlinkSync(file.path);
      } catch (error) {
        console.error('Failed to delete file:', file.path, error);
      }
    }
  });
};

// Helper function to delete theme directory
export const deleteThemeAssets = (themeId: string) => {
  const themeDir = path.join(themesDir, themeId);
  
  if (fs.existsSync(themeDir)) {
    try {
      fs.rmSync(themeDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to delete theme directory:', themeDir, error);
    }
  }
};

// Helper function to get file URL
export const getFileUrl = (file: Express.Multer.File): string => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const relativePath = file.path.replace(uploadDir, '').replace(/\\/g, '/');
  return `${baseUrl}/uploads${relativePath}`;
};

// Helper function to validate uploaded theme JSON
export const validateThemeJSON = (filePath: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return reject(new Error('Failed to read JSON file'));
      }
      
      try {
        const json = JSON.parse(data);
        
        // Basic validation
        if (!json.name || !json.reels || !json.symbols || !json.paylines) {
          return reject(new Error('Invalid theme JSON structure. Required fields: name, reels, symbols, paylines'));
        }
        
        resolve(json);
      } catch (error) {
        reject(new Error('Invalid JSON format'));
      }
    });
  });
};

export default {
  uploadThemeAssets,
  uploadImage,
  uploadJSON,
  uploadGeneral,
  deleteUploadedFiles,
  deleteThemeAssets,
  getFileUrl,
  validateThemeJSON,
};
