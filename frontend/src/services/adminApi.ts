import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth interceptor
const adminApi = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add token
adminApi.interceptors.request.use(
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
adminApi.interceptors.response.use(
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
          return adminApi(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/admin/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

// ============= THEME MANAGEMENT =============

export interface Theme {
  id: string;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'DISABLED';
  version: number;
  jsonSchema?: any;
  configuration?: any;
  minBet: number;
  maxBet: number;
  createdAt: string;
  updatedAt: string;
  assetManifest?: Record<string, any>;
}

export interface CreateThemeRequest {
  name: string;
  themeId?: string;
  configuration: any;
  minBet?: number;
  maxBet?: number;
  assetManifest?: Record<string, string>; // optional metadata
}

export interface UpdateThemeRequest extends CreateThemeRequest {}

// Upload theme UI assets (Balance, BKG, buttons, reels, etc.)
export const uploadThemeAssets = async (
  themeId: string,
  assets: Record<string, File | null>
) => {
  const formData = new FormData();
  Object.entries(assets).forEach(([key, file]) => {
    if (file) formData.append('assets', file, `${key}.png`);
  });

  return adminApi.post(`/admin/upload/theme-assets/${themeId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Upload theme symbols with filenames derived from SymbolID
export const uploadThemeSymbols = async (
  themeId: string,
  symbols: Record<string, File | null>
) => {
  const formData = new FormData();
  Object.entries(symbols).forEach(([symbolId, file]) => {
    if (file) formData.append('symbols', file, `${symbolId}.png`);
  });

  return adminApi.post(`/admin/upload/theme-symbols/${themeId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getAllThemes = async (status?: 'DRAFT' | 'ACTIVE' | 'DISABLED') => {
  const params = status ? { status } : {};
  const response = await adminApi.get('/admin/themes', { params });
  return response.data;
};

export const getThemeDetails = async (themeId: string) => {
  const response = await adminApi.get(`/admin/themes/${themeId}`);
  return response.data;
};

export const createTheme = async (themeData: CreateThemeRequest) => {
  const response = await adminApi.post('/admin/themes', themeData);
  return response.data;
};

export const updateTheme = async (themeId: string, themeData: UpdateThemeRequest) => {
  const response = await adminApi.put(`/admin/themes/${themeId}`, themeData);
  return response.data;
};

export const activateTheme = async (themeId: string) => {
  const response = await adminApi.post(`/admin/themes/${themeId}/activate`);
  return response.data;
};

export const deactivateTheme = async (themeId: string) => {
  const response = await adminApi.post(`/admin/themes/${themeId}/deactivate`);
  return response.data;
};

export const rollbackTheme = async (themeId: string, targetVersion: number) => {
  const response = await adminApi.post(`/admin/themes/${themeId}/rollback`, { targetVersion });
  return response.data;
};

export const deleteTheme = async (themeId: string) => {
  const response = await adminApi.delete(`/admin/themes/${themeId}`);
  return response.data;
};

// ============= FILE UPLOAD =============

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await adminApi.post('/admin/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const listAllAssets = async () => {
  const response = await adminApi.get('/admin/upload/assets');
  return response.data;
};

export const listThemeAssets = async (themeId: string) => {
  const response = await adminApi.get(`/admin/upload/theme-assets/${themeId}`);
  return response.data;
};

export const deleteAsset = async (filename: string) => {
  const response = await adminApi.delete(`/admin/upload/asset/${filename}`);
  return response.data;
};

// ============= REPORTS =============

export interface RTPReportParams {
  themeId?: string;
  startDate?: string;
  endDate?: string;
  period?: 'daily' | 'weekly' | 'monthly';
}

export interface SpinReportParams {
  userId?: string;
  themeId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface UserReportParams {
  limit?: number;
  offset?: number;
}

export interface TransactionReportParams {
  userId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export const getRTPReport = async (params: RTPReportParams) => {
  const response = await adminApi.get('/admin/reports/rtp', { params });
  return response.data;
};

// ============= OFFER CODES =============

export interface OfferCodeDto {
  id: string;
  code: string;
  amount: number;
  active: boolean;
  maxUsage?: number | null;
  usageCount: number;
  startsAt?: string;
  endsAt?: string | null;
  createdAt: string;
}

export interface CreateOfferCodeRequest {
  code: string;
  amount: number;
  startsAt?: string;
  endsAt?: string | null;
  maxUsage?: number;
  active?: boolean;
}

export const createOfferCode = async (payload: CreateOfferCodeRequest) => {
  const response = await adminApi.post('/admin/offer-codes', payload);
  return response.data as { offer: OfferCodeDto };
};

export const listOfferCodes = async () => {
  const response = await adminApi.get('/admin/offer-codes');
  return response.data as { offers: OfferCodeDto[] };
};

export const deactivateOfferCode = async (code: string) => {
  const response = await adminApi.post(`/admin/offer-codes/${code}/deactivate`);
  return response.data as { offer: OfferCodeDto };
};

export const activateOfferCode = async (code: string) => {
  const response = await adminApi.post(`/admin/offer-codes/${code}/activate`);
  return response.data as { offer: OfferCodeDto };
};

export const updateOfferCode = async (code: string, payload: Partial<CreateOfferCodeRequest>) => {
  const response = await adminApi.put(`/admin/offer-codes/${code}`, payload);
  return response.data as { offer: OfferCodeDto };
};

export const getAllThemesRTP = async () => {
  const response = await adminApi.get('/admin/reports/rtp/all');
  return response.data;
};

export const getThemeRTPHistory = async (themeId: string, limit: number = 100) => {
  const response = await adminApi.get(`/admin/reports/rtp/history/${themeId}`, {
    params: { limit },
  });
  return response.data;
};

export const getSpinLogsReport = async (params: SpinReportParams) => {
  const response = await adminApi.get('/admin/reports/spins', { params });
  return response.data;
};

export const getUserActivityReport = async (params: UserReportParams) => {
  const response = await adminApi.get('/admin/reports/users', { params });
  return response.data;
};

export const getTransactionReport = async (params: TransactionReportParams) => {
  const response = await adminApi.get('/admin/reports/transactions', { params });
  return response.data;
};

export const getThemePerformance = async (startDate?: string, endDate?: string) => {
  const params = { startDate, endDate };
  const response = await adminApi.get('/admin/reports/themes', { params });
  return response.data;
};

export const getAdminLogs = async (
  adminId?: string,
  action?: string,
  limit: number = 50,
  offset: number = 0
) => {
  const params = { adminId, action, limit, offset };
  const response = await adminApi.get('/admin/reports/admin-logs', { params });
  return response.data;
};

// ============= EXPORT =============

export const exportSpinsCSV = async (
  userId?: string,
  themeId?: string,
  startDate?: string,
  endDate?: string
) => {
  const params = { userId, themeId, startDate, endDate };
  const response = await adminApi.get('/admin/export/spins', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

export const exportTransactionsCSV = async (
  userId?: string,
  type?: string,
  startDate?: string,
  endDate?: string
) => {
  const params = { userId, type, startDate, endDate };
  const response = await adminApi.get('/admin/export/transactions', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

export const exportUsersCSV = async (
  role?: string,
  status?: string,
  startDate?: string,
  endDate?: string
) => {
  const params = { role, status, startDate, endDate };
  const response = await adminApi.get('/admin/export/users', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

export const exportRTPCSV = async (startDate?: string, endDate?: string) => {
  const params = { startDate, endDate };
  const response = await adminApi.get('/admin/export/rtp', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

export const exportAdminLogsCSV = async (
  adminId?: string,
  action?: string,
  startDate?: string,
  endDate?: string
) => {
  const params = { adminId, action, startDate, endDate };
  const response = await adminApi.get('/admin/export/admin-logs', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

// ============= GAMIFICATION ADMIN =============

export interface CreateAchievementRequest {
  code: string;
  name: string;
  description: string;
  icon: string;
  rewardAmount: number;
  requirementType: string;
  requirementValue: number;
  category: string;
}

export const getAchievementStats = async () => {
  const response = await adminApi.get('/gamification/admin/achievements/stats');
  return response.data;
};

export const createAchievement = async (data: CreateAchievementRequest) => {
  const response = await adminApi.post('/gamification/admin/achievements', data);
  return response.data;
};

export const deleteAchievement = async (id: string) => {
  const response = await adminApi.delete(`/gamification/admin/achievements/${id}`);
  return response.data;
};

export const generateLeaderboard = async (type: string, period: string) => {
  const response = await adminApi.post('/gamification/admin/leaderboards/generate', {
    type,
    period,
  });
  return response.data;
};

export const refreshLeaderboards = async () => {
  const response = await adminApi.post('/gamification/admin/leaderboards/refresh');
  return response.data;
};

// ============= SPIN AUDIT =============

export const auditSpin = async (spinId: string) => {
  const response = await adminApi.get(`/spin/audit/${spinId}`);
  return response.data;
};

// ============= USER MANAGEMENT =============

export interface UserListResponse {
  id: string;
  email: string;
  displayName: string;
  role: 'PLAYER' | 'SUPPORT_STAFF' | 'GAME_MANAGER' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'BANNED' | 'DISABLED';
  balance: number;
  createdAt: string;
  lastLogin: string;
}

export interface UserListParams {
  role?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const getAllUsers = async (params?: UserListParams) => {
  const response = await adminApi.get('/admin/users', { params });
  return response.data;
};

export const updateUserStatus = async (
  userId: string,
  status: 'ACTIVE' | 'BANNED' | 'DISABLED'
) => {
  const response = await adminApi.put(`/admin/users/${userId}/status`, { status });
  return response.data;
};

export const updateUserRole = async (
  userId: string,
  role: 'PLAYER' | 'SUPPORT_STAFF' | 'GAME_MANAGER' | 'SUPER_ADMIN'
) => {
  const response = await adminApi.put(`/admin/users/${userId}/role`, { role });
  return response.data;
};

export const updateUserBalance = async (userId: string, balance: number) => {
  const response = await adminApi.put(`/admin/users/${userId}/balance`, { balance });
  return response.data;
};

// ============= PAYMENT LINKS MANAGEMENT =============

export interface PaymentLink {
  id: string;
  name: string;
  payeeVPA: string;
  payeeName: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  _count?: {
    deposits: number;
  };
}

export interface CreatePaymentLinkRequest {
  name: string;
  payeeVPA: string;
  payeeName: string;
}

export const createPaymentLink = async (payload: CreatePaymentLinkRequest) => {
  const response = await adminApi.post('/admin/payment-links', payload);
  return response.data as { paymentLink: PaymentLink };
};

export const listPaymentLinks = async () => {
  const response = await adminApi.get('/admin/payment-links');
  return response.data as { paymentLinks: PaymentLink[] };
};

export const updatePaymentLink = async (id: string, payload: Partial<CreatePaymentLinkRequest>) => {
  const response = await adminApi.put(`/admin/payment-links/${id}`, payload);
  return response.data as { paymentLink: PaymentLink };
};

export const deletePaymentLink = async (id: string) => {
  const response = await adminApi.delete(`/admin/payment-links/${id}`);
  return response.data;
};

export const togglePaymentLink = async (id: string) => {
  const response = await adminApi.post(`/admin/payment-links/${id}/toggle`);
  return response.data as { paymentLink: PaymentLink };
};

// ============= DEPOSITS MANAGEMENT =============

export interface Deposit {
  id: string;
  userId: string;
  paymentLinkId: string;
  amount: number; // in cents
  transactionRef: string;
  screenshotUrl?: string;
  status: 'PENDING' | 'SCREENSHOT_UPLOADED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    displayName: string;
  };
  paymentLink?: {
    id: string;
    name: string;
    payeeVPA: string;
  };
}

export const listDeposits = async (status?: string, userId?: string, limit = 50, offset = 0) => {
  const params: any = { limit, offset };
  if (status) params.status = status;
  if (userId) params.userId = userId;

  const response = await adminApi.get('/admin/deposits', { params });
  return response.data as { deposits: Deposit[]; total: number; limit: number; offset: number };
};

export const approveDeposit = async (depositId: string) => {
  const response = await adminApi.put(`/admin/deposits/${depositId}/approve`);
  return response.data as { deposit: Deposit; message: string };
};

export const rejectDeposit = async (depositId: string, reason?: string) => {
  const response = await adminApi.put(`/admin/deposits/${depositId}/reject`, { reason });
  return response.data as { deposit: Deposit; message: string };
};

// Helper function to download CSV blob
export const downloadCSV = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default adminApi;
