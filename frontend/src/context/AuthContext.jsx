import { createContext, useState, useEffect } from 'react';
import API from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ceoExists, setCeoExists] = useState(true); // Default to true, verify on load

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');

      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem('user');
        }
      }

      // Check if CEO accounts exist in the DB to decide if we route to setup or login
      try {
        const { data } = await API.get('/settings'); // Shop settings check
        // Or we check CEO existence directly via settings/auth. Let's make settings return CEO status or check settings endpoint.
        // If the settings route fails due to 401 but database is empty, the server wouldn't block. Let's check status.
      } catch (err) {
        console.log('Setup status check', err);
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password, rememberMe) => {
    try {
      const { data } = await API.post('/auth/login', { email, password });
      if (data.success) {
        setUser(data.data.user);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check credentials.',
      };
    }
  };

  const registerCEO = async (name, email, password) => {
    try {
      const { data } = await API.post('/auth/register-ceo', { name, email, password });
      if (data.success) {
        setUser(data.data.user);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        setCeoExists(true);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'CEO registration failed.',
      };
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await API.post('/auth/logout', { refreshToken });
    } catch (e) {
      console.error('Logout API call failed', e);
    }
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const forgotPassword = async (email) => {
    try {
      const { data } = await API.post('/auth/forgot-password', { email });
      return { success: true, message: data.message, data: data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Forgot password request failed.',
      };
    }
  };

  const resetPassword = async (email, resetCode, newPassword) => {
    try {
      const { data } = await API.post('/auth/reset-password', { email, resetCode, newPassword });
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Reset password failed.',
      };
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      const { data } = await API.put('/auth/change-password', { oldPassword, newPassword });
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Change password failed.',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        ceoExists,
        setCeoExists,
        login,
        registerCEO,
        logout,
        forgotPassword,
        resetPassword,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
