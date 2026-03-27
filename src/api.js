import axios from 'axios';

// Environment-aware backend URL
// Safest fallback is window.location.origin to ensure mobile hits the same domain
export const BASE_URL = import.meta.env.VITE_API_URL || 
                        import.meta.env.REACT_APP_API_URL ||
                        (typeof process !== 'undefined' && process.env.REACT_APP_API_URL) ||
                        ''; // Use relative URL as fallback for both environments

const API = axios.create({ 
  baseURL: `${BASE_URL}/api` 
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
