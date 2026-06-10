import axios, { type InternalAxiosRequestConfig } from 'axios';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface RefreshResult {
  accessToken: string;
  refreshToken?: string;
}

let refreshPromise: Promise<RefreshResult> | null = null;

const client = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalConfig = error.config as RetryableRequestConfig | undefined;
    const isAuthEndpoint = originalConfig?.url?.includes('/auth/');
    const refreshToken = localStorage.getItem('refreshToken');

    if (
      error.response?.status === 401 &&
      refreshToken &&
      originalConfig &&
      !originalConfig._retry &&
      !isAuthEndpoint
    ) {
      originalConfig._retry = true;

      try {
        refreshPromise ??= axios
          .post<RefreshResult>('/api/auth/refresh', { refreshToken })
          .then((res) => {
            if (!res.data?.accessToken) {
              throw new Error('Invalid refresh response');
            }
            return res.data;
          })
          .finally(() => {
            refreshPromise = null;
          });

        const { accessToken, refreshToken: nextRefreshToken } = await refreshPromise;
        localStorage.setItem('accessToken', accessToken);
        if (nextRefreshToken) {
          localStorage.setItem('refreshToken', nextRefreshToken);
        }
        originalConfig.headers.Authorization = `Bearer ${accessToken}`;
        return client.request(originalConfig);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.clear();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default client;
