import axios from 'axios';

// Get API URL from environment variable
// In development: if VITE_API_URL is not set, use '/api' which will be proxied by Vite
// In production: VITE_API_URL should be set to the full backend URL (e.g., https://api.yourdomain.com/api)
const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If VITE_API_URL is explicitly set, use it
  if (envUrl) {
    return envUrl;
  }
  
  // In development, use relative path to leverage Vite proxy
  // In production build, this will need VITE_API_URL to be set
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // Fallback for production if VITE_API_URL is not set
  console.warn('VITE_API_URL is not set. Using default localhost URL. This may not work in production.');
  return 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

