// components/Notification.jsx
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle, AlertCircle, X, Info, Clock, User, MessageSquare, FileText, AlertTriangle } from 'lucide-react';

const Notification = ({
  show,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  position = 'top-center',
  // Ticket-specific props
  ticketId,
  priority,
  assignee,
  timestamp
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
      // Original types
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      // Ticket-specific types
      case 'ticket-created':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'ticket-assigned':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'ticket-status-updated':
        return 'bg-indigo-50 border-indigo-200 text-indigo-800';
      case 'ticket-resolved':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'ticket-closed':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      case 'ticket-reopened':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'ticket-priority-changed':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'ticket-commented':
        return 'bg-cyan-50 border-cyan-200 text-cyan-800';
      case 'ticket-overdue':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      // Original types
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      // Ticket-specific types
      case 'ticket-created':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'ticket-assigned':
        return <User className="w-5 h-5 text-purple-500" />;
      case 'ticket-status-updated':
        return <Info className="w-5 h-5 text-indigo-500" />;
      case 'ticket-resolved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ticket-closed':
        return <CheckCircle className="w-5 h-5 text-gray-500" />;
      case 'ticket-reopened':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'ticket-priority-changed':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'ticket-commented':
        return <MessageSquare className="w-5 h-5 text-cyan-500" />;
      case 'ticket-overdue':
        return <Clock className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityBadge = () => {
    if (!priority) return null;
    
    const priorityColors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
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
        return 'top-4 left-1/2 transform -translate-x-1/2';
    }
  };

  const isTicketNotification = type.startsWith('ticket-');

  return (
    <div className={`fixed z-[60] w-full px-4 sm:px-6 md:px-0 ${getPositionStyle()}`}>
      <div className={`mx-auto w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out ${getNotificationStyle()}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            {isTicketNotification ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold">{title}</p>
                  {getPriorityBadge()}
                </div>
                {ticketId && (
                  <p className="text-xs text-gray-600 mb-2">Ticket #{ticketId}</p>
                )}
                <p className="text-sm opacity-90 mb-2">{message}</p>
                {(assignee || timestamp) && (
                  <div className="flex items-center justify-between text-xs opacity-70">
                    {assignee && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {assignee}
                      </span>
                    )}
                    {timestamp && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timestamp}
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-sm opacity-90">{message}</p>
              </>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
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
  type: PropTypes.oneOf([
    // Original types
    'success', 
    'error', 
    'warning', 
    'info',
    // Ticket-specific types
    'ticket-created',
    'ticket-assigned',
    'ticket-status-updated',
    'ticket-resolved',
    'ticket-closed',
    'ticket-reopened',
    'ticket-priority-changed',
    'ticket-commented',
    'ticket-overdue'
  ]).isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  duration: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  position: PropTypes.oneOf([
    'top-right',
    'top-left',
    'bottom-right',
    'bottom-left',
    'top-center'
  ]),
  // Ticket-specific props
  ticketId: PropTypes.string,
  priority: PropTypes.oneOf(['low', 'medium', 'high', 'urgent']),
  assignee: PropTypes.string,
  timestamp: PropTypes.string
};

export default Notification;