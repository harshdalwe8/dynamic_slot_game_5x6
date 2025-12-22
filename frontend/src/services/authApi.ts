import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance for auth (no interceptors to avoid circular issues)
const authApi = axios.create({
  baseURL: API_BASE_URL,
});

// ============= AUTHENTICATION =============

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  referralCode?: string;
  offerCode?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    role: 'PLAYER' | 'SUPER_ADMIN' | 'GAME_MANAGER' | 'SUPPORT_STAFF';
    status: string;
    referralCode?: string;
  };
  accessToken: string;
  refreshToken: string;
  referralStatus?: {
    provided: boolean;
    valid: boolean;
    appliedBonus: boolean;
    message?: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'PLAYER' | 'SUPER_ADMIN' | 'GAME_MANAGER' | 'SUPPORT_STAFF';
  status: string;
  createdAt: string;
  lastLogin: string;
  referralCode?: string;
}

export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
  referralCode?: string,
  offerCode?: string
): Promise<AuthResponse> => {
  const response = await authApi.post('/auth/register', {
    email,
    password,
    displayName,
    ...(referralCode ? { referralCode } : {}),
    ...(offerCode ? { offerCode } : {}),
  });
  return response.data;
};

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await authApi.post('/auth/login', {
    email,
    password,
  });
  return response.data;
};

export const refreshAccessToken = async (refreshToken: string): Promise<RefreshTokenResponse> => {
  const response = await authApi.post('/auth/refresh', { refreshToken });
  return response.data;
};

export const logoutUser = async (accessToken: string): Promise<{ message: string }> => {
  const response = await authApi.post(
    '/auth/logout',
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
};

export const regenerateReferralCode = async (accessToken: string): Promise<{ referralCode: string }> => {
  const response = await authApi.post(
    '/auth/referral/regenerate',
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
};

export const getUserProfile = async (accessToken: string): Promise<UserProfile> => {
  const response = await authApi.get('/auth/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export default authApi;
