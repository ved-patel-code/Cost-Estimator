import axios from 'axios';

// Access the ENV variable defined in docker-compose
const API_URL = "/api"

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Request Interceptor: Attach Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Handle 401 (Expired Token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if error is 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      // Don't redirect if we are already on the login page to avoid loops
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;