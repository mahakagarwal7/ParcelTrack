import axios from 'axios';

// In production on Vercel, points to Render backend via VITE_API_URL
// Sanitizes so both 'https://...onrender.com' and 'https://...onrender.com/api' work smoothly
const rawUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';
const apiBase = rawUrl
  ? (rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`)
  : '/api';

const axiosClient = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('parceltrack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 unauthorized
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or unauthorized
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('parceltrack_token');
        localStorage.removeItem('parceltrack_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
