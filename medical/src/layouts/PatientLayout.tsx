import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { 
  Hospital, 
  Layout, 
  Calendar, 
  FileText, 
  Pill, 
  CreditCard, 
  Bell, 
  User,
  LogOut 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavigationItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface NotificationType {
  id: number;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
}

const PatientLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([
    {
      id: 1,
      title: "Appointment Reminder",
      message: "You have an appointment tomorrow at 10:00 AM",
      date: "2025-03-22",
      isRead: false
    },
    {
      id: 2,
      title: "Prescription Refill",
      message: "Your prescription is ready for pickup",
      date: "2025-03-21",
      isRead: true
    }
  ]);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  
  const navigationItems: NavigationItem[] = [
    { icon: Layout, label: 'Dashboard', path: '/p/dashboard' },
    { icon: Calendar, label: 'Appointments', path: '/p/appointments' },
    { icon: FileText, label: 'Medical Records', path: '/p/records' },
    { icon: Pill, label: 'Prescriptions', path: '/p/prescriptions' },
    { icon: CreditCard, label: 'Payments', path: '/p/payments' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUnreadCount = (): number => {
    return notifications.filter(notification => !notification.isRead).length;
  };

  const markAsRead = (id: number): void => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-white/10 z-20">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center">
            <Hospital className="w-8 h-8 text-blue-500" />
            <span className="ml-2 text-xl font-semibold text-white">SmartCare</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <Link
            to="/p/profile"
            className="flex items-center px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <User className="w-5 h-5 mr-3" />
            {user ? user.name : 'Profile'}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen bg-slate-950 text-white">
        {/* Top Bar */}
        <header className="h-16 border-b border-white/10 bg-slate-900/50 backdrop-blur-lg px-8 flex items-center justify-between z-10 sticky top-0">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center space-x-4">
            {/* Notifications dropdown */}
            <div className="relative" ref={notificationRef}>
              <button 
                className="p-2 text-gray-400 hover:text-white transition-colors relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5" />
                {getUnreadCount() > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                    {getUnreadCount()}
                  </span>
                )}
              </button>
              
              {/* Dropdown content */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
                  <div className="p-3 border-b border-white/10">
                    <h3 className="font-medium text-white">Notifications</h3>
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`p-3 border-b border-white/10 hover:bg-slate-700/30 ${
                            !notification.isRead ? 'bg-blue-500/5' : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <h4 className="font-medium text-white/90">{notification.title}</h4>
                          <p className="text-sm text-white/60 mt-1">{notification.message}</p>
                          {!notification.isRead && (
                            <span className="inline-block mt-2 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                              New
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-white/60">
                        No notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PatientLayout;