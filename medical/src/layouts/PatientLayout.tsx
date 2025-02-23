import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
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

const PatientLayout = () => {
  const location = useLocation();
  
  const navigationItems = [
    { icon: Layout, label: 'Dashboard', path: '/p/dashboard' },
    { icon: Calendar, label: 'Appointments', path: '/p/appointments' },
    { icon: FileText, label: 'Medical Records', path: '/p/records' },
    { icon: Pill, label: 'Prescriptions', path: '/p/prescriptions' },
    { icon: CreditCard, label: 'Payments', path: '/p/payments' },
  ];

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
            Profile
          </Link>
          <button
            onClick={() => {/* Add logout logic */}}
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
        <header className="h-16 border-b border-white/10 bg-slate-900/50 backdrop-blur-lg px-8 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
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

export default PatientLayout;