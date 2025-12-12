import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Demo API for theme preview (no authentication required)
const demoApi = axios.create({
  baseURL: API_BASE_URL,
});

export interface DemoSpinRequest {
  themeId: string;
  betAmount: number;
}

export interface DemoSpinResult {
  result: string[][];
  winAmount: number;
  winningLines: any[];
  multiplier: number;
  rtpApplied: number;
}

/**
 * Execute a demo spin without deducting from wallet
 * Returns a spin result for preview purposes
 */
export const demospinSlot = async (themeId: string, betAmount: number): Promise<DemoSpinResult> => {
  try {
    const response = await demoApi.post('/demo/spin', { themeId, betAmount });
    return response.data;
  } catch (error: any) {
    // Fallback: Generate mock results if demo endpoint doesn't exist
    return generateMockSpinResult();
  }
};

/**
 * Get theme preview data without authentication
 */
export const getThemePreview = async (themeId: string) => {
  try {
    const response = await demoApi.get(`/themes/${themeId}/preview`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching theme preview:', error);
    throw error;
  }
};

/**
 * Generate mock spin results for demo purposes
 * This is used when backend demo endpoint is not available
 */
function generateMockSpinResult(): DemoSpinResult {
  const symbols = ['A', 'K', 'Q', 'J', '10', '💎'];
  const result: string[][] = [];

  // Generate 6 rows x 5 columns
  for (let row = 0; row < 6; row++) {
    result[row] = [];
    for (let col = 0; col < 5; col++) {
      result[row][col] = symbols[Math.floor(Math.random() * symbols.length)];
    }
  }

  // Simulate winning on first payline (horizontal match)
  const winningSymbol = symbols[Math.floor(Math.random() * symbols.length)];
  for (let col = 0; col < 5; col++) {
    result[0][col] = winningSymbol;
  }

  return {
    result,
    winAmount: Math.random() > 0.5 ? 250 : 0,
    winningLines: Math.random() > 0.5 ? [{ lineId: 1, symbols: 5, payout: 250 }] : [],
    multiplier: 2.5,
    rtpApplied: 96.5,
  };
}
