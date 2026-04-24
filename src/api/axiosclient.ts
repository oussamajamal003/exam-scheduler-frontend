import axios from 'axios';

export const axiosClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const expiresAt = localStorage.getItem('token_expires_at');

    // Client-side expiry check — redirect to login before even sending the request
    if (token && expiresAt && Date.now() > Number(expiresAt)) {
      localStorage.removeItem('token');
      localStorage.removeItem('token_expires_at');
      window.location.href = '/login';
      return Promise.reject(new Error('Session expired'));
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    // Server may use either `error` or `message` field for error text
    const errorText =
      (typeof data?.error === 'string' ? data.error : '') ||
      (typeof data?.message === 'string' ? data.message : '');
    const invalidToken = status === 403 && /token/i.test(errorText);

    if (status === 401 || invalidToken) {
      localStorage.removeItem('token');
      localStorage.removeItem('token_expires_at');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
