import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, NavLink } from 'react-router-dom';
import { 
  Hospital, 
  Calendar, 
  FileText, 
  Users, 
  MessageSquare, 
  Bell, 
  User,
  LogOut,
  Clock,
  Home,
  X,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/api';

interface NotificationType {
  id: number;
  patient_name: string;
  date: string;
  time: string;
  type: string;
}

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const DoctorLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  
  const navigationItems: NavigationItem[] = [
    { path: '/d/dashboard', label: 'Dashboard', icon: Home },
    { path: '/d/appointments', label: 'Appointments', icon: Calendar },
    { path: '/d/patients', label: 'Patients', icon: Users },
    { path: '/d/medical-records', label: 'Medical Records', icon: FileText },
    { path: '/d/schedule', label: 'My Schedule', icon: Clock },
  ];

  // Fetch pending appointment notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        const endDate = futureDate.toISOString().split('T')[0];
        
        const appointmentsData = await appointmentService.getAppointments({
          userId: user.id,
          userType: 'doctor',
          startDate: today,
          endDate: endDate
        });
        
        // Find scheduled (pending) appointments
        const pendingAppointments = appointmentsData
          .filter((appt: { status: string }) => appt.status.toLowerCase() === 'scheduled')
          .map((appt: { 
            id: number;
            patient_name?: string;
            date: string;
            time: string;
            type?: string;
          }) => ({
            id: appt.id,
            patient_name: appt.patient_name || 'Patient',
            date: appt.date,
            time: appt.time.substring(0, 5),
            type: appt.type || 'Consultation'
          }))
          .slice(0, 5); // Limit to 5 most recent
        
        setNotifications(pendingAppointments);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [user?.id]);

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

  const handleApproveAppointment = async (id: number): Promise<void> => {
    try {
      await appointmentService.updateAppointmentStatus(id, 'confirmed');
      setNotifications(notifications.filter(notif => notif.id !== id));
    } catch (error) {
      console.error('Error approving appointment:', error);
    }
  };

  const handleRejectAppointment = async (id: number): Promise<void> => {
    try {
      await appointmentService.updateAppointmentStatus(id, 'rejected');
      setNotifications(notifications.filter(notif => notif.id !== id));
    } catch (error) {
      console.error('Error rejecting appointment:', error);
    }
  };

  const formatDisplayDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
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
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <Link
            to="/d/profile"
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
          <h1 className="text-xl font-semibold">Doctor Portal</h1>
          <div className="flex items-center space-x-4">
            {/* Notifications dropdown */}
            <div className="relative" ref={notificationRef}>
              <button 
                className="p-2 text-gray-400 hover:text-white transition-colors relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              {/* Dropdown content - fix z-index and max height */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
                  <div className="p-3 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-medium text-white">Appointment Requests</h3>
                    <button 
                      className="text-gray-400 hover:text-white"
                      onClick={() => setShowNotifications(false)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {loading ? (
                    <div className="p-4 text-center text-white/60">
                      Loading notifications...
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className="p-3 border-b border-white/10 hover:bg-slate-700/30"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-white/90">{notification.patient_name}</h4>
                              <p className="text-sm text-white/60">{notification.type}</p>
                              <div className="text-xs text-white/60 mt-1">
                                {formatDisplayDate(notification.date)} at {notification.time}
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <button 
                                className="p-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                                onClick={() => handleApproveAppointment(notification.id)}
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                                onClick={() => handleRejectAppointment(notification.id)}
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-white/60">
                      No pending appointment requests
                    </div>
                  )}
                  
                  <div className="p-2 border-t border-white/10">
                    <button 
                      className="w-full text-sm text-blue-400 hover:text-blue-300 p-2"
                      onClick={() => {
                        navigate('/d/appointments?filter=pending_approval');
                        setShowNotifications(false);
                      }}
                    >
                      View all appointment requests
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <MessageSquare className="w-5 h-5" />
            </button>
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

export default DoctorLayout;