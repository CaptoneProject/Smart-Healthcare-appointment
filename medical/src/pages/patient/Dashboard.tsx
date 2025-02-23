import React from 'react';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Pill, 
  CreditCard,
  ArrowRight,
  LucideIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  footer?: string;
  link?: string;
  variant?: 'default' | 'success' | 'warning';
}

interface AppointmentCardProps {
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: 'Confirmed' | 'Pending';
}

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
}

interface Appointment {
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: 'Confirmed' | 'Pending';
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  icon: Icon, 
  title, 
  value, 
  footer, 
  link, 
}) => (
  <div className="relative overflow-hidden backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6 
    shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.15)] 
    transition-all duration-300 group">
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
    <div className="relative">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-400/10 backdrop-blur-sm">
              <Icon className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="ml-3 text-sm font-medium text-gray-300">{title}</h3>
          </div>
          <div className="mt-4 text-2xl font-semibold text-white/90">{value}</div>
        </div>
      </div>
      {footer && link && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <Link 
            to={link} 
            className="flex items-center text-sm text-blue-400 hover:text-blue-300 group-hover:translate-x-1 transition-all"
          >
            {footer}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      )}
    </div>
  </div>
);

const AppointmentCard: React.FC<AppointmentCardProps> = ({ doctor, specialty, date, time, status }) => (
  <div className="relative overflow-hidden backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6 
    shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.15)] 
    transition-all duration-300">
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
    <div className="relative">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-white/90">{doctor}</h3>
          <p className="text-sm text-gray-400">{specialty}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
          status === 'Confirmed' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/20' 
            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'
        }`}>
          {status}
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm text-gray-400">
        <div className="flex items-center bg-white/5 px-2 py-1 rounded-lg backdrop-blur-sm">
          <Calendar className="w-4 h-4 mr-2" />
          {date}
        </div>
        <div className="flex items-center bg-white/5 px-2 py-1 rounded-lg backdrop-blur-sm ml-4">
          <Clock className="w-4 h-4 mr-2" />
          {time}
        </div>
      </div>
    </div>
  </div>
);

const QuickActionCard: React.FC<QuickActionCardProps> = ({ icon: Icon, title, description, to }) => (
  <Link
    to={to}
    className="relative overflow-hidden backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6 
      shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.15)] 
      hover:bg-white/10 transition-all duration-300 group"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
    <div className="relative">
      <div className="p-3 rounded-lg bg-blue-400/10 backdrop-blur-sm w-fit group-hover:bg-blue-400/20 transition-colors">
        <Icon className="w-8 h-8 text-blue-400" />
      </div>
      <h3 className="font-medium mb-2 mt-4 text-white/90 group-hover:text-white transition-colors">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  </Link>
);

const PatientDashboard: React.FC = () => {
  const upcomingAppointments: Appointment[] = [
    {
      doctor: "Dr. Sarah Wilson",
      specialty: "General Physician",
      date: "Feb 24, 2025",
      time: "10:00 AM",
      status: "Confirmed"
    },
    {
      doctor: "Dr. Michael Chen",
      specialty: "Cardiologist",
      date: "Feb 26, 2025",
      time: "2:30 PM",
      status: "Pending"
    }
  ];

  return (
    <div className="space-y-8 relative">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Welcome Section */}
      <div className="relative backdrop-blur-sm p-6 rounded-2xl bg-white/5 border border-white/10">
        <h1 className="text-3xl font-bold text-white/90">Welcome back, John</h1>
        <p className="text-gray-400 mt-2">Here's an overview of your health management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        <DashboardCard
          icon={Calendar}
          title="Upcoming Appointments"
          value="2"
          footer="View all appointments"
          link="/p/appointments"
        />
        <DashboardCard
          icon={Pill}
          title="Active Prescriptions"
          value="3"
          footer="View prescriptions"
          link="/p/prescriptions"
        />
        <DashboardCard
          icon={FileText}
          title="Recent Documents"
          value="5"
          footer="View medical records"
          link="/p/records"
        />
        <DashboardCard
          icon={CreditCard}
          title="Payment Due"
          value="$150.00"
          footer="View payments"
          link="/p/payments"
        />
      </div>

      {/* Appointments Section */}
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white/90">Upcoming Appointments</h2>
          <Link 
            to="/p/appointments" 
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center px-4 py-2 rounded-lg 
              bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all"
          >
            View all
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcomingAppointments.map((appointment, index) => (
            <AppointmentCard key={index} {...appointment} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="relative">
        <h2 className="text-xl font-semibold mb-6 text-white/90">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickActionCard
            icon={Calendar}
            title="Schedule Appointment"
            description="Book a new appointment with a doctor"
            to="/p/appointments/new"
          />
          <QuickActionCard
            icon={Pill}
            title="Request Refill"
            description="Request a prescription refill"
            to="/p/prescriptions/refill"
          />
          <QuickActionCard
            icon={FileText}
            title="View Records"
            description="Access your medical records"
            to="/p/records"
          />
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;