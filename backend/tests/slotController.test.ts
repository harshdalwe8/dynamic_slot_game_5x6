import { spin } from '../src/controllers/slotController';
import prisma from '../src/config/db';
import * as walletService from '../src/services/walletService';
import * as achievementService from '../src/services/achievementService';
import * as slotEngine from '../src/services/slotEngine';
import { getSocketService } from '../src/services/socketServiceInstance';

jest.mock('../src/config/db');
jest.mock('../src/services/walletService');
jest.mock('../src/services/achievementService');
jest.mock('../src/services/slotEngine');
jest.mock('../src/services/socketServiceInstance');

type MockedPrisma = typeof prisma & {
  theme: { findFirst: jest.Mock };
  spin: { create: jest.Mock };
};

type MockedWalletService = typeof walletService & {
  getBalance: jest.Mock;
  executeSpinTransaction: jest.Mock;
};

const prismaMock = prisma as MockedPrisma;
const walletMock = walletService as MockedWalletService;

describe('slotController - spin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes a spin and returns win result', async () => {
    const spinResult = {
      matrix: [[0, 1], [2, 0], [1, 2]],
      winAmount: 50,
      winningLines: [1],
      bonusTriggered: false,
      jackpotWon: false,
      seed: 'seed-123',
    };

    walletMock.getBalance.mockResolvedValue(100);

    prismaMock.theme.findFirst.mockResolvedValue({
      id: 'theme-1',
      name: 'Test Theme',
      jsonSchema: {
        grid: { rows: 3, columns: 5 },
        symbols: [
          { id: 'A', name: 'Ace', weight: 8, paytable: [5, 15, 40] },
          { id: 'K', name: 'King', weight: 8, paytable: [5, 12, 35] },
          { id: 'Q', name: 'Queen', weight: 9, paytable: [4, 10, 30] },
        ],
        paylines: [{ id: 1, positions: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] }],
        bonusRules: { freeSpins: 5, multiplier: 2, scatterTriggerCount: 3 },
        jackpotRules: { type: 'fixed', value: 1000 },
      },
    });

    (slotEngine.executeSpin as jest.Mock).mockReturnValue(spinResult);

    prismaMock.spin.create.mockResolvedValue({
      id: 'spin-1',
      userId: 'user-1',
      themeId: 'theme-1',
      betAmount: 10,
      winAmount: 50,
      seed: 'seed-123',
      resultMatrix: spinResult.matrix,
      rtpApplied: 5,
    });

    walletMock.executeSpinTransaction.mockResolvedValue({
      newBalance: 140,
    });

    (achievementService.checkAndUnlockAchievements as jest.Mock).mockResolvedValue([]);

    const socketService = { emitSpinResult: jest.fn(), emitBalanceUpdate: jest.fn(), emitAchievementUnlocked: jest.fn() };
    (getSocketService as jest.Mock).mockReturnValue(socketService);

    const req = {
      user: { id: 'user-1' },
      body: { themeId: 'theme-1', betAmount: 10 },
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await spin(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        winAmount: 50,
        newBalance: 140,
      })
    );

    // Verify socket events were emitted
    expect(socketService.emitSpinResult).toHaveBeenCalledWith('user-1', expect.any(Object));
    expect(socketService.emitBalanceUpdate).toHaveBeenCalledWith('user-1', 140, expect.any(Object));
  });

  it('rejects spin with insufficient balance', async () => {
    walletMock.getBalance.mockResolvedValue(5); // Less than bet amount

    const req = {
      user: { id: 'user-1' },
      body: { themeId: 'theme-1', betAmount: 10 },
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await spin(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Insufficient balance'),
      })
    );
  });
});
