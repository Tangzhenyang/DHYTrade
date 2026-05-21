import axios from 'axios';

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
    if (error.response?.status === 401 && localStorage.getItem('refreshToken')) {
      try {
        const res = await axios.post('/api/auth/refresh', {
          refreshToken: localStorage.getItem('refreshToken'),
        });
        if (res.data?.accessToken) {
          const { accessToken, refreshToken } = res.data;
          localStorage.setItem('accessToken', accessToken);
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return client.request(error.config);
        }
        // Refresh endpoint didn't return valid tokens
        throw new Error('Invalid refresh response');
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    // Don't reject 401 on login/register/refresh endpoints (prevent loop)
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      if (isAuthEndpoint) return Promise.reject(error);
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
