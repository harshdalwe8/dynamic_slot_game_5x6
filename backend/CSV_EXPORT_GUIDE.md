# CSV Export & Reporting Features

## Overview
The system includes comprehensive CSV export functionality and advanced reporting capabilities for admin users.

## CSV Export Endpoints

All export endpoints require admin authentication (`SUPER_ADMIN` or `GAME_MANAGER` role).

### 1. Export Spin Logs
```
GET /api/admin/export/spins
```

**Query Parameters:**
- `userId` (optional) - Filter by user ID
- `themeId` (optional) - Filter by theme ID
- `startDate` (optional) - Filter from date (ISO 8601)
- `endDate` (optional) - Filter to date (ISO 8601)

**Response:** CSV file with columns:
- spinId, userId, userEmail, userName, themeId, themeName, betAmount, winAmount, rtp, seed, createdAt

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/admin/export/spins?startDate=2024-01-01&endDate=2024-12-31" \
  -o spins.csv
```

### 2. Export Transactions
```
GET /api/admin/export/transactions
```

**Query Parameters:**
- `userId` (optional) - Filter by user ID
- `type` (optional) - Filter by type (CREDIT, DEBIT, SPIN, WIN, BONUS, etc.)
- `startDate` (optional) - Filter from date
- `endDate` (optional) - Filter to date

**Response:** CSV file with columns:
- transactionId, userId, userEmail, userName, amount, type, balanceAfter, reference, reason, adminId, createdAt

### 3. Export Users
```
GET /api/admin/export/users
```

**Query Parameters:**
- `role` (optional) - Filter by role (PLAYER, GAME_MANAGER, etc.)
- `status` (optional) - Filter by status (ACTIVE, BANNED, DISABLED)
- `startDate` (optional) - Filter by registration date
- `endDate` (optional) - Filter by registration date

**Response:** CSV file with columns:
- userId, email, displayName, role, status, balance, currency, totalSpins, totalTransactions, createdAt, lastLogin

### 4. Export RTP Report
```
GET /api/admin/export/rtp
```

**Query Parameters:**
- `startDate` (optional) - Period start (default: 7 days ago)
- `endDate` (optional) - Period end (default: now)

**Response:** CSV file with columns:
- themeId, themeName, status, totalSpins, totalBet, totalWin, rtp, period

### 5. Export Admin Logs
```
GET /api/admin/export/admin-logs
```

**Query Parameters:**
- `adminId` (optional) - Filter by admin user ID
- `action` (optional) - Filter by action type
- `startDate` (optional) - Filter from date
- `endDate` (optional) - Filter to date

**Response:** CSV file with columns:
- logId, adminId, adminEmail, adminName, adminRole, action, objectType, objectId, payload, ip, createdAt

## Reporting Endpoints

All reporting endpoints require admin authentication.

### 1. RTP Report
```
GET /api/admin/reports/rtp
```

**Query Parameters:**
- `themeId` (optional) - Specific theme
- `startDate` (optional) - Period start
- `endDate` (optional) - Period end
- `period` (optional) - Predefined period: `24h`, `7d`, `30d`, `90d`

**Response:**
```json
{
  "themeId": "uuid",
  "themeName": "Egyptian Gold",
  "totalSpins": 15000,
  "totalBet": 1500000,
  "totalWin": 1425000,
  "rtp": 95.00,
  "period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-12-31T23:59:59Z"
  }
}
```

### 2. All Themes RTP
```
GET /api/admin/reports/rtp/all
```

Returns current 24-hour RTP for all active themes.

### 3. Theme RTP History
```
GET /api/admin/reports/rtp/history/:themeId?limit=30
```

Returns historical RTP snapshots for a specific theme.

### 4. Spin Logs Report
```
GET /api/admin/reports/spins
```

**Query Parameters:**
- `userId`, `themeId`, `startDate`, `endDate`
- `limit` (default: 100), `offset` (default: 0)

**Response:** Paginated spin logs with user and theme details.

### 5. User Activity Report
```
GET /api/admin/reports/users?limit=100&offset=0
```

Returns user activity metrics (balance, spin count, transaction count).

### 6. Transaction Report
```
GET /api/admin/reports/transactions
```

**Query Parameters:**
- `userId`, `type`, `startDate`, `endDate`
- `limit`, `offset`

### 7. Theme Performance
```
GET /api/admin/reports/themes
```

**Query Parameters:**
- `startDate`, `endDate`

**Response:**
```json
{
  "themes": [
    {
      "themeId": "uuid",
      "themeName": "Egyptian Gold",
      "totalSpins": 15000,
      "totalBet": 1500000,
      "totalWin": 1425000,
      "uniqueUsers": 450,
      "rtp": 95.00,
      "avgBetPerSpin": 100
    }
  ]
}
```

### 8. Admin Logs
```
GET /api/admin/reports/admin-logs
```

**Query Parameters:**
- `adminId`, `action`
- `limit`, `offset`

## Usage Examples

### Export Last 30 Days of Transactions
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/admin/export/transactions?startDate=2024-11-01&endDate=2024-12-01" \
  -o transactions.csv
```

### Get RTP Report for Specific Theme
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/admin/reports/rtp?themeId=THEME_UUID&period=30d"
```

### Export All Users with Their Stats
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/admin/export/users" \
  -o users.csv
```

## Audit Logging

All export operations are automatically logged in the `AdminLog` table with:
- Admin user ID
- Action type (e.g., `EXPORT_SPINS`, `EXPORT_TRANSACTIONS`)
- Filters applied
- IP address
- Timestamp

## Rate Limiting

Export endpoints use the same rate limits as other admin endpoints (100 requests per 15 minutes per IP).

## Security Notes

1. All endpoints require JWT authentication
2. Admin role required (SUPER_ADMIN or GAME_MANAGER)
3. All actions are audit logged
4. CSV files use secure HTTP headers to prevent injection attacks
5. Large exports are streamed to prevent memory issues
