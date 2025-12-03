import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ============= Authentication APIs =============

export const loginUser = async (email: string, password: string) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (email: string, password: string, displayName: string) => {
  const response = await apiClient.post('/auth/register', { email, password, displayName });
  return response.data;
};

export const refreshAccessToken = async (refreshToken: string) => {
  const response = await apiClient.post('/auth/refresh', { refreshToken });
  return response.data;
};

export const logoutUser = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

// ============= Slot Game APIs =============

export const spinSlot = async (betAmount: number, themeId?: string) => {
  const response = await apiClient.post('/slot/spin', { betAmount, themeId });
  return response.data;
};

export const getThemes = async () => {
  const response = await apiClient.get('/admin/themes');
  return response.data;
};

export const selectTheme = async (themeId: string) => {
  const response = await apiClient.post('/slot/select-theme', { themeId });
  return response.data;
};

// ============= Wallet APIs =============

export const getWalletBalance = async () => {
  const response = await apiClient.get('/slot/balance');
  return response.data;
};

// ============= Achievements APIs =============

export const getUserAchievements = async () => {
  const response = await apiClient.get('/gamification/achievements');
  return response.data;
};

// ============= Leaderboard APIs =============

export const getLeaderboard = async (type: string = 'TOTAL_WAGERED', period: string = 'ALL_TIME') => {
  const response = await apiClient.get(`/gamification/leaderboard/${type}/${period}`);
  return response.data;
};

export default apiClient;