import crypto from 'crypto';

export interface Symbol {
  id: string;
  name: string;
  asset: string;
  weight: number;
  paytable: number[];
}

export interface Payline {
  id: string;
  positions: number[][];
}

export interface BonusRules {
  scatterTriggerCount: number;
  freeSpins: number;
  multiplier: number;
}

export interface JackpotRules {
  type: 'fixed' | 'progressive';
  value: number;
}

export interface ThemeConfig {
  themeId: string;
  name: string;
  version: number;
  grid: { rows: number; columns: number };
  symbols: Symbol[];
  paylines: Payline[];
  bonusRules: BonusRules;
  jackpotRules: JackpotRules;
}

export interface SpinResult {
  matrix: string[][];
  winAmount: number;
  winningLines: Array<{
    paylineId: string;
    symbol: string;
    count: number;
    payout: number;
  }>;
  bonusTriggered: boolean;
  jackpotWon: boolean;
  seed: string;
}

/**
 * Generate a cryptographically secure random seed
 */
export function generateSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Seeded random number generator using crypto HMAC
 */
class SeededRNG {
  private seed: string;
  private counter: number;

  constructor(seed: string) {
    this.seed = seed;
    this.counter = 0;
  }

  next(): number {
    const hmac = crypto.createHmac('sha256', this.seed);
    hmac.update(this.counter.toString());
    const hash = hmac.digest('hex');
    this.counter++;
    
    // Convert first 8 hex chars to number between 0 and 1
    const value = parseInt(hash.substring(0, 8), 16) / 0xffffffff;
    return value;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

/**
 * Select a random symbol based on weights
 */
function selectSymbol(symbols: Symbol[], rng: SeededRNG): string {
  const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
  let random = rng.next() * totalWeight;
  
  for (const symbol of symbols) {
    random -= symbol.weight;
    if (random <= 0) {
      return symbol.id;
    }
  }
  
  return symbols[0].id; // Fallback
}

/**
 * Generate the slot matrix using RNG
 */
export function generateMatrix(theme: ThemeConfig, seed: string): string[][] {
  const rng = new SeededRNG(seed);
  const matrix: string[][] = [];
  
  const { rows, columns } = theme.grid;
  
  for (let col = 0; col < columns; col++) {
    const column: string[] = [];
    for (let row = 0; row < rows; row++) {
      column.push(selectSymbol(theme.symbols, rng));
    }
    matrix.push(column);
  }
  
  return matrix;
}

/**
 * Check if a payline matches and calculate payout
 */
function checkPayline(
  matrix: string[][],
  payline: Payline,
  symbols: Symbol[]
): { symbol: string; count: number; payout: number } | null {
  if (!payline.positions || payline.positions.length === 0) {
    return null;
  }

  const symbolMap = new Map(symbols.map(s => [s.id, s]));
  const firstPosition = payline.positions[0];
  const firstSymbol = matrix[firstPosition[0]][firstPosition[1]];
  
  let matchCount = 1;
  
  // Check consecutive symbols
  for (let i = 1; i < payline.positions.length; i++) {
    const pos = payline.positions[i];
    const symbol = matrix[pos[0]][pos[1]];
    
    if (symbol === firstSymbol || symbol === 'wild' || firstSymbol === 'wild') {
      matchCount++;
    } else {
      break;
    }
  }
  
  // Minimum 3 matches required
  if (matchCount < 3) {
    return null;
  }
  
  const symbolData = symbolMap.get(firstSymbol);
  if (!symbolData || !symbolData.paytable) {
    return null;
  }
  
  const payout = symbolData.paytable[matchCount - 1] || 0;
  
  if (payout > 0) {
    return {
      symbol: firstSymbol,
      count: matchCount,
      payout,
    };
  }
  
  return null;
}

/**
 * Calculate total winnings from all paylines
 */
export function calculateWinnings(
  matrix: string[][],
  theme: ThemeConfig,
  betAmount: number
): {
  totalWin: number;
  winningLines: Array<{
    paylineId: string;
    symbol: string;
    count: number;
    payout: number;
  }>;
  bonusTriggered: boolean;
  jackpotWon: boolean;
} {
  let totalWin = 0;
  const winningLines: Array<{
    paylineId: string;
    symbol: string;
    count: number;
    payout: number;
  }> = [];
  
  // Check all paylines
  for (const payline of theme.paylines) {
    const result = checkPayline(matrix, payline, theme.symbols);
    if (result) {
      const linePayout = result.payout * betAmount;
      totalWin += linePayout;
      winningLines.push({
        paylineId: payline.id,
        ...result,
      });
    }
  }
  
  // Check for scatter/bonus trigger
  let scatterCount = 0;
  for (const col of matrix) {
    for (const symbol of col) {
      if (symbol === 's2' || symbol.toLowerCase().includes('scatter')) {
        scatterCount++;
      }
    }
  }
  
  const bonusTriggered = scatterCount >= (theme.bonusRules?.scatterTriggerCount || 3);
  
  if (bonusTriggered && theme.bonusRules) {
    totalWin *= theme.bonusRules.multiplier;
  }
  
  // Check for jackpot (5 of a kind on any payline)
  const jackpotWon = winningLines.some(line => line.count === 5);
  
  if (jackpotWon && theme.jackpotRules) {
    totalWin += theme.jackpotRules.value;
  }
  
  return {
    totalWin: Math.floor(totalWin),
    winningLines,
    bonusTriggered,
    jackpotWon,
  };
}

/**
 * Execute a complete spin
 */
export function executeSpin(theme: ThemeConfig, betAmount: number): SpinResult {
  const seed = generateSeed();
  const matrix = generateMatrix(theme, seed);
  const { totalWin, winningLines, bonusTriggered, jackpotWon } = calculateWinnings(
    matrix,
    theme,
    betAmount
  );
  
  return {
    matrix,
    winAmount: totalWin,
    winningLines,
    bonusTriggered,
    jackpotWon,
    seed,
  };
}

/**
 * Replay a spin with a given seed (for auditing)
 */
export function replaySpin(theme: ThemeConfig, betAmount: number, seed: string): SpinResult {
  const matrix = generateMatrix(theme, seed);
  const { totalWin, winningLines, bonusTriggered, jackpotWon } = calculateWinnings(
    matrix,
    theme,
    betAmount
  );
  
  return {
    matrix,
    winAmount: totalWin,
    winningLines,
    bonusTriggered,
    jackpotWon,
    seed,
  };
}
