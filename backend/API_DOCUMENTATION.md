# API Documentation - Dynamic Slot Game System

**Base URL**: `http://localhost:5000`  
**Version**: 1.0  
**Last Updated**: December 4, 2025

## Table of Contents
1. [Authentication](#authentication)
2. [User Roles](#user-roles)
3. [Slot Game APIs](#slot-game-apis)
4. [Admin Management APIs](#admin-management-apis)
5. [Upload APIs](#upload-apis)
6. [Export APIs](#export-apis)
7. [Gamification APIs](#gamification-apis)
8. [Report APIs](#report-apis)
9. [System APIs](#system-apis)

---

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## User Roles

The system has 4 user roles with different access levels:

| Role | Description | Access Level |
|------|-------------|--------------|
| **PLAYER** | Regular game player | Basic game access, personal data only |
| **SUPPORT_STAFF** | Customer support personnel | Admin panel access, reporting, user management |
| **GAME_MANAGER** | Game configuration manager | Full admin access except critical operations |
| **SUPER_ADMIN** | System administrator | Full access to all operations including deletions |

### Role Hierarchy
- **Admin Roles**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF
- **requireAdmin**: Any admin role
- **requireSuperAdmin**: Only SUPER_ADMIN

---

## Authentication APIs

### 1. Register New User
**Endpoint**: `POST /api/auth/register`  
**Access**: Public (Rate Limited)  
**Description**: Create a new player account

**Request Body**:
```json
{
  "email": "player@example.com",
  "password": "SecurePass123!",
  "displayName": "PlayerOne"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player@example.com",
    "password": "SecurePass123!",
    "displayName": "PlayerOne"
  }'
```

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "player@example.com",
    "displayName": "PlayerOne",
    "role": "PLAYER"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 2. Login
**Endpoint**: `POST /api/auth/login`  
**Access**: Public (Rate Limited)  
**Description**: Authenticate user and get access tokens

**Request Body**:
```json
{
  "email": "player@example.com",
  "password": "SecurePass123!"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player@example.com",
    "password": "SecurePass123!"
  }'
```

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "player@example.com",
    "displayName": "PlayerOne",
    "role": "PLAYER"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 3. Refresh Token
**Endpoint**: `POST /api/auth/refresh`  
**Access**: Public  
**Description**: Get new access token using refresh token

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 4. Logout
**Endpoint**: `POST /api/auth/logout`  
**Access**: Authenticated (All Roles)  
**Description**: Invalidate current session

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

---

### 5. Get Profile
**Endpoint**: `GET /api/auth/profile`  
**Access**: Authenticated (All Roles)  
**Description**: Get current user profile information

**cURL Example**:
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response**:
```json
{
  "id": "uuid",
  "email": "player@example.com",
  "displayName": "PlayerOne",
  "role": "PLAYER",
  "status": "ACTIVE",
  "createdAt": "2025-12-04T10:00:00.000Z",
  "lastLogin": "2025-12-04T12:30:00.000Z"
}
```

---

## Slot Game APIs

### 6. Spin Slot Machine
**Endpoint**: `POST /api/spin`  
**Access**: PLAYER (Rate Limited: 30 spins/minute)  
**Description**: Play a spin on the slot machine

**Request Body**:
```json
{
  "themeId": "uuid",
  "betAmount": 100
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/spin \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "themeId": "550e8400-e29b-41d4-a716-446655440000",
    "betAmount": 100
  }'
```

**Response**:
```json
{
  "spinId": "uuid",
  "result": [
    ["A", "K", "Q", "J", "10"],
    ["K", "Q", "J", "10", "A"],
    ["Q", "J", "10", "A", "K"],
    ["J", "10", "A", "K", "Q"],
    ["10", "A", "K", "Q", "J"],
    ["A", "K", "Q", "J", "10"]
  ],
  "winAmount": 500,
  "balance": 10400,
  "rtpApplied": 95.5
}
```

---

### 7. Get Spin History
**Endpoint**: `GET /api/spin/history`  
**Access**: PLAYER  
**Description**: Get user's spin history

**Query Parameters**:
- `limit` (optional): Number of records (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/spin/history?limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response**:
```json
{
  "spins": [
    {
      "id": "uuid",
      "themeId": "uuid",
      "themeName": "Egyptian Adventure",
      "betAmount": 100,
      "winAmount": 500,
      "resultMatrix": [[...]],
      "createdAt": "2025-12-04T12:30:00.000Z"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

---

### 8. Get Active Themes
**Endpoint**: `GET /api/themes`  
**Access**: PLAYER  
**Description**: Get all active slot themes

**cURL Example**:
```bash
curl -X GET http://localhost:5000/api/themes \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response**:
```json
{
  "themes": [
    {
      "id": "uuid",
      "name": "Egyptian Adventure",
      "version": 1,
      "status": "ACTIVE",
      "symbols": ["A", "K", "Q", "J", "10", "WILD", "SCATTER"],
      "paylines": 30,
      "minBet": 10,
      "maxBet": 1000
    }
  ]
}
```

---

### 9. Get Wallet Balance
**Endpoint**: `GET /api/wallet`  
**Access**: PLAYER  
**Description**: Get current wallet balance

**cURL Example**:
```bash
curl -X GET http://localhost:5000/api/wallet \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response**:
```json
{
  "balance": 10400,
  "currency": "COINS",
  "updatedAt": "2025-12-04T12:30:00.000Z"
}
```

---

### 10. Audit Spin (Admin)
**Endpoint**: `GET /api/spin/audit/:spinId`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Get detailed audit information for a specific spin

**cURL Example**:
```bash
curl -X GET http://localhost:5000/api/spin/audit/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "spin": {
    "id": "uuid",
    "userId": "uuid",
    "userEmail": "player@example.com",
    "themeId": "uuid",
    "themeName": "Egyptian Adventure",
    "betAmount": 100,
    "winAmount": 500,
    "resultMatrix": [[...]],
    "seed": "random-seed-string",
    "rtpApplied": 95.5,
    "createdAt": "2025-12-04T12:30:00.000Z"
  },
  "verification": {
    "isValid": true,
    "expectedRTP": 95.0,
    "actualRTP": 95.5
  }
}
```

---

## Admin Management APIs

### 11. Create Theme
**Endpoint**: `POST /api/admin/themes`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Create a new slot theme

**Request Body**:
```json
{
  "name": "Wild West Adventure",
  "jsonSchema": {
    "symbols": ["A", "K", "Q", "J", "10", "WILD", "SCATTER"],
    "reels": 5,
    "rows": 6,
    "paylines": 30,
    "minBet": 10,
    "maxBet": 1000,
    "payouts": {
      "A": [5, 25, 100],
      "K": [4, 20, 80]
    }
  },
  "assetManifest": {
    "background": "backgrounds/wildwest.png",
    "symbols": {
      "A": "symbols/a.png",
      "K": "symbols/k.png"
    }
  }
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/admin/themes \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wild West Adventure",
    "jsonSchema": {...},
    "assetManifest": {...}
  }'
```

**Response**:
```json
{
  "theme": {
    "id": "uuid",
    "name": "Wild West Adventure",
    "version": 1,
    "status": "DRAFT",
    "createdAt": "2025-12-04T12:30:00.000Z"
  }
}
```

---

### 12. Get All Themes (Admin)
**Endpoint**: `GET /api/admin/themes`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Get all themes including drafts and disabled

**Query Parameters**:
- `status` (optional): Filter by status (DRAFT, ACTIVE, DISABLED)

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/admin/themes?status=ACTIVE" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "themes": [
    {
      "id": "uuid",
      "name": "Egyptian Adventure",
      "version": 1,
      "status": "ACTIVE",
      "createdBy": "admin@example.com",
      "createdAt": "2025-12-04T10:00:00.000Z"
    }
  ]
}
```

---

### 13. Get Theme Details
**Endpoint**: `GET /api/admin/themes/:themeId`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Get detailed information about a specific theme

**cURL Example**:
```bash
curl -X GET http://localhost:5000/api/admin/themes/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "id": "uuid",
  "name": "Egyptian Adventure",
  "version": 1,
  "status": "ACTIVE",
  "jsonSchema": {...},
  "assetManifest": {...},
  "createdBy": "admin@example.com",
  "createdAt": "2025-12-04T10:00:00.000Z",
  "versions": [...]
}
```

---

### 14. Update Theme
**Endpoint**: `PUT /api/admin/themes/:themeId`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Update theme configuration (creates new version)

**Request Body**:
```json
{
  "name": "Egyptian Adventure Deluxe",
  "jsonSchema": {...},
  "assetManifest": {...},
  "notes": "Increased max bet to 2000"
}
```

**cURL Example**:
```bash
curl -X PUT http://localhost:5000/api/admin/themes/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Egyptian Adventure Deluxe",
    "jsonSchema": {...},
    "notes": "Updated payouts"
  }'
```

**Response**:
```json
{
  "theme": {
    "id": "uuid",
    "name": "Egyptian Adventure Deluxe",
    "version": 2,
    "status": "ACTIVE"
  },
  "message": "Theme updated successfully"
}
```

---

### 15. Activate Theme
**Endpoint**: `POST /api/admin/themes/:themeId/activate`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Activate a theme for players

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/admin/themes/550e8400-e29b-41d4-a716-446655440000/activate \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "message": "Theme activated successfully",
  "theme": {
    "id": "uuid",
    "name": "Egyptian Adventure",
    "status": "ACTIVE"
  }
}
```

---

### 16. Deactivate Theme
**Endpoint**: `POST /api/admin/themes/:themeId/deactivate`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Deactivate a theme (hide from players)

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/admin/themes/550e8400-e29b-41d4-a716-446655440000/deactivate \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "message": "Theme deactivated successfully",
  "theme": {
    "id": "uuid",
    "name": "Egyptian Adventure",
    "status": "DISABLED"
  }
}
```

---

### 17. Rollback Theme
**Endpoint**: `POST /api/admin/themes/:themeId/rollback`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Rollback theme to previous version

**Request Body**:
```json
{
  "targetVersion": 1
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/admin/themes/550e8400-e29b-41d4-a716-446655440000/rollback \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetVersion": 1
  }'
```

**Response**:
```json
{
  "message": "Theme rolled back successfully",
  "theme": {
    "id": "uuid",
    "name": "Egyptian Adventure",
    "version": 1
  }
}
```

---

### 18. Delete Theme
**Endpoint**: `DELETE /api/admin/themes/:themeId`  
**Access**: SUPER_ADMIN only  
**Description**: Permanently delete a theme (with safety checks)

**cURL Example**:
```bash
curl -X DELETE http://localhost:5000/api/admin/themes/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer SUPER_ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "message": "Theme deleted successfully"
}
```

---

## Upload APIs

### 19. Upload Theme Assets
**Endpoint**: `POST /api/admin/upload/theme-assets/:themeId`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Upload multiple assets (images, JSON) for a theme

**Request**: multipart/form-data with field name "assets" (max 20 files)

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/admin/upload/theme-assets/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -F "assets=@/path/to/background.png" \
  -F "assets=@/path/to/symbol_a.png" \
  -F "assets=@/path/to/symbol_k.png"
```

**Response**:
```json
{
  "message": "Assets uploaded successfully",
  "files": [
    {
      "filename": "background-1701691234567.png",
      "path": "/uploads/themes/550e8400-e29b-41d4-a716-446655440000/background-1701691234567.png",
      "size": 245678
    }
  ]
}
```

---

### 20. Upload Theme JSON
**Endpoint**: `POST /api/admin/upload/theme-json`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Upload a JSON file to create a new theme

**Request**: multipart/form-data with field name "theme"

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/admin/upload/theme-json \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -F "theme=@/path/to/theme-config.json"
```

**Response**:
```json
{
  "message": "Theme created from JSON successfully",
  "theme": {
    "id": "uuid",
    "name": "New Theme",
    "version": 1,
    "status": "DRAFT"
  }
}
```

---

### 21. Upload Single Image
**Endpoint**: `POST /api/admin/upload/image`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Upload a single image

**Request**: multipart/form-data with field name "image"

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/admin/upload/image \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -F "image=@/path/to/image.png"
```

**Response**:
```json
{
  "message": "Image uploaded successfully",
  "file": {
    "filename": "image-1701691234567.png",
    "path": "/uploads/assets/image-1701691234567.png",
    "url": "http://localhost:5000/uploads/assets/image-1701691234567.png"
  }
}
```

---

### 22. List All Assets
**Endpoint**: `GET /api/admin/upload/assets`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: List all uploaded assets

**cURL Example**:
```bash
curl -X GET http://localhost:5000/api/admin/upload/assets \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "assets": [
    {
      "filename": "background-1701691234567.png",
      "path": "/uploads/assets/background-1701691234567.png",
      "size": 245678,
      "uploadedAt": "2025-12-04T10:00:00.000Z"
    }
  ]
}
```

---

### 23. List Theme Assets
**Endpoint**: `GET /api/admin/upload/theme-assets/:themeId`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: List assets for a specific theme

**cURL Example**:
```bash
curl -X GET http://localhost:5000/api/admin/upload/theme-assets/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "themeId": "550e8400-e29b-41d4-a716-446655440000",
  "assets": [
    {
      "filename": "background-1701691234567.png",
      "path": "/uploads/themes/550e8400-e29b-41d4-a716-446655440000/background-1701691234567.png",
      "size": 245678
    }
  ]
}
```

---

### 24. Delete Asset
**Endpoint**: `DELETE /api/admin/upload/asset/:filename`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Delete an uploaded asset by filename

**cURL Example**:
```bash
curl -X DELETE http://localhost:5000/api/admin/upload/asset/background-1701691234567.png \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "message": "Asset deleted successfully"
}
```

---

## Export APIs

### 25. Export Spins to CSV
**Endpoint**: `GET /api/admin/export/spins`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Export spin logs to CSV file

**Query Parameters**:
- `userId` (optional): Filter by user ID
- `themeId` (optional): Filter by theme ID
- `startDate` (optional): Start date (ISO 8601)
- `endDate` (optional): End date (ISO 8601)

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/admin/export/spins?startDate=2025-12-01&endDate=2025-12-04" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -o spins.csv
```

**Response**: CSV file download

---

### 26. Export Transactions to CSV
**Endpoint**: `GET /api/admin/export/transactions`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Export transactions to CSV file

**Query Parameters**:
- `userId` (optional): Filter by user ID
- `type` (optional): Transaction type (CREDIT, DEBIT, SPIN, WIN, etc.)
- `startDate` (optional): Start date (ISO 8601)
- `endDate` (optional): End date (ISO 8601)

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/admin/export/transactions?type=WIN&startDate=2025-12-01" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -o transactions.csv
```

**Response**: CSV file download

---

### 27. Export Users to CSV
**Endpoint**: `GET /api/admin/export/users`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Export users to CSV file

**Query Parameters**:
- `role` (optional): Filter by role
- `status` (optional): Filter by status (ACTIVE, BANNED, DISABLED)
- `startDate` (optional): Registration start date
- `endDate` (optional): Registration end date

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/admin/export/users?role=PLAYER&status=ACTIVE" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -o users.csv
```

**Response**: CSV file download

---

### 28. Export RTP Report to CSV
**Endpoint**: `GET /api/admin/export/rtp`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Export RTP report to CSV file

**Query Parameters**:
- `startDate` (optional): Start date (ISO 8601)
- `endDate` (optional): End date (ISO 8601)

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/admin/export/rtp?startDate=2025-12-01&endDate=2025-12-04" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -o rtp_report.csv
```

**Response**: CSV file download

---

### 29. Export Admin Logs to CSV
**Endpoint**: `GET /api/admin/export/admin-logs`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Export admin action logs to CSV file

**Query Parameters**:
- `adminId` (optional): Filter by admin user ID
- `action` (optional): Filter by action type
- `startDate` (optional): Start date (ISO 8601)
- `endDate` (optional): End date (ISO 8601)

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/admin/export/admin-logs?action=CREATE_THEME" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -o admin_logs.csv
```

**Response**: CSV file download

---

## Gamification APIs

### 30. Get My Achievements
**Endpoint**: `GET /api/gamification/achievements`  
**Access**: PLAYER  
**Description**: Get current user's unlocked achievements

**cURL Example**:
```bash
curl -X GET http://localhost:5000/api/gamification/achievements \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response**:
```json
{
  "achievements": [
    {
      "id": "uuid",
      "code": "FIRST_SPIN",
      "name": "First Spin",
      "description": "Complete your first spin",
      "icon": "🎰",
      "reward": 100,
      "category": "gameplay",
      "unlockedAt": "2025-12-04T10:00:00.000Z",
      "progress": 100
    }
  ],
  "totalUnlocked": 5,
  "totalRewards": 500
}
```

---

### 31. Get Leaderboard
**Endpoint**: `GET /api/gamification/leaderboard`  
**Access**: PLAYER  
**Description**: Get current leaderboard

**Query Parameters**:
- `type` (optional): TOTAL_WINS, BIGGEST_WIN, SPINS_COUNT (default: TOTAL_WINS)
- `period` (optional): DAILY, WEEKLY, MONTHLY, ALL_TIME (default: WEEKLY)

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/gamification/leaderboard?type=TOTAL_WINS&period=WEEKLY" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response**:
```json
{
  "leaderboard": {
    "type": "TOTAL_WINS",
    "period": "WEEKLY",
    "startDate": "2025-12-01T00:00:00.000Z",
    "endDate": "2025-12-07T23:59:59.999Z"
  },
  "entries": [
    {
      "rank": 1,
      "userId": "uuid",
      "displayName": "PlayerOne",
      "score": 50000,
      "details": {
        "totalWins": 50000,
        "spinsCount": 500
      }
    }
  ],
  "myRank": 15
}
```

---

### 32. Get My Rank
**Endpoint**: `GET /api/gamification/rank`  
**Access**: PLAYER  
**Description**: Get current user's rank in leaderboards

**Query Parameters**:
- `type` (optional): TOTAL_WINS, BIGGEST_WIN, SPINS_COUNT
- `period` (optional): DAILY, WEEKLY, MONTHLY, ALL_TIME

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/gamification/rank?type=TOTAL_WINS&period=WEEKLY" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response**:
```json
{
  "rank": 15,
  "score": 12500,
  "type": "TOTAL_WINS",
  "period": "WEEKLY"
}
```

---

### 33. Get Achievement Stats (Admin)
**Endpoint**: `GET /api/gamification/admin/achievements/stats`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Get statistics about achievement unlocks

**cURL Example**:
```bash
curl -X GET http://localhost:5000/api/gamification/admin/achievements/stats \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "totalAchievements": 20,
  "totalUnlocks": 1500,
  "achievementStats": [
    {
      "achievementId": "uuid",
      "code": "FIRST_SPIN",
      "name": "First Spin",
      "unlockCount": 450,
      "unlockPercentage": 90.0
    }
  ]
}
```

---

### 34. Create Achievement (Admin)
**Endpoint**: `POST /api/gamification/admin/achievements`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Create a new achievement

**Request Body**:
```json
{
  "code": "HIGH_ROLLER",
  "name": "High Roller",
  "description": "Win 100,000 coins in total",
  "icon": "💎",
  "requirement": {
    "type": "total_wins",
    "amount": 100000
  },
  "reward": 5000,
  "category": "wins"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/gamification/admin/achievements \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "HIGH_ROLLER",
    "name": "High Roller",
    "description": "Win 100,000 coins in total",
    "icon": "💎",
    "requirement": {"type": "total_wins", "amount": 100000},
    "reward": 5000,
    "category": "wins"
  }'
```

**Response**:
```json
{
  "achievement": {
    "id": "uuid",
    "code": "HIGH_ROLLER",
    "name": "High Roller",
    "description": "Win 100,000 coins in total",
    "reward": 5000,
    "createdAt": "2025-12-04T12:30:00.000Z"
  }
}
```

---

### 35. Delete Achievement (Admin)
**Endpoint**: `DELETE /api/gamification/admin/achievements/:id`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Delete an achievement

**cURL Example**:
```bash
curl -X DELETE http://localhost:5000/api/gamification/admin/achievements/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "message": "Achievement deleted successfully"
}
```

---

### 36. Generate Leaderboard (Admin)
**Endpoint**: `POST /api/gamification/admin/leaderboards/generate`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Manually generate leaderboard data

**Request Body**:
```json
{
  "type": "TOTAL_WINS",
  "period": "WEEKLY"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/gamification/admin/leaderboards/generate \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TOTAL_WINS",
    "period": "WEEKLY"
  }'
```

**Response**:
```json
{
  "message": "Leaderboard generated successfully",
  "leaderboard": {
    "id": "uuid",
    "type": "TOTAL_WINS",
    "period": "WEEKLY",
    "entryCount": 100
  }
}
```

---

### 37. Refresh Leaderboards (Admin)
**Endpoint**: `POST /api/gamification/admin/leaderboards/refresh`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Refresh all active leaderboards

**cURL Example**:
```bash
curl -X POST http://localhost:5000/api/gamification/admin/leaderboards/refresh \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "message": "Leaderboards refreshed successfully",
  "refreshedCount": 12
}
```

---

## Report APIs

### 38. Get RTP Report
**Endpoint**: `GET /api/admin/reports/rtp`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Get RTP report with statistics

**Query Parameters**:
- `themeId` (optional): Filter by theme ID
- `startDate` (optional): Start date (ISO 8601)
- `endDate` (optional): End date (ISO 8601)
- `period` (optional): Group by period (daily, weekly, monthly)

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/admin/reports/rtp?startDate=2025-12-01&endDate=2025-12-04&period=daily" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "summary": {
    "averageRTP": 95.2,
    "totalSpins": 10000,
    "totalBetAmount": 1000000,
    "totalWinAmount": 952000
  },
  "byTheme": [
    {
      "themeId": "uuid",
      "themeName": "Egyptian Adventure",
      "rtp": 95.5,
      "spins": 5000,
      "betAmount": 500000,
      "winAmount": 477500
    }
  ],
  "periods": [
    {
      "date": "2025-12-01",
      "rtp": 94.8,
      "spins": 2500
    }
  ]
}
```

---

### 39. Get All Themes RTP
**Endpoint**: `GET /api/admin/reports/rtp/all`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Get current RTP for all active themes

**cURL Example**:
```bash
curl -X GET http://localhost:5000/api/admin/reports/rtp/all \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "themes": [
    {
      "themeId": "uuid",
      "themeName": "Egyptian Adventure",
      "status": "ACTIVE",
      "currentRTP": 95.5,
      "targetRTP": 95.0,
      "lastCalculated": "2025-12-04T12:00:00.000Z",
      "totalSpins": 5000
    }
  ]
}
```

---

### 40. Get Theme RTP History
**Endpoint**: `GET /api/admin/reports/rtp/history/:themeId`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Get historical RTP data for a theme

**Query Parameters**:
- `limit` (optional): Number of records (default: 100)

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/admin/reports/rtp/history/550e8400-e29b-41d4-a716-446655440000?limit=50" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "themeId": "550e8400-e29b-41d4-a716-446655440000",
  "themeName": "Egyptian Adventure",
  "history": [
    {
      "calculatedRTP": 95.5,
      "windowStart": "2025-12-04T00:00:00.000Z",
      "windowEnd": "2025-12-04T23:59:59.999Z",
      "spinsInWindow": 2500
    }
  ]
}
```

---

### 41. Get Spin Logs Report
**Endpoint**: `GET /api/admin/reports/spins`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Get spin logs with filters

**Query Parameters**:
- `userId` (optional): Filter by user ID
- `themeId` (optional): Filter by theme ID
- `startDate` (optional): Start date (ISO 8601)
- `endDate` (optional): End date (ISO 8601)
- `limit` (optional): Number of records (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/admin/reports/spins?themeId=550e8400-e29b-41d4-a716-446655440000&limit=20" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "spins": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userEmail": "player@example.com",
      "themeId": "uuid",
      "themeName": "Egyptian Adventure",
      "betAmount": 100,
      "winAmount": 500,
      "rtpApplied": 95.5,
      "createdAt": "2025-12-04T12:30:00.000Z"
    }
  ],
  "total": 10000,
  "limit": 20,
  "offset": 0
}
```

---

### 42. Get User Activity Report
**Endpoint**: `GET /api/admin/reports/users`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Get user activity report

**Query Parameters**:
- `limit` (optional): Number of records (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/admin/reports/users?limit=20" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "users": [
    {
      "userId": "uuid",
      "email": "player@example.com",
      "displayName": "PlayerOne",
      "role": "PLAYER",
      "status": "ACTIVE",
      "totalSpins": 500,
      "totalBetAmount": 50000,
      "totalWinAmount": 47500,
      "currentBalance": 10400,
      "lastLogin": "2025-12-04T12:30:00.000Z",
      "createdAt": "2025-11-01T10:00:00.000Z"
    }
  ],
  "total": 500,
  "limit": 20,
  "offset": 0
}
```

---

### 43. Get Transaction Report
**Endpoint**: `GET /api/admin/reports/transactions`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Get transaction report

**Query Parameters**:
- `userId` (optional): Filter by user ID
- `type` (optional): Transaction type
- `startDate` (optional): Start date (ISO 8601)
- `endDate` (optional): End date (ISO 8601)
- `limit` (optional): Number of records (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/admin/reports/transactions?type=WIN&limit=20" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "transactions": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userEmail": "player@example.com",
      "amount": 500,
      "type": "WIN",
      "balanceAfter": 10400,
      "reason": "Slot spin win",
      "createdAt": "2025-12-04T12:30:00.000Z"
    }
  ],
  "summary": {
    "totalCredits": 50000,
    "totalDebits": 45000,
    "netChange": 5000
  },
  "total": 10000,
  "limit": 20,
  "offset": 0
}
```

---

### 44. Get Theme Performance
**Endpoint**: `GET /api/admin/reports/themes`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Get theme performance metrics

**Query Parameters**:
- `startDate` (optional): Start date (ISO 8601)
- `endDate` (optional): End date (ISO 8601)

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/admin/reports/themes?startDate=2025-12-01&endDate=2025-12-04" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "themes": [
    {
      "themeId": "uuid",
      "themeName": "Egyptian Adventure",
      "status": "ACTIVE",
      "totalSpins": 5000,
      "totalBetAmount": 500000,
      "totalWinAmount": 477500,
      "rtp": 95.5,
      "uniquePlayers": 250,
      "averageBetSize": 100,
      "popularityRank": 1
    }
  ],
  "dateRange": {
    "startDate": "2025-12-01T00:00:00.000Z",
    "endDate": "2025-12-04T23:59:59.999Z"
  }
}
```

---

### 45. Get Admin Logs
**Endpoint**: `GET /api/admin/reports/admin-logs`  
**Access**: SUPER_ADMIN, GAME_MANAGER, SUPPORT_STAFF  
**Description**: Get admin action audit logs

**Query Parameters**:
- `adminId` (optional): Filter by admin user ID
- `action` (optional): Filter by action type
- `limit` (optional): Number of records (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**cURL Example**:
```bash
curl -X GET "http://localhost:5000/api/admin/reports/admin-logs?action=CREATE_THEME&limit=20" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response**:
```json
{
  "logs": [
    {
      "id": "uuid",
      "adminId": "uuid",
      "adminEmail": "admin@example.com",
      "action": "CREATE_THEME",
      "objectType": "Theme",
      "objectId": "uuid",
      "payload": {
        "themeName": "Wild West Adventure"
      },
      "ip": "192.168.1.1",
      "createdAt": "2025-12-04T12:30:00.000Z"
    }
  ],
  "total": 500,
  "limit": 20,
  "offset": 0
}
```

---

## System APIs

### 46. Health Check
**Endpoint**: `GET /health`  
**Access**: Public  
**Description**: Check if the server is running

**cURL Example**:
```bash
curl -X GET http://localhost:5000/health
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-12-04T12:30:00.000Z"
}
```

---

### 47. Metrics (Prometheus)
**Endpoint**: `GET /metrics`  
**Access**: Public  
**Description**: Get Prometheus metrics for monitoring

**cURL Example**:
```bash
curl -X GET http://localhost:5000/metrics
```

**Response**: Prometheus-formatted metrics

---

## Error Responses

All API endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request data",
  "details": ["betAmount must be a positive number"]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

| Endpoint Type | Limit | Window |
|--------------|-------|---------|
| Authentication | 5 requests | 1 minute |
| Spin | 30 requests | 1 minute |
| General API | 100 requests | 1 minute |

When rate limit is exceeded, the API returns HTTP 429 with a `Retry-After` header.

---

## WebSocket Events

The system also supports real-time WebSocket connections for live updates:

**Connection**: `ws://localhost:5000`

### Events:
- `spin_result`: Real-time spin results
- `leaderboard_update`: Leaderboard changes
- `achievement_unlocked`: When user unlocks an achievement
- `balance_update`: Wallet balance changes

---

## Authentication Flow

1. **Register** or **Login** to get `accessToken` and `refreshToken`
2. Use `accessToken` in `Authorization: Bearer <token>` header for all authenticated requests
3. When `accessToken` expires (15 minutes), use `/api/auth/refresh` with `refreshToken` to get a new token pair
4. `refreshToken` expires after 7 days, requiring re-authentication

---

## Role-Based Access Summary

| API Category | PLAYER | SUPPORT_STAFF | GAME_MANAGER | SUPER_ADMIN |
|-------------|--------|---------------|--------------|-------------|
| Authentication | ✅ | ✅ | ✅ | ✅ |
| Slot Game | ✅ | ❌ | ❌ | ❌ |
| Wallet | ✅ | ❌ | ❌ | ❌ |
| Gamification (Player) | ✅ | ❌ | ❌ | ❌ |
| Theme Management | ❌ | ✅ | ✅ | ✅ |
| File Upload | ❌ | ✅ | ✅ | ✅ |
| Reports | ❌ | ✅ | ✅ | ✅ |
| Export | ❌ | ✅ | ✅ | ✅ |
| Gamification (Admin) | ❌ | ✅ | ✅ | ✅ |
| Spin Audit | ❌ | ✅ | ✅ | ✅ |
| Theme Deletion | ❌ | ❌ | ❌ | ✅ |

---

## Environment Variables

Required environment variables for API configuration:

```env
DATABASE_URL=postgresql://user:pass@host:port/dbname
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000
CORS_ORIGIN=*
GLOBAL_MIN_RTP=85
GLOBAL_MAX_RTP=98
DEFAULT_RTP=95
DEFAULT_STARTING_BALANCE=10000
```

---

## Support

For API support or questions:
- Check server logs at `/var/log/app.log`
- Monitor metrics at `/metrics`
- Health check at `/health`

---

**Document Version**: 1.0  
**API Version**: 1.0  
**Last Updated**: December 4, 2025
