// hooks/useNotification.js
import { useState, useCallback } from 'react';

export const useNotification = () => {
  const [notification, setNotification] = useState({
    show: false,
    type: 'info',
    title: '',
    message: '',
    duration: 5000,
    position: 'top-right'
  });

  const showNotification = useCallback((type, title, message, options = {}) => {
    setNotification({
      show: true,
      type,
      title,
      message,
      duration: options.duration || 5000,
      position: options.position || 'top-right'
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, []);

  // Convenience methods
  const showSuccess = useCallback((title, message, options) => {
    showNotification('success', title, message, options);
  }, [showNotification]);

  const showError = useCallback((title, message, options) => {
    showNotification('error', title, message, options);
  }, [showNotification]);

  const showWarning = useCallback((title, message, options) => {
    showNotification('warning', title, message, options);
  }, [showNotification]);

  const showInfo = useCallback((title, message, options) => {
    showNotification('info', title, message, options);
  }, [showNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};