# File Upload System Documentation

## Overview
The backend includes a complete file upload system using Multer for handling theme assets, images, and JSON configuration files.

## Features

- ✅ Multiple file upload support
- ✅ Theme-specific asset management
- ✅ Image upload with validation
- ✅ JSON theme configuration upload
- ✅ Automatic file organization
- ✅ File size limits and validation
- ✅ Secure file storage
- ✅ Static file serving
- ✅ Asset deletion
- ✅ Asset listing

## Upload Directory Structure

```
uploads/
├── themes/
│   ├── {themeId}/
│   │   ├── background-1234567890.png
│   │   ├── symbol1-abcdef1234.png
│   │   └── config-9876543210.json
│   └── {anotherThemeId}/
│       └── assets...
└── assets/
    ├── general-image-1234567890.jpg
    └── other-assets...
```

## Configuration

### Environment Variables

Add to `.env`:
```env
BASE_URL=http://localhost:3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

### File Size Limits

- **Theme Assets**: 10MB per file, max 100 files per upload
- **Images**: 5MB per file
- **JSON**: 1MB per file

### Allowed File Types

**Images:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

**Other:**
- JSON (.json)

## API Endpoints

All upload endpoints require admin authentication (`SUPER_ADMIN` or `GAME_MANAGER` role).

### 1. Upload Theme Assets

Upload multiple files (images, JSON) for a specific theme.

```
POST /api/admin/upload/theme-assets/:themeId
Content-Type: multipart/form-data
Authorization: Bearer JWT_TOKEN
```

**Form Data:**
- Field name: `assets` (multiple files)
- Max files: 100
- Max size per file: 10MB

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/admin/upload/theme-assets/THEME_UUID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "assets=@background.png" \
  -F "assets=@symbol1.png" \
  -F "assets=@symbol2.png" \
  -F "assets=@config.json"
```

**Response:**
```json
{
  "message": "Assets uploaded successfully",
  "theme": {
    "id": "theme-uuid",
    "name": "Egyptian Gold"
  },
  "uploadedAssets": [
    {
      "filename": "background-1733239876543-a1b2c3.png",
      "originalName": "background.png",
      "mimetype": "image/png",
      "size": 524288,
      "url": "http://localhost:3000/uploads/themes/theme-uuid/background-1733239876543-a1b2c3.png",
      "path": "/path/to/uploads/themes/theme-uuid/background-1733239876543-a1b2c3.png"
    }
  ]
}
```

**Notes:**
- Files are stored in `uploads/themes/{themeId}/`
- Filenames are automatically renamed with timestamp and random hash
- Asset manifest in database is automatically updated
- Admin action is logged

### 2. Create Theme (manifest in request body)

The JSON file-upload endpoint (`POST /api/admin/upload/theme-json`) has been removed. To create a theme, POST the theme manifest in the request body to the admin themes API and then upload any assets separately.

Create theme manifest via JSON body:

```
POST /api/admin/themes
Content-Type: application/json
Authorization: Bearer JWT_TOKEN
```

Request body should include fields such as `name`, `jsonSchema` (symbols, reels, paylines, payouts, etc.), and an optional `assetManifest` referencing file paths.

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/admin/themes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Egyptian Gold",
    "jsonSchema": {
      "symbols": ["A","K","Q"],
      "reels": 5,
      "rows": 6,
      "paylines": 30,
      "payouts": {"A": [5,25,100]}
    },
    "assetManifest": {
      "background": "backgrounds/egyptian.png",
      "symbols": {"A": "symbols/a.png"}
    }
  }'
```

Then upload assets (images, JSON) using the theme assets endpoint:

```
POST /api/admin/upload/theme-assets/:themeId
Content-Type: multipart/form-data
Authorization: Bearer JWT_TOKEN
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/admin/upload/theme-assets/THEME_UUID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "assets=@background.png" \
  -F "assets=@symbol1.png"
```

**Notes:**
- Creating a theme via `POST /api/admin/themes` will create a `DRAFT` theme and an initial `ThemeVersion`.
- Uploading assets via `/api/admin/upload/theme-assets/:themeId` will place files under `uploads/themes/{themeId}/` and update the theme's asset manifest.

### 3. Upload Single Image

Upload a single image file.

```
POST /api/admin/upload/image
Content-Type: multipart/form-data
Authorization: Bearer JWT_TOKEN
```

**Form Data:**
- Field name: `image` (single image file)
- Max size: 5MB

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/admin/upload/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@icon.png"
```

**Response:**
```json
{
  "message": "Image uploaded successfully",
  "image": {
    "filename": "icon-1733239876543-a1b2c3.png",
    "originalName": "icon.png",
    "mimetype": "image/png",
    "size": 102400,
    "url": "http://localhost:3000/uploads/assets/icon-1733239876543-a1b2c3.png"
  }
}
```

**Notes:**
- File stored in `uploads/assets/`
- Can be used for any general images (icons, logos, etc.)

### 4. List All Uploaded Assets

Get a list of all files in the general assets directory.

```
GET /api/admin/upload/assets
Authorization: Bearer JWT_TOKEN
```

**Response:**
```json
{
  "assets": [
    {
      "filename": "icon-1733239876543-a1b2c3.png",
      "size": 102400,
      "url": "http://localhost:3000/uploads/assets/icon-1733239876543-a1b2c3.png",
      "createdAt": "2024-12-03T10:30:00.000Z"
    }
  ]
}
```

### 5. List Theme Assets

Get assets for a specific theme from the database.

```
GET /api/admin/upload/theme-assets/:themeId
Authorization: Bearer JWT_TOKEN
```

**Response:**
```json
{
  "themeId": "theme-uuid",
  "themeName": "Egyptian Gold",
  "assets": [
    {
      "filename": "background-1733239876543-a1b2c3.png",
      "originalName": "background.png",
      "mimetype": "image/png",
      "size": 524288,
      "url": "http://localhost:3000/uploads/themes/theme-uuid/background-1733239876543-a1b2c3.png"
    }
  ]
}
```

### 6. Delete Asset

Delete an uploaded asset by filename.

```
DELETE /api/admin/upload/asset/:filename
Authorization: Bearer JWT_TOKEN
```

**Security:**
- Validates filename (prevents path traversal)
- Only allows deletion from `uploads/assets/` or `uploads/themes/`
- Admin action is logged

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/admin/upload/asset/icon-1733239876543-a1b2c3.png \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Asset deleted successfully"
}
```

## Static File Access

Uploaded files are served statically and can be accessed directly via URL:

```
http://localhost:3000/uploads/themes/{themeId}/{filename}
http://localhost:3000/uploads/assets/{filename}
```

**Example:**
```html
<img src="http://localhost:3000/uploads/themes/theme-uuid/background-1733239876543-a1b2c3.png" alt="Background">
```

## Frontend Integration

### Upload Theme Assets (JavaScript)

```javascript
async function uploadThemeAssets(themeId, files) {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('assets', file);
  });
  
  const response = await fetch(`/api/admin/upload/theme-assets/${themeId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    },
    body: formData
  });
  
  return await response.json();
}

// Usage
const input = document.getElementById('fileInput');
const files = input.files;
const result = await uploadThemeAssets('theme-uuid', files);
console.log(result.uploadedAssets);
```

### Upload Theme JSON (React)

```jsx
import { useState } from 'react';

function ThemeUploader() {
  const [file, setFile] = useState(null);
  
  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('theme', file);
    
    const response = await fetch('/api/admin/upload/theme-json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    const result = await response.json();
    alert(`Theme created: ${result.theme.name}`);
  };
  
  return (
    <div>
      <input 
        type="file" 
        accept=".json" 
        onChange={(e) => setFile(e.target.files[0])} 
      />
      <button onClick={handleUpload}>Upload Theme</button>
    </div>
  );
}
```

## Error Handling

### Common Errors

**400 Bad Request:**
```json
{
  "error": "No files uploaded"
}
```

**400 Bad Request (Validation):**
```json
{
  "error": "Invalid file type. Only images (JPEG, PNG, GIF, WebP) and JSON files are allowed."
}
```

**400 Bad Request (Theme JSON):**
```json
{
  "error": "Theme validation failed",
  "errors": [
    "Missing required field: reels",
    "Invalid payline structure"
  ]
}
```

**404 Not Found:**
```json
{
  "error": "Theme not found"
}
```

**413 Payload Too Large:**
```json
{
  "error": "File too large"
}
```

## Security Features

1. **Authentication Required** - All endpoints require valid JWT token
2. **Role-Based Access** - Only admins can upload files
3. **File Type Validation** - Only allowed MIME types accepted
4. **File Size Limits** - Prevents large file uploads
5. **Filename Sanitization** - Random hashes prevent collisions
6. **Path Traversal Protection** - Validates filenames on deletion
7. **Audit Logging** - All uploads/deletions logged in `AdminLog`

## Automatic Cleanup

Files are automatically deleted when:
- Upload fails (rollback)
- Validation fails
- Explicitly deleted via API

## Database Integration

### Asset Manifest Structure

Theme assets are tracked in the `assetManifest` field:

```json
{
  "uploadedFile": "theme-config.json",
  "uploadedAt": "2024-12-03T10:30:00.000Z",
  "base_path": "themes/aqua-slot/game-screen/png-gui/",
  "components": [
    {
      "placeholder": "ui.balance",
      "file_name": "Balance-1700000000000-a1b2c3.png",
      "url": "http://localhost:3000/uploads/themes/theme-uuid/Balance-1700000000000-a1b2c3.png"
    }
  ],
  "updatedAt": "2024-12-03T10:35:00.000Z"
}
```

## Production Considerations

### Nginx Configuration

For production, serve uploads through Nginx:

```nginx
location /uploads/ {
    alias /var/www/slot-game/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Cloud Storage

For scalability, consider using cloud storage (AWS S3, Azure Blob, etc.):

1. Update multer config to use cloud storage adapter
2. Update `getFileUrl()` to return cloud URLs
3. Implement signed URLs for private assets

### File Size Optimization

Recommend implementing:
- Image compression on upload
- Thumbnail generation
- WebP conversion
- CDN integration

## Testing

### Test Upload with cURL

```bash
# Upload theme assets
curl -X POST http://localhost:3000/api/admin/upload/theme-assets/YOUR_THEME_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "assets=@test-image.png"

# Upload theme JSON
curl -X POST http://localhost:3000/api/admin/upload/theme-json \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "theme=@theme-config.json"

# List assets
curl http://localhost:3000/api/admin/upload/assets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Delete asset
curl -X DELETE http://localhost:3000/api/admin/upload/asset/test-image-1234567890.png \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test with Postman

1. Create new POST request to `/api/admin/upload/theme-assets/:themeId`
2. Set Authorization header: `Bearer YOUR_JWT_TOKEN`
3. Go to Body → form-data
4. Add key `assets` with type `File`
5. Select multiple files
6. Send request

## Troubleshooting

### "Cannot find module 'multer'"
```bash
npm install multer @types/multer
```

### "ENOENT: no such file or directory"
The upload directories are created automatically on server start.

### "File too large"
Increase limits in `src/config/multer.ts` or `.env`

### "Invalid file type"
Check MIME type in `imageFileFilter` or `themeAssetFilter`

### Files not accessible via URL
Ensure static middleware is configured in `app.ts`:
```typescript
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
```

## Summary

The file upload system is production-ready with:
- ✅ 6 upload/management endpoints
- ✅ Multiple file upload support
- ✅ File type validation
- ✅ Size limits
- ✅ Automatic organization
- ✅ Database integration
- ✅ Security features
- ✅ Audit logging
- ✅ Static file serving
- ✅ Comprehensive error handling
