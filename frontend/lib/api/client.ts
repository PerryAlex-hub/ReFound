'use client';

import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://refound-api-doip.onrender.com/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

let slowToastShown = false;
let slowTimer: ReturnType<typeof setTimeout> | null = null;

function showSlowToast() {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent('rf:toast', {
    detail: { message: 'Waking up the server, please wait…', type: 'info', duration: 15000 },
  });
  window.dispatchEvent(event);
}

function dismissSlowToast() {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent('rf:toast:dismiss-slow');
  window.dispatchEvent(event);
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('rf_access') : null;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  if (!slowToastShown) {
    slowTimer = setTimeout(() => {
      showSlowToast();
      slowToastShown = true;
    }, 8000);
  }

  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => {
    if (slowTimer) { clearTimeout(slowTimer); slowTimer = null; }
    if (slowToastShown) { dismissSlowToast(); slowToastShown = false; }
    return response;
  },
  async (error: AxiosError) => {
    if (slowTimer) { clearTimeout(slowTimer); slowTimer = null; }
    if (slowToastShown) { dismissSlowToast(); slowToastShown = false; }

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${token}` };
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('rf_refresh') : null;
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data;

        localStorage.setItem('rf_access', accessToken);
        localStorage.setItem('rf_refresh', newRefresh);

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${accessToken}` };

        processQueue(null, accessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('rf_access');
        localStorage.removeItem('rf_refresh');
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
