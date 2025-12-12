import { validateThemeJson } from '../src/utils/themeValidator';

describe('validateThemeJson (strict schema)', () => {
  it('accepts a valid strict theme with string payline IDs', () => {
    const theme = {
      themeId: 'demo',
      name: 'Demo',
      version: 1,
      grid: { rows: 5, columns: 6 },
      symbols: [
        { id: 'A', name: 'Ace', asset: 'A.png', weight: 10, paytable: [0, 1, 5] },
        { id: 'K', name: 'King', asset: 'K.png', weight: 8, paytable: [0, 1, 4] },
        { id: 'Q', name: 'Queen', asset: 'Q.png', weight: 6, paytable: [0, 1, 3] },
      ],
      paylines: [
        { id: 'L1', positions: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]] },
      ],
      bonusRules: { scatterTriggerCount: 3, freeSpins: 10, multiplier: 2 },
      jackpotRules: { type: 'fixed', value: 1000 },
    };

    const result = validateThemeJson(theme);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts a valid strict theme with numeric payline IDs', () => {
    const theme = {
      themeId: 'demo',
      name: 'Demo',
      version: 1,
      grid: { rows: 3, columns: 5 },
      symbols: [
        { id: 'A', name: 'Ace', asset: 'A.png', weight: 10, paytable: [0, 1, 5] },
        { id: 'K', name: 'King', asset: 'K.png', weight: 8, paytable: [0, 1, 4] },
        { id: 'Q', name: 'Queen', asset: 'Q.png', weight: 6, paytable: [0, 1, 3] },
      ],
      paylines: [
        { id: 1, positions: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
        { id: 2, positions: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]] },
        { id: 3, positions: [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]] },
      ],
      bonusRules: { scatterTriggerCount: 3, freeSpins: 10, multiplier: 2 },
      jackpotRules: { type: 'fixed', value: 1000 },
    };

    const result = validateThemeJson(theme);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects missing mandatory fields', () => {
    const theme = {
      themeId: 'demo',
      name: 'Demo',
      version: 1,
      grid: { rows: 5, columns: 6 },
      symbols: [],
      paylines: [],
      bonusRules: { scatterTriggerCount: 0, freeSpins: 0, multiplier: 1 },
      jackpotRules: { type: 'fixed', value: 0 },
    } as any;

    const result = validateThemeJson(theme);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('validateThemeJson (UI manifest)', () => {
  it('accepts a manifest format', () => {
    const manifest = {
      theme_id: 'demo',
      theme_name: 'Demo',
      base_path: '/theme/demo',
      components: [
        { placeholder: 'background', file_name: 'bg.png' },
        { placeholder: 'reel', file_name: 'reel.png' },
      ],
    };

    const result = validateThemeJson(manifest);
    expect(result.valid).toBe(true);
  });

  it('rejects manifest missing components', () => {
    const manifest = {
      theme_id: 'demo',
      theme_name: 'Demo',
      base_path: '/theme/demo',
      components: [],
    };

    const result = validateThemeJson(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('components'))).toBe(true);
  });
});
