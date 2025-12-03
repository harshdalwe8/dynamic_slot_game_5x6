# Quick Start & Deployment Guide

## Prerequisites

- Node.js >= 14.0.0
- PostgreSQL >= 12 running and accessible
- npm or yarn

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Configure Environment

Edit `.env` file with your database credentials:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
PORT=3000
NODE_ENV=production
```

## Step 3: Generate Prisma Client

```bash
npm run prisma:generate
```

## Step 4: Run Database Migrations

```bash
# For development
npm run prisma:migrate

# For production
npm run prisma:deploy
```

## Step 5: Seed Database (Optional)

```bash
# Using psql
psql -h HOST -U USER -d DATABASE -f ../database/migrations/001_create_slot_tables.sql
psql -h HOST -U USER -d DATABASE -f ../database/seeders/seed_themes.sql
```

## Step 6: Create First Admin User

Use POST /api/auth/register to create a user, then manually update the role in the database:

```sql
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'admin@example.com';
```

## Step 7: Start the Server

### Development Mode

```bash
npm run dev
```

### Production Mode with PM2

```bash
# Build
npm run build

# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start dist/app.js --name slot-game-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

## Step 8: Configure Nginx (Production)

Create `/etc/nginx/sites-available/slot-game`:

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

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/slot-game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 9: Setup SSL with Let's Encrypt (Production)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Step 10: Verify Installation

```bash
# Check health
curl http://localhost:3000/health

# Check metrics
curl http://localhost:3000/metrics
```

## Testing the API

### Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player@example.com",
    "password": "SecurePass123",
    "displayName": "Test Player"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player@example.com",
    "password": "SecurePass123"
  }'
```

### Execute a Spin

```bash
curl -X POST http://localhost:3000/api/spin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "themeId": "egypt_001",
    "betAmount": 100
  }'
```

## Monitoring

### View PM2 Logs

```bash
pm2 logs slot-game-backend
```

### Check Server Status

```bash
pm2 status
```

### Monitor Metrics with Prometheus

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'slot-game'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

## Troubleshooting

### Database Connection Issues

1. Check DATABASE_URL in .env
2. Verify PostgreSQL is running: `sudo systemctl status postgresql`
3. Check firewall rules
4. Test connection: `psql -h HOST -U USER -d DATABASE`

### Build Errors

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Permission Issues

```bash
# Fix file permissions
chmod +x dist/app.js
```

## Backup & Maintenance

### Database Backup

```bash
pg_dump -h HOST -U USER DATABASE > backup_$(date +%Y%m%d).sql
```

### Update Application

```bash
git pull
npm install
npm run build
pm2 restart slot-game-backend
```

## Security Checklist

- [ ] Change JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Set NODE_ENV=production
- [ ] Configure CORS_ORIGIN to your domain
- [ ] Enable HTTPS with SSL certificate
- [ ] Set strong database password
- [ ] Configure firewall (allow only 80, 443, SSH)
- [ ] Enable fail2ban for SSH protection
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Monitor logs regularly
- [ ] Set up automated backups

## Performance Tuning

### PostgreSQL Tuning

Edit `/etc/postgresql/*/main/postgresql.conf`:

```
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
```

### PM2 Cluster Mode

```bash
pm2 start dist/app.js -i max --name slot-game-backend
```

## Support

For issues or questions, refer to:
- `BACKEND_README.md` - Full API documentation
- `IMPLEMENTATION_SUMMARY.md` - Feature list
- Prisma docs: https://www.prisma.io/docs/
- Express docs: https://expressjs.com/

---

**Ready to deploy!** 🚀
