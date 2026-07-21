/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Toast notifier helper
  const addToast = (title, message, type = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const addNotification = (notif) => {
    setNotifications((prev) => [notif, ...prev].slice(0, 100)); // Limit to last 100 entries
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  useEffect(() => {
    // Establish connection to socket server
    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('notification', (data) => {
      console.log('Real-time notification received:', data);
      
      // Add to persistent registry list
      addNotification(data);

      // Trigger a visual toast alert
      let toastType = 'info';
      if (data.type === 'LOW_STOCK') toastType = 'warning';
      if (data.type === 'OUT_OF_STOCK') toastType = 'error';
      if (data.type === 'SALE_COMPLETED') toastType = 'success';
      if (data.type === 'PRICE_UPDATED') toastType = 'info';
      if (data.type === 'PRODUCT_ADD') toastType = 'success';

      addToast(data.title, data.message, toastType);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        notifications,
        addToast,
        removeToast,
        addNotification,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
