import { calculateThemeRTP, getRTPBreakdown } from '../src/services/rtpService';

jest.mock('../src/config/db', () => ({
  __esModule: true,
  default: {
    spin: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    theme: {
      findMany: jest.fn(),
    },
  },
}));

type MockedPrisma = typeof import('../src/config/db').default & {
  spin: { findMany: jest.Mock; aggregate: jest.Mock };
  theme: { findMany: jest.Mock };
};

const prismaMock = require('../src/config/db').default as MockedPrisma;

describe('rtpService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates theme RTP from spin logs', async () => {
    prismaMock.spin.findMany.mockResolvedValue([
      { betAmount: 10, winAmount: 5 },
      { betAmount: 20, winAmount: 30 },
    ]);

    const rtp = await calculateThemeRTP('theme-1', new Date('2024-01-01'), new Date('2024-01-02'));
    expect(rtp).toBeCloseTo((5 + 30) / (10 + 20) * 100);
    expect(prismaMock.spin.findMany).toHaveBeenCalled();
  });

  it('returns 0 when no spins found', async () => {
    prismaMock.spin.findMany.mockResolvedValue([]);

    const rtp = await calculateThemeRTP('theme-1', new Date('2024-01-01'), new Date('2024-01-02'));
    expect(rtp).toBe(0);
  });

  it('produces per-theme breakdown with aggregates', async () => {
    prismaMock.theme.findMany.mockResolvedValue([
      { id: 't1', name: 'Theme 1', status: 'ACTIVE' },
      { id: 't2', name: 'Theme 2', status: 'INACTIVE' },
    ]);

    prismaMock.spin.aggregate
      .mockResolvedValueOnce({ _sum: { betAmount: 100, winAmount: 90 }, _count: 10 })
      .mockResolvedValueOnce({ _sum: { betAmount: 50, winAmount: 60 }, _count: 5 });

    const start = new Date('2024-01-01');
    const end = new Date('2024-01-02');
    const breakdown = await getRTPBreakdown(start, end);

    expect(prismaMock.theme.findMany).toHaveBeenCalled();
    expect(prismaMock.spin.aggregate).toHaveBeenCalledTimes(2);
    expect(breakdown).toHaveLength(2);
    expect(breakdown[0].rtp).toBeCloseTo(90 / 100 * 100);
    expect(breakdown[1].rtp).toBeCloseTo(60 / 50 * 100);
  });
});
