import request from 'supertest';
import express from 'express';
import { createTheme, updateTheme, activateTheme } from '../src/controllers/adminController';
import prisma from '../src/config/db';

jest.mock('../src/config/db', () => ({
  __esModule: true,
  default: {
    theme: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    themeVersion: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    adminLog: {
      create: jest.fn(),
    },
    spin: {
      count: jest.fn(),
    },
  },
}));

type MockedPrisma = typeof prisma & {
  theme: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock; findMany: jest.Mock };
  themeVersion: { create: jest.Mock; findFirst: jest.Mock };
  adminLog: { create: jest.Mock };
  spin: { count: jest.Mock };
};

const prismaMock = prisma as MockedPrisma;

describe('adminController - Theme Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a theme with configuration parameter', async () => {
    const themePayload = {
      themeId: 'test001',
      version: 1,
      grid: { rows: 3, columns: 5 },
      symbols: [
        { id: 'A', name: 'Ace', type: 'regular', weight: 8, paytable: [5, 15, 40], asset: 'A.png' },
        { id: 'K', name: 'King', type: 'regular', weight: 8, paytable: [5, 12, 35], asset: 'K.png' },
        { id: 'Q', name: 'Queen', type: 'regular', weight: 9, paytable: [4, 10, 30], asset: 'Q.png' },
      ],
      paylines: [
        { id: 1, positions: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
        { id: 2, positions: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]] },
      ],
      bonusRules: { freeSpins: 5, multiplier: 2, scatterTriggerCount: 3 },
      jackpotRules: { type: 'fixed', value: 1000 },
    };

    prismaMock.theme.create.mockResolvedValue({
      id: 'test001',
      name: 'Test Theme',
      version: 1,
      status: 'DRAFT',
      jsonSchema: themePayload,
    });

    prismaMock.themeVersion.create.mockResolvedValue({
      themeId: 'test001',
      version: 1,
      json: themePayload,
    });

    prismaMock.adminLog.create.mockResolvedValue({});

    const req = {
      user: { id: 'admin-1', role: 'SUPER_ADMIN' },
      body: {
        name: 'Test Theme',
        configuration: themePayload,
        minBet: 10,
        maxBet: 1000,
      },
      ip: '127.0.0.1',
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await createTheme(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: expect.objectContaining({
          id: 'test001',
          name: 'Test Theme',
        }),
      })
    );
  });

  it('activates a theme and validates before activation', async () => {
    prismaMock.theme.findUnique.mockResolvedValue({
      id: 'test001',
      name: 'Test Theme',
      version: 1,
      status: 'DRAFT',
      jsonSchema: {
        themeId: 'test001',
        version: 1,
        grid: { rows: 3, columns: 5 },
        symbols: [
          { id: 'A', name: 'Ace', weight: 8, paytable: [5, 15, 40], asset: 'A.png' },
          { id: 'K', name: 'King', weight: 8, paytable: [5, 12, 35], asset: 'K.png' },
          { id: 'Q', name: 'Queen', weight: 9, paytable: [4, 10, 30], asset: 'Q.png' },
        ],
        paylines: [
          { id: 1, positions: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
        ],
        bonusRules: { freeSpins: 5, multiplier: 2, scatterTriggerCount: 3 },
        jackpotRules: { type: 'fixed', value: 1000 },
      },
    });

    prismaMock.theme.update.mockResolvedValue({
      id: 'test001',
      status: 'ACTIVE',
    });

    prismaMock.adminLog.create.mockResolvedValue({});

    const req = {
      user: { id: 'admin-1', role: 'SUPER_ADMIN' },
      params: { themeId: 'test001' },
      ip: '127.0.0.1',
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await activateTheme(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: expect.objectContaining({
          status: 'ACTIVE',
        }),
      })
    );
  });
});
