import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth interceptor
const playerApi = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add token
playerApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
playerApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return playerApi(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

// ============= SLOT GAME =============

export interface SpinRequest {
  themeId: string;
  betAmount: number;
}

export interface SpinResult {
  spinId: string;
  result: any[][];
  winAmount: number;
  winningLines: any[];
  balance: number;
  multiplier: number;
  bonusTriggered: boolean;
  rtpApplied: number;
}

export interface SpinHistory {
  spins: Array<{
    id: string;
    themeId: string;
    betAmount: number;
    winAmount: number;
    result: any[][];
    createdAt: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}

export const spinSlot = async (themeId: string, betAmount: number): Promise<SpinResult> => {
  const response = await playerApi.post('/spin', { themeId, betAmount });
  return response.data;
};

export const getSpinHistory = async (
  limit: number = 50,
  offset: number = 0
): Promise<SpinHistory> => {
  const response = await playerApi.get('/spin/history', {
    params: { limit, offset },
  });
  return response.data;
};

// ============= THEMES =============

export interface Theme {
  id: string;
  name: string;
  jsonSchema: {
    grid: {
      rows: number;
      columns: number;
    };
    symbols: Array<{
      id: string;
      name: string;
      type?: string;
      asset: string;
      weight: number;
      paytable: number[];
    }>;
    paylines: Array<{
      id: number | string;
      positions: number[][];
    }>;
    bonusRules?: any;
    jackpotRules?: any;
  };
  minBet: number;
  maxBet: number;
}

export const getActiveThemes = async (): Promise<{ themes: Theme[] }> => {
  const response = await playerApi.get('/themes');
  return response.data;
};

export const getThemeDetails = async (themeId: string): Promise<{ theme: Theme }> => {
  const response = await playerApi.get(`/themes/${themeId}`);
  return response.data;
};

// ============= WALLET =============

export interface WalletData {
  balance: number;
  currency: string;
  updatedAt?: string;
}

export interface Wallet extends WalletData {}

export interface WalletResponse {
  wallet?: WalletData;
  balance?: number;
  currency?: string;
  updatedAt?: string;
}

export const getWalletBalance = async (): Promise<WalletResponse> => {
  const response = await playerApi.get('/wallet');
  return response.data;
};

// ============= GAMIFICATION =============

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  rewardAmount: number;
  unlockedAt: string;
  progress?: number;
  requirementValue?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  value: number;
  isCurrentUser?: boolean;
}

export interface Leaderboard {
  type: string;
  period: string;
  entries: LeaderboardEntry[];
  myRank?: number;
}

export interface UserRank {
  rank: number;
  value: number;
  type: string;
  period: string;
}

export const getMyAchievements = async () => {
  const response = await playerApi.get('/gamification/achievements');
  return response.data;
};

export const getLeaderboard = async (
  type: 'TOTAL_WINS' | 'BIGGEST_WIN' | 'SPINS_COUNT' = 'TOTAL_WINS',
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME' = 'WEEKLY'
): Promise<Leaderboard> => {
  const response = await playerApi.get('/gamification/leaderboard', {
    params: { type, period },
  });
  return response.data;
};

export const getMyRank = async (
  type?: 'TOTAL_WINS' | 'BIGGEST_WIN' | 'SPINS_COUNT',
  period?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME'
): Promise<UserRank> => {
  const response = await playerApi.get('/gamification/rank', {
    params: { type, period },
  });
  return response.data;
};

export default playerApi;
