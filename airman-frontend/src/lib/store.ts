'use client';
import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
  },

  setUser: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user });
  },

  setLoading: (isLoading) => set({ isLoading }),

  hydrate: () => {
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const userStr = localStorage.getItem('user');

      if (accessToken && userStr) {
        try {
          const user = JSON.parse(userStr) as User;
          set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
          return;
        } catch { /* ignore */ }
      }
    }
    set({ isLoading: false });
  },
}));

// Helper to get display name regardless of case convention
export const getUserDisplayName = (user: User | null) => {
  if (!user) return '';
  return user.firstName || user.first_name || user.email?.split('@')[0] || '';
};

export const getUserFullName = (user: User | null) => {
  if (!user) return '';
  const first = user.firstName || user.first_name || '';
  const last = user.lastName || user.last_name || '';
  return `${first} ${last}`.trim() || user.email || '';
};

export const isApproved = (user: User | null) => {
  if (!user) return false;
  return user.isApproved ?? user.is_approved ?? false;
};
