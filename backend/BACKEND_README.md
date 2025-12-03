# Dynamic Multi-Theme 5×6 Slot Game System - Backend

Production-ready Node.js/Express backend for a server-driven slot game platform with PostgreSQL, JWT authentication, and real-time updates.

## Features

- ✅ Server-side RNG with cryptographic security and audit trails
- ✅ JWT authentication with refresh tokens
- ✅ Role-based access control (Super Admin, Game Manager, Support Staff, Player)
- ✅ Atomic wallet transactions with PostgreSQL
- ✅ Dynamic JSON-driven theme system with validation
- ✅ Theme versioning and rollback
- ✅ Real-time updates via Socket.IO
- ✅ Prometheus metrics for monitoring
- ✅ Rate limiting and security headers
- ✅ Comprehensive audit logging
- ✅ RTP calculation and reporting

## Prerequisites

- Node.js >= 14.0.0
- PostgreSQL >= 12
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
SPIN_RATE_LIMIT_WINDOW_MS=60000
SPIN_RATE_LIMIT_MAX_REQUESTS=30

# RTP Configuration
GLOBAL_MIN_RTP=85
GLOBAL_MAX_RTP=98
DEFAULT_RTP=95

# Wallet Configuration
DEFAULT_STARTING_BALANCE=10000

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

## Database Setup

```bash
# Create database migration
npm run prisma:migrate

# Deploy migrations to production
npm run prisma:deploy

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Seed database with sample themes
psql -d slotdb -f ../database/seeders/seed_themes.sql
```

## Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get user profile (authenticated)

### Player Endpoints

- `POST /api/spin` - Execute a slot spin (authenticated, rate-limited)
- `GET /api/spin/history` - Get spin history (authenticated)
- `GET /api/themes` - Get active themes (authenticated)
- `GET /api/wallet` - Get wallet balance (authenticated)

### Admin Endpoints

All admin endpoints require authentication and admin role.

- `POST /api/admin/themes` - Create new theme
- `GET /api/admin/themes` - Get all themes (including drafts)
- `GET /api/admin/themes/:themeId` - Get theme details
- `PUT /api/admin/themes/:themeId` - Update theme
- `POST /api/admin/themes/:themeId/activate` - Activate theme
- `POST /api/admin/themes/:themeId/deactivate` - Deactivate theme
- `POST /api/admin/themes/:themeId/rollback` - Rollback to previous version
- `DELETE /api/admin/themes/:themeId` - Delete theme (super admin only)
- `GET /api/spin/audit/:spinId` - Audit/replay a spin (admin only)

### Monitoring

- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

## Spin Flow

1. Client sends `POST /api/spin` with `{themeId, betAmount}`
2. Server authenticates user and validates balance
3. Server loads active theme configuration
4. Server executes RNG with crypto-secure seed
5. Server generates 5×6 matrix and calculates wins
6. Server updates wallet atomically (debit bet, credit win)
7. Server persists spin log with seed for audit
8. Server returns `{matrix, winAmount, newBalance, winningLines, auditId}`

## Theme JSON Schema

```json
{
  "themeId": "egypt_001",
  "name": "Egypt Gold",
  "version": 1,
  "grid": { "rows": 6, "columns": 5 },
  "symbols": [
    {
      "id": "s1",
      "name": "Wild",
      "asset": "wild.png",
      "weight": 5,
      "paytable": [0, 10, 50, 100]
    }
  ],
  "paylines": [
    {
      "id": "p1",
      "positions": [[0,0], [1,0], [2,0], [3,0], [4,0]]
    }
  ],
  "bonusRules": {
    "scatterTriggerCount": 3,
    "freeSpins": 10,
    "multiplier": 2
  },
  "jackpotRules": {
    "type": "fixed",
    "value": 100000
  }
}
```

## Security Features

- JWT with refresh token rotation
- bcrypt password hashing (10 rounds)
- Helmet.js security headers
- Rate limiting (global and per-endpoint)
- CORS configuration
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- Cryptographically secure RNG
- Audit logging with IP tracking

## Monitoring & Metrics

Prometheus metrics available at `/metrics`:

- `slot_spins_total` - Total spins by theme and result
- `slot_spin_duration_seconds` - Spin latency histogram
- `slot_wallet_balance_coins` - Wallet balances
- `slot_active_users` - Active user count
- `slot_errors_total` - Error counts by type

## Deployment

### Ubuntu 22.04 with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Build the application
npm run build

# Start with PM2
pm2 start dist/app.js --name slot-game-backend

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/
│   │   └── db.ts              # Database connection
│   ├── controllers/
│   │   ├── authController.ts  # Authentication logic
│   │   ├── slotController.ts  # Slot game logic
│   │   └── adminController.ts # Admin operations
│   ├── middleware/
│   │   ├── auth.ts            # JWT authentication
│   │   ├── errorHandler.ts   # Error handling
│   │   └── rateLimiter.ts    # Rate limiting
│   ├── routes/
│   │   ├── authRoutes.ts      # Auth routes
│   │   ├── slotRoutes.ts      # Game routes
│   │   └── adminRoutes.ts     # Admin routes
│   ├── services/
│   │   ├── slotEngine.ts      # RNG and game engine
│   │   └── walletService.ts   # Wallet transactions
│   ├── utils/
│   │   ├── jwt.ts             # JWT utilities
│   │   ├── themeValidator.ts  # Theme JSON validation
│   │   └── metrics.ts         # Prometheus metrics
│   └── app.ts                 # Express app setup
├── .env                        # Environment variables
├── package.json
└── tsconfig.json
```

## License

MIT
