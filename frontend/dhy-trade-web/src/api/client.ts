import axios, { type InternalAxiosRequestConfig } from 'axios';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

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
        const res = await axios.post('/api/auth/refresh', {
          refreshToken,
        });
        if (res.data?.accessToken) {
          const { accessToken, refreshToken } = res.data;
          localStorage.setItem('accessToken', accessToken);
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
          originalConfig.headers.Authorization = `Bearer ${accessToken}`;
          return client.request(originalConfig);
        }
        // Refresh endpoint didn't return valid tokens
        throw new Error('Invalid refresh response');
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
