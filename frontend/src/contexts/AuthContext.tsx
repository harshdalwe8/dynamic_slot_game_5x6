import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, refreshAccessToken } from '../services/api';

interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isGuest?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load tokens from localStorage on mount
  useEffect(() => {
    const loadStoredAuth = () => {
      const storedAccessToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('user');

      if (storedAccessToken && storedRefreshToken && storedUser) {
        setAuthState({
          accessToken: storedAccessToken,
          refreshToken: storedRefreshToken,
          user: JSON.parse(storedUser),
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadStoredAuth();
  }, []);

  // Auto-refresh token before expiry (every 13 minutes, access token expires in 15 minutes)
  useEffect(() => {
    if (!authState.refreshToken) return;

    const interval = setInterval(async () => {
      await refreshAuth();
    }, 13 * 60 * 1000); // 13 minutes

    return () => clearInterval(interval);
  }, [authState.refreshToken]);

  const login = async (email: string, password: string) => {
    try {
      const response = await loginUser(email, password);
      const { accessToken, refreshToken, user } = response;

      // Store tokens and user
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      setAuthState({
        accessToken,
        refreshToken,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const response = await registerUser(email, password, displayName);
      const { accessToken, refreshToken, user } = response;

      // Store tokens and user
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      setAuthState({
        accessToken,
        refreshToken,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const loginAsGuest = async () => {
    try {
      // Generate a unique guest identifier
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const guestEmail = `${guestId}@guest.local`;
      const guestPassword = Math.random().toString(36).substr(2, 15);
      const guestDisplayName = `Guest${Math.floor(Math.random() * 10000)}`;

      // Register guest account
      const response = await registerUser(guestEmail, guestPassword, guestDisplayName);
      const { accessToken, refreshToken, user } = response;

      // Mark as guest user (don't persist to localStorage for guests)
      const guestUser = { ...user, isGuest: true };

      setAuthState({
        accessToken,
        refreshToken,
        user: guestUser,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Guest login failed');
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // Reset state
    setAuthState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const refreshAuth = async () => {
    if (!authState.refreshToken) return;

    try {
      const response = await refreshAccessToken(authState.refreshToken);
      const { accessToken } = response;

      // Update access token
      localStorage.setItem('accessToken', accessToken);

      setAuthState((prev) => ({
        ...prev,
        accessToken,
      }));
    } catch (error) {
      // Refresh failed, logout user
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        loginAsGuest,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
