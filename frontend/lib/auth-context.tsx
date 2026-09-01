'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { UserResponse } from './types';
import { getMe, login as apiLogin, logout as apiLogout, register as apiRegister } from './api/auth';
import { apiClient } from './api/client';

interface AuthContextValue {
  user: UserResponse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: {
    fullName: string;
    matricNumber: string;
    email: string;
    phoneNumber: string;
    password: string;
  }) => Promise<void>;
  setUser: (user: UserResponse | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const token = localStorage.getItem('rf_access');
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const me = await getMe();
          if (!cancelled) setUser(me);
        } catch {
          localStorage.removeItem('rf_access');
          localStorage.removeItem('rf_refresh');
        }
      }
      if (!cancelled) setIsLoading(false);
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    localStorage.setItem('rf_access', data.accessToken);
    localStorage.setItem('rf_refresh', data.refreshToken);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('rf_refresh');
    try {
      if (refreshToken) await apiLogout(refreshToken);
    } catch { /* silent */ }
    localStorage.removeItem('rf_access');
    localStorage.removeItem('rf_refresh');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    // Hard redirect, not router.push — clears the SWR cache and any other
    // in-memory state a router-only navigation would leave stale after logout.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/login';
  }, []);

  const register = useCallback(async (data: {
    fullName: string;
    matricNumber: string;
    email: string;
    phoneNumber: string;
    password: string;
  }) => {
    const res = await apiRegister(data);
    localStorage.setItem('rf_access', res.accessToken);
    localStorage.setItem('rf_refresh', res.refreshToken);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${res.accessToken}`;
    setUser(res.user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
