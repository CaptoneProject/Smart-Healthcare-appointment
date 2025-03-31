import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  FileText, 
  Eye, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Clock as ClockIcon
} from 'lucide-react';
import { notificationService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type: string;
  metadata?: {
    recordId?: number;
    doctorId?: number;
    patientId?: number;
    appointmentId?: number;
  };
}

export const NotificationTypes = {
  APPOINTMENT_SCHEDULED: 'APPOINTMENT_SCHEDULED',
  APPOINTMENT_CONFIRMED: 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
  MEDICAL_RECORD_UPLOADED: 'MEDICAL_RECORD_UPLOADED',
  MEDICAL_RECORD_ACCESSED: 'MEDICAL_RECORD_ACCESSED'
} as const;

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MEDICAL_RECORD_UPLOADED':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'MEDICAL_RECORD_ACCESSED':
        return <Eye className="w-4 h-4 text-green-400" />;
      case 'APPOINTMENT_SCHEDULED':
        return <Calendar className="w-4 h-4 text-yellow-400" />;
      case 'APPOINTMENT_CONFIRMED':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'APPOINTMENT_CANCELLED':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'APPOINTMENT_RESCHEDULED':
        return <ClockIcon className="w-4 h-4 text-orange-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) {
        console.log('No user ID available');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await notificationService.getNotifications(user.id);
        console.log('Received notifications:', data);
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setError('Failed to load notifications');
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
    // Refresh every 15 seconds instead of 30
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Add this to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      const promises = notifications
        .filter(n => !n.is_read)
        .map(n => notificationService.markAsRead(n.id));
      
      await Promise.all(promises);
      
      setNotifications(notifications.map(notif => ({
        ...notif,
        is_read: true
      })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-white/10 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-white/10">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  className="text-xs text-blue-400 hover:text-blue-300"
                  onClick={handleMarkAllAsRead}
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-white/60">Loading...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-400">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-white/60">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 border-b border-white/10 hover:bg-white/5 
                    ${!notification.is_read ? 'bg-blue-500/10' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <p className="text-sm text-white/90 mb-1">{notification.title}</p>
                      <p className="text-sm text-white/60">{notification.message}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-white/40">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        {!notification.is_read && (
                          <button 
                            className="text-xs text-blue-400 hover:text-blue-300"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};