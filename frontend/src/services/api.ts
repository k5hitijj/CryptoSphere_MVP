import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000/api/v1' : '/api/v1');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enables sending/receiving HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token from localStorage if cookie fallback is needed
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto-redirect or handle auth expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local states
      localStorage.removeItem('access_token');
      // If we are not on the login page already, redirect
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
