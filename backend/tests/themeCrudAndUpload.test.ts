import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/db';
import supertest from 'supertest';
import app from '../src/app';

// Use in-process app to avoid external server and rate limits
const request = supertest(app);

// Increase timeout for integration flow
jest.setTimeout(30000);

describe('Admin Theme CRUD + Upload integration', () => {
  const adminUserId = 'admin-test-user';
  const adminEmail = 'admin@slotgame.com';
  const adminPassword = 'AdminPassword123!';
  const adminRole = 'SUPER_ADMIN';
  const jwtSecret = process.env.JWT_SECRET || 'testsecret';
  let token: string;

  const themeId = 'test004';
  const themeName = 'Test Theme Upload code';

  const symbolsDir = path.join(
    __dirname,
    'test_theme_symbol'
  );

  beforeAll(async () => {
    // Ensure JWT secret is set for auth middleware
    process.env.JWT_SECRET = jwtSecret;

    // Create admin user in DB with ACTIVE status
    try {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await prisma.user.create({
        data: {
          id: adminUserId,
          email: adminEmail,
          passwordHash,
          displayName: 'Admin Test',
          role: adminRole,
          status: 'ACTIVE',
        },
      });
    } catch (e) {
      // ignore if already exists
    }

    // Login via API to obtain server-issued JWT token
    const loginRes = await request
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword });

    expect(loginRes.status).toBeLessThan(400);
    expect(loginRes.body).toHaveProperty('accessToken');
    token = loginRes.body.accessToken;
  });

  afterAll(async () => {
    // Clean up created theme directory if exists
    const themePublicDir = path.join(process.cwd(), 'public', 'theme', themeName, 'symbols');
    if (fs.existsSync(themePublicDir)) {
      const files = fs.readdirSync(themePublicDir);
      for (const f of files) {
        try { fs.unlinkSync(path.join(themePublicDir, f)); } catch {}
      }
      try { fs.rmdirSync(themePublicDir); } catch {}
    }
    // Optionally remove user
    try { await prisma.user.delete({ where: { id: adminUserId } }); } catch {}
  });

  it('creates a theme and uploads symbols, then updates theme', async () => {
    // 1) Create theme
    const validSchema = {
      themeId,
      name: themeName,
      version: 1,
      grid: { rows: 6, columns: 5 },
      symbols: [
        { id: 'A', name: 'Ace', asset: 'A.png', weight: 10, paytable: [0,5,10,20,50,100] },
        { id: 'K', name: 'King', asset: 'K.png', weight: 8, paytable: [0,4,8,16,40,80] },
        { id: 'Q', name: 'Queen', asset: 'Q.png', weight: 6, paytable: [0,3,6,12,30,60] },
      ],
      paylines: [
        { id: '1', positions: [[0,0],[1,0],[2,0],[3,0],[4,0]] },
      ],
      bonusRules: { scatterTriggerCount: 3, freeSpins: 5, multiplier: 2 },
      jackpotRules: { type: 'fixed', value: 1000 },
      minBet: 1,
      maxBet: 100
    };

    // Seed theme directly via Prisma to avoid API dependency
    // Delete if already exists (must delete versions first due to FK)
    try {
      await prisma.themeVersion.deleteMany({ where: { themeId } });
      await prisma.theme.delete({ where: { id: themeId } });
    } catch {}

    await prisma.theme.create({
      data: {
        id: themeId,
        name: themeName,
        version: 1,
        status: 'DRAFT',
        jsonSchema: validSchema as any,
        assetManifest: {},
        minBet: 1,
        maxBet: 100,
        createdBy: adminUserId,
      },
    });

    await prisma.themeVersion.create({
      data: {
        themeId,
        version: 1,
        json: validSchema as any,
        assets: {},
        notes: 'Seeded in test',
      },
    });

    // 2) Upload symbols via multipart to admin upload route
    // Ensure files with names matching schema symbols exist (A.png, K.png)
    const aPath = path.join(symbolsDir, 'A.png');
    const kPath = path.join(symbolsDir, 'K.png');
    if (!fs.existsSync(symbolsDir)) {
      fs.mkdirSync(symbolsDir, { recursive: true });
    }
    // Create tiny placeholder PNG-like files
    const dummy = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    if (!fs.existsSync(aPath)) fs.writeFileSync(aPath, dummy);
    if (!fs.existsSync(kPath)) fs.writeFileSync(kPath, dummy);
    const symbolFiles = ['A.png', 'K.png'];

    let uploadReq = request
      .post(`/api/admin/upload/theme-symbols/${themeId}`)
      .set('Authorization', `Bearer ${token}`);

    for (const f of symbolFiles) {
      uploadReq = uploadReq.attach('symbols', path.join(symbolsDir, f));
    }

    const uploadRes = await uploadReq;
    expect(uploadRes.status).toBeLessThan(400);
    expect(uploadRes.body).toHaveProperty('files');
    expect(Array.isArray(uploadRes.body.files)).toBe(true);
    expect(uploadRes.body.files.length).toBeGreaterThan(0);

    // Validate files are present in public/theme/<name>/symbols
    // Use path from response (upload endpoint converts theme name to lowercase with underscores)
    expect(uploadRes.body).toHaveProperty('themeDirectory');
    const uploadedDir = path.join(process.cwd(), uploadRes.body.themeDirectory);
    expect(fs.existsSync(uploadedDir)).toBe(true);
    const savedFiles = fs.readdirSync(uploadedDir);
    expect(savedFiles.length).toBeGreaterThan(0);

    // 3) Upload theme assets (UI elements like balance, background)
    const assetsDir = path.join(__dirname, 'test_theme_assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    const balancePath = path.join(assetsDir, 'balance.png');
    const bkgPath = path.join(assetsDir, 'bkg.png');
    if (!fs.existsSync(balancePath)) fs.writeFileSync(balancePath, dummy);
    if (!fs.existsSync(bkgPath)) fs.writeFileSync(bkgPath, dummy);

    let assetUploadReq = request
      .post(`/api/admin/upload/theme-assets/${themeId}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('assets', balancePath)
      .attach('assets', bkgPath);

    const assetUploadRes = await assetUploadReq;
    expect(assetUploadRes.status).toBeLessThan(400);
    expect(assetUploadRes.body).toHaveProperty('files');
    expect(Array.isArray(assetUploadRes.body.files)).toBe(true);
    expect(assetUploadRes.body.files.length).toBe(2);

    // Verify assets are in separate assets/ folder
    const assetsUploadedDir = path.join(process.cwd(), assetUploadRes.body.themeDirectory);
    expect(fs.existsSync(assetsUploadedDir)).toBe(true);
    expect(assetsUploadedDir).toContain('assets');
    const savedAssets = fs.readdirSync(assetsUploadedDir);
    expect(savedAssets.length).toBeGreaterThan(0);
    expect(savedAssets).toContain('balance.png');
    expect(savedAssets).toContain('bkg.png');

    // 4) Update theme with a new maxBet
    const updatedSchema = {
      ...validSchema,
      maxBet: 200,
      version: 2,
    };

    const updateRes = await request
      .put(`/api/admin/themes/${themeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        configuration: updatedSchema,
      });

    expect(updateRes.status).toBeLessThan(400);
    expect(updateRes.body).toHaveProperty('theme');
    expect(updateRes.body.theme.id).toBe(themeId);
  });
});
