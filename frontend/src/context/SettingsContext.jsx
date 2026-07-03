import { createContext, useState, useEffect } from 'react';
import API from '../utils/api';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    shopName: 'Enterprise Merchant ERP',
    logo: '',
    address: '123 Enterprise Way, Suite 100',
    phone: '+1 (555) 019-2834',
    email: 'info@enterprisemerchant.com',
    currency: 'USD',
    taxPercentage: 0,
    invoiceFooter: 'Thank you for your business!',
    theme: 'dark',
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data } = await API.get('/settings');
      if (data.success && data.data) {
        setSettings(data.data);
        // Apply default theme classes to body tag
        if (data.data.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (formData) => {
    try {
      const token = localStorage.getItem('accessToken');
      // Use standard multipart/form-data for image file upload
      const { data } = await API.put('/settings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.success && data.data) {
        setSettings(data.data);
        if (data.data.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update shop settings.',
      };
    }
  };

  const getCurrencySymbol = () => {
    switch (settings.currency) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'PKR':
        return 'Rs';
      case 'INR':
        return '₹';
      default:
        return settings.currency;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings, loading, fetchSettings, updateSettings, getCurrencySymbol }}>
      {children}
    </SettingsContext.Provider>
  );
};
