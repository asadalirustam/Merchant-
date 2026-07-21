import axios from 'axios';
import { API_URL } from './urlHelper';

const API = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach access token if present
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle automatic token refreshing on 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't retried yet
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem('refreshToken')
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        // Request token refresh from backend
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        if (data.success) {
          // Update tokens in local storage
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);

          // Update headers in the original request and retry
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return API(originalRequest);
        }
      } catch (refreshError) {
        console.error('Refresh token failed, logging out...', refreshError);
        // Clear tokens and force reload to login page
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
      }
    }

    return Promise.reject(error);
  }
);

export default API;
