import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Hospital, 
  Calendar, 
  FileText, 
  User,
  LogOut,
  Clock,
  Home,
  Menu,
  CreditCard,
  MessageCircle,
  Pill,
  FilePlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from '../components/ui/NotificationBell';
import { useState } from 'react';

const DoctorLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const navigationItems = [
    { path: '/d/dashboard', label: 'Dashboard', icon: Home },
    { path: '/d/appointments', label: 'Appointments', icon: Calendar },
    { path: '/d/schedule', label: 'My Schedule', icon: Clock },
    { path: '/d/records', label: 'Medical Records', icon: FileText },
    { path: '/d/invoices', label: 'Invoices', icon: CreditCard },
    { path: '/d/messages', label: 'Messages', icon: MessageCircle },
    { 
      icon: Pill, 
      label: 'Prescriptions', 
      path: '/d/prescriptions',
      isActive: currentPath === '/d/prescriptions' || currentPath.startsWith('/d/prescriptions/refills')
    },
    { 
      icon: FilePlus, 
      label: 'Create Prescription', 
      path: '/d/prescriptions/create',
      isActive: currentPath === '/d/prescriptions/create'
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-white/10">
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
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  item.isActive
                    ? 'bg-blue-600/30 text-blue-100'
                    : 'text-white/70 hover:bg-white/10 hover:text-white/90'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </Link>
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
        <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Menu
              className="w-6 h-6 text-white/70 cursor-pointer block lg:hidden" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
            <h1 className="text-xl font-semibold text-white/90">SmartCare</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationBell />
            {/* Any other header elements */}
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