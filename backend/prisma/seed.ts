import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean up existing data (optional - comment out if you want to preserve data)
  // await prisma.theme.deleteMany({});
  // await prisma.wallet.deleteMany({});
  // await prisma.user.deleteMany({});

  // Create Super Admin (or find existing)
  const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);

  let admin = await prisma.user.findUnique({
    where: { email: 'admin@slotgame.com' },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin@slotgame.com',
        passwordHash: hashedPassword,
        displayName: 'Super Admin',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Super Admin created:', admin.email);
  } else {
    console.log('ℹ️  Super Admin already exists:', admin.email);
  }

  // Create Game Manager
  const gameManagerPassword = await bcrypt.hash('GameManager123!', 10);
  let gameManager = await prisma.user.findUnique({
    where: { email: 'gamemanager@slotgame.com' },
  });

  if (!gameManager) {
    gameManager = await prisma.user.create({
      data: {
        email: 'gamemanager@slotgame.com',
        passwordHash: gameManagerPassword,
        displayName: 'Game Manager',
        role: 'GAME_MANAGER',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Game Manager created:', gameManager.email);
  } else {
    console.log('ℹ️  Game Manager already exists:', gameManager.email);
  }

  // Create Support Staff
  const staffPassword = await bcrypt.hash('Support123!', 10);
  let supportStaff = await prisma.user.findUnique({
    where: { email: 'support@slotgame.com' },
  });

  if (!supportStaff) {
    supportStaff = await prisma.user.create({
      data: {
        email: 'support@slotgame.com',
        passwordHash: staffPassword,
        displayName: 'Support Staff',
        role: 'SUPPORT_STAFF',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Support Staff created:', supportStaff.email);
  } else {
    console.log('ℹ️  Support Staff already exists:', supportStaff.email);
  }

  // Create Sample Player
  const playerPassword = await bcrypt.hash('Player123!', 10);
  let player = await prisma.user.findUnique({
    where: { email: 'player@slotgame.com' },
  });

  if (!player) {
    player = await prisma.user.create({
      data: {
        email: 'player@slotgame.com',
        passwordHash: playerPassword,
        displayName: 'Sample Player',
        role: 'PLAYER',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Sample Player created:', player.email);
  } else {
    console.log('ℹ️  Sample Player already exists:', player.email);
  }

  // Create wallets for all users (if they don't exist)
  const adminWallet = await prisma.wallet.findUnique({
    where: { userId: admin.id },
  });

  if (!adminWallet) {
    await prisma.wallet.create({
      data: {
        userId: admin.id,
        balance: 100000,
        currency: 'COINS',
      },
    });
    console.log('✅ Wallet created for Admin');
  }

  const gmWallet = await prisma.wallet.findUnique({
    where: { userId: gameManager.id },
  });

  if (!gmWallet) {
    await prisma.wallet.create({
      data: {
        userId: gameManager.id,
        balance: 50000,
        currency: 'COINS',
      },
    });
    console.log('✅ Wallet created for Game Manager');
  }

  const staffWallet = await prisma.wallet.findUnique({
    where: { userId: supportStaff.id },
  });

  if (!staffWallet) {
    await prisma.wallet.create({
      data: {
        userId: supportStaff.id,
        balance: 10000,
        currency: 'COINS',
      },
    });
    console.log('✅ Wallet created for Support Staff');
  }

  const playerWallet = await prisma.wallet.findUnique({
    where: { userId: player.id },
  });

  if (!playerWallet) {
    await prisma.wallet.create({
      data: {
        userId: player.id,
        balance: 5000,
        currency: 'COINS',
      },
    });
    console.log('✅ Wallet created for Player');
  }

  // Create a test theme with full game configuration (if it doesn't exist)
  let testTheme = await prisma.theme.findUnique({
    where: { id: 'test-classic-001' },
  });

  if (!testTheme) {
    testTheme = await prisma.theme.create({
      data: {
        id: 'test-classic-001',
        name: 'Classic Gold',
        version: 1,
        status: 'ACTIVE',
        createdBy: admin.id,
        jsonSchema: {
          themeId: 'test-classic-001',
          name: 'Classic Gold',
          version: 1,
          grid: {
            rows: 6,
            columns: 5,
          },
          symbols: [
            {
              id: 'A',
              name: 'Ace',
              asset: 'symbols/a.png',
              weight: 12,
              paytable: [10, 50, 250],
            },
            {
              id: 'K',
              name: 'King',
              asset: 'symbols/k.png',
              weight: 12,
              paytable: [8, 40, 200],
            },
            {
              id: 'Q',
              name: 'Queen',
              asset: 'symbols/q.png',
              weight: 12,
              paytable: [6, 30, 150],
            },
            {
              id: 'J',
              name: 'Jack',
              asset: 'symbols/j.png',
              weight: 12,
              paytable: [5, 25, 100],
            },
            {
              id: '10',
              name: 'Ten',
              asset: 'symbols/10.png',
              weight: 12,
              paytable: [4, 20, 80],
            },
            {
              id: 'GOLD',
              name: 'Gold Star',
              asset: 'symbols/gold.png',
              weight: 8,
              paytable: [20, 100, 500],
            },
          ],
          paylines: [
            {
              id: 'line1',
              positions: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
            },
            {
              id: 'line2',
              positions: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]],
            },
            {
              id: 'line3',
              positions: [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]],
            },
            {
              id: 'line4',
              positions: [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3]],
            },
            {
              id: 'line5',
              positions: [[0, 4], [1, 4], [2, 4], [3, 4], [4, 4]],
            },
          ],
          bonusRules: {
            scatterTriggerCount: 3,
            freeSpins: 10,
            multiplier: 2,
          },
          jackpotRules: {
            type: 'fixed',
            value: 10000,
          },
        },
        assetManifest: {
          base_path: 'themes/classic-gold/',
          components: [
            { placeholder: 'background', file_name: 'background.png', url: 'themes/classic-gold/background.png' },
            { placeholder: 'reels', file_name: 'reels.png', url: 'themes/classic-gold/reels.png' },
          ],
        },
      },
    });
    console.log('✅ Test theme created:', testTheme.name);

    // Create theme version
    await prisma.themeVersion.create({
      data: {
        themeId: testTheme.id,
        version: 1,
        json: testTheme.jsonSchema,
        assets: testTheme.assetManifest,
        notes: 'Initial version',
      },
    });

    console.log('✅ Theme version created');
  } else {
    console.log('ℹ️  Test theme already exists:', testTheme.name);
  }

  console.log('🎰 Database seed completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('   Admin       - admin@slotgame.com / AdminPassword123!');
  console.log('   Game Manager - gamemanager@slotgame.com / GameManager123!');
  console.log('   Support Staff - support@slotgame.com / Support123!');
  console.log('   Player      - player@slotgame.com / Player123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });