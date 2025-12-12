import { getRTPReport, getThemePerformance } from '../src/controllers/reportController';
import { getRTPBreakdown } from '../src/services/rtpService';
import prisma from '../src/config/db';

jest.mock('../src/config/db');
jest.mock('../src/services/rtpService');

type MockedPrisma = typeof prisma & {
  theme: { findMany: jest.Mock };
  spin: { findMany: jest.Mock; aggregate: jest.Mock };
};

const prismaMock = prisma as MockedPrisma;

describe('reportController - RTP Reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates RTP report with breakdown', async () => {
    const mockBreakdown = [
      {
        themeId: 'theme-1',
        themeName: 'Test Theme 1',
        status: 'ACTIVE',
        totalSpins: 100,
        totalBet: 1000,
        totalWin: 900,
        rtp: 90,
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-02') },
      },
      {
        themeId: 'theme-2',
        themeName: 'Test Theme 2',
        status: 'ACTIVE',
        totalSpins: 50,
        totalBet: 500,
        totalWin: 550,
        rtp: 110,
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-02') },
      },
    ];

    (getRTPBreakdown as jest.Mock).mockResolvedValue(mockBreakdown);

    const req = {
      user: { id: 'admin-1', role: 'SUPER_ADMIN' },
      query: { period: '7d' },
    } as any;

    const res = {
      json: jest.fn(),
    } as any;

    await getRTPReport(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        report: expect.objectContaining({
          breakdown: expect.arrayContaining([
            expect.objectContaining({ themeId: 'theme-1', rtp: 90 }),
            expect.objectContaining({ themeId: 'theme-2', rtp: 110 }),
          ]),
        }),
      })
    );
  });

  it('calculates theme performance metrics', async () => {
    prismaMock.theme.findMany.mockResolvedValue([
      { id: 'theme-1', name: 'Theme 1', status: 'ACTIVE' },
      { id: 'theme-2', name: 'Theme 2', status: 'ACTIVE' },
    ]);

    prismaMock.spin.findMany
      .mockResolvedValueOnce([
        { betAmount: 10, winAmount: 5, userId: 'user-1' },
        { betAmount: 20, winAmount: 30, userId: 'user-2' },
      ])
      .mockResolvedValueOnce([
        { betAmount: 15, winAmount: 20, userId: 'user-1' },
      ]);

    const req = {
      user: { id: 'admin-1', role: 'SUPER_ADMIN' },
      query: {},
    } as any;

    const res = {
      json: jest.fn(),
    } as any;

    await getThemePerformance(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        performance: expect.any(Array),
      })
    );
  });
});
