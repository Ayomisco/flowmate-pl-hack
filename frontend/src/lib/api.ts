import axios from 'axios';
import { getMagic } from './magic';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  // Skip if Authorization was explicitly set (e.g. Magic DID token during login)
  if (config.headers.Authorization) return config;
  const token = localStorage.getItem('flowmate_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Redirect to login on 401 (unauthorized) or 404 user not found
    if (err.response?.status === 401 || (err.response?.status === 404 && err.config?.url?.includes('/users/me'))) {
      // Clear localStorage
      localStorage.removeItem('flowmate_token');
      localStorage.removeItem('flowmate_user');

      // Also clear Magic session
      try {
        getMagic().user.logout().catch(() => {});
      } catch {
        // Ignore errors
      }

      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
