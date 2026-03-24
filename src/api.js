import axios from 'axios';

// Environment-aware backend URL
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
