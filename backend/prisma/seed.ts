import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Super Admin
  const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@slotgame.com',
      passwordHash: hashedPassword,
      displayName: 'Super Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Super Admin created:', admin.email);

  // Create Game Manager
  const gameManagerPassword = await bcrypt.hash('GameManager123!', 10);
  const gameManager = await prisma.user.create({
    data: {
      email: 'gamemanager@slotgame.com',
      passwordHash: gameManagerPassword,
      displayName: 'Game Manager',
      role: 'GAME_MANAGER',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Game Manager created:', gameManager.email);

  // Create Support Staff
  const staffPassword = await bcrypt.hash('Support123!', 10);
  const supportStaff = await prisma.user.create({
    data: {
      email: 'support@slotgame.com',
      passwordHash: staffPassword,
      displayName: 'Support Staff',
      role: 'SUPPORT_STAFF',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Support Staff created:', supportStaff.email);

  // Create Sample Player
  const playerPassword = await bcrypt.hash('Player123!', 10);
  const player = await prisma.user.create({
    data: {
      email: 'player@slotgame.com',
      passwordHash: playerPassword,
      displayName: 'Sample Player',
      role: 'PLAYER',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Sample Player created:', player.email);

  // Create wallets for all users
  await prisma.wallet.create({
    data: {
      userId: admin.id,
      balance: 100000,
      currency: 'COINS',
    },
  });

  await prisma.wallet.create({
    data: {
      userId: gameManager.id,
      balance: 50000,
      currency: 'COINS',
    },
  });

  await prisma.wallet.create({
    data: {
      userId: supportStaff.id,
      balance: 10000,
      currency: 'COINS',
    },
  });

  await prisma.wallet.create({
    data: {
      userId: player.id,
      balance: 5000,
      currency: 'COINS',
    },
  });

  console.log('✅ Wallets created for all users');

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