// components/Notification.jsx
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const Notification = ({
  show,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  position = 'top-right'
}) => {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  const getNotificationStyle = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPositionStyle = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div className={`fixed z-[60] max-w-sm ${getPositionStyle()}`}>
      <div className={`rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out ${getNotificationStyle()}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">
              {title}
            </p>
            <p className="mt-1 text-sm opacity-90">
              {message}
            </p>
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              className="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-75 transition-opacity"
              onClick={onClose}
              aria-label="Close notification"
            >
              <X className="h-4 w-4 opacity-60 hover:opacity-100" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

Notification.propTypes = {
  show: PropTypes.bool.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']).isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  duration: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  position: PropTypes.oneOf(['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center'])
};

export default Notification;