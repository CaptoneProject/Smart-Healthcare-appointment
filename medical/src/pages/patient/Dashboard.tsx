// src/pages/patient/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Pill, 
  CreditCard,
  ArrowRight,
  Plus,
  User,
  LucideIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { appointmentService, patientService } from '../../services/api';

interface DashboardCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  footer?: string;
  link?: string;
}

interface AppointmentCardProps {
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: string;
}

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
}

interface Appointment {
  id: number;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  icon: Icon, 
  title, 
  value, 
  footer, 
  link 
}) => (
  <Card>
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center">
          <div className="p-2 rounded-lg bg-blue-400/10 backdrop-blur-sm">
            <Icon className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="ml-3 text-sm font-medium text-white/60">{title}</h3>
        </div>
        <div className="mt-4 text-2xl font-semibold text-white/90">{value}</div>
      </div>
    </div>
    {footer && link && (
      <div className="mt-4 pt-4 border-t border-white/10">
        <Link 
          to={link} 
          className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-all"
        >
          {footer}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    )}
  </Card>
);

const AppointmentCard: React.FC<AppointmentCardProps> = ({ doctor, specialty, date, time, status }) => (
  <Card>
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-medium text-white/90">{doctor}</h3>
        <p className="text-sm text-white/60">{specialty}</p>
      </div>
      <StatusBadge status={status} />
    </div>
    <div className="mt-4 flex items-center space-x-4">
      <div className="flex items-center text-white/60 text-sm">
        <Calendar className="w-4 h-4 mr-2" />
        {date}
      </div>
      <div className="flex items-center text-white/60 text-sm">
        <Clock className="w-4 h-4 mr-2" />
        {time}
      </div>
    </div>
  </Card>
);

const QuickActionCard: React.FC<QuickActionCardProps> = ({ icon: Icon, title, description, to }) => (
  <Link to={to} className="block">
    <Card className="hover:bg-white/10 transition-all duration-300 h-full">
      <div className="p-3 rounded-lg bg-blue-400/10 backdrop-blur-sm w-fit">
        <Icon className="w-6 h-6 text-blue-400" />
      </div>
      <h3 className="font-medium mb-2 mt-4 text-white/90">{title}</h3>
      <p className="text-sm text-white/60">{description}</p>
    </Card>
  </Link>
);

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    activePrescriptions: 0,
    recentDocuments: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Fetch upcoming appointments
        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 3); // 3 months in future
        const endDate = futureDate.toISOString().split('T')[0];
        
        const appointmentsData = await appointmentService.getAppointments({
          userId: user.id,
          userType: 'patient',
          startDate: today,
          endDate: endDate
        });
        
        // Process appointments data
        const formattedAppointments = appointmentsData.map((appt: any) => ({
          id: appt.id,
          doctor: appt.doctor_name || 'Doctor',
          specialty: appt.specialty || 'Specialist',
          date: new Date(appt.date).toLocaleDateString(),
          time: appt.time.substring(0, 5),
          status: appt.status
        }));
        
        setAppointments(formattedAppointments);
        
        // Update stats
        setStats({
          upcomingAppointments: formattedAppointments.length,
          activePrescriptions: 0, // Would come from prescriptions API
          recentDocuments: 0, // Would come from records API
          pendingPayments: 0 // Would come from payments API
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user?.id]);

  // Data for stats cards
  const dashboardStats = [
    {
      icon: Calendar,
      title: "Upcoming Appointments",
      value: loading ? "..." : stats.upcomingAppointments,
      footer: "View all appointments",
      link: "/p/appointments"
    },
    {
      icon: Pill,
      title: "Active Prescriptions",
      value: loading ? "..." : stats.activePrescriptions,
      footer: "View prescriptions",
      link: "/p/prescriptions"
    },
    {
      icon: FileText,
      title: "Recent Documents",
      value: loading ? "..." : stats.recentDocuments,
      footer: "View medical records",
      link: "/p/records"
    },
    {
      icon: CreditCard,
      title: "Payment Due",
      value: loading ? "..." : `$${stats.pendingPayments}`,
      footer: "View payments",
      link: "/p/payments"
    }
  ];

  // Data for quick actions
  const quickActions = [
    {
      icon: Calendar,
      title: "Schedule Appointment",
      description: "Book a new appointment with a doctor",
      to: "/p/appointments/new"
    },
    {
      icon: Pill,
      title: "Request Refill",
      description: "Request a prescription refill",
      to: "/p/prescriptions"
    },
    {
      icon: FileText,
      title: "View Records",
      description: "Access your medical records",
      to: "/p/records"
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <PageHeader 
        title="Dashboard" 
        description="Your healthcare at a glance"
        action={
          <Button 
            variant="primary" 
            size="md" 
            icon={<User className="w-4 h-4" />}
            onClick={() => {}}
            as={Link}
            to="/p/profile"
          >
            My Profile
          </Button>
        }
      />

      {/* Welcome Section */}
      <Card>
        <h2 className="text-xl font-semibold text-white/90">Welcome, {user?.name}</h2>
        <p className="text-white/60 mt-2">Here's an overview of your health management</p>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <DashboardCard
            key={index}
            icon={stat.icon}
            title={stat.title}
            value={stat.value}
            footer={stat.footer}
            link={stat.link}
          />
        ))}
      </div>

      {/* Appointments Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white/90">Upcoming Appointments</h2>
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowRight className="w-4 h-4" />}
            as={Link}
            to="/p/appointments"
          >
            View all
          </Button>
        </div>
        
        {loading ? (
          <Card className="p-6 flex justify-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500/30 border-t-blue-500"></div>
          </Card>
        ) : appointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {appointments.slice(0, 2).map((appointment, index) => (
              <AppointmentCard 
                key={appointment.id || index}
                doctor={appointment.doctor}
                specialty={appointment.specialty}
                date={appointment.date}
                time={appointment.time}
                status={appointment.status}
              />
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-white/60">No upcoming appointments</p>
            <Button 
              variant="primary"
              size="sm"
              className="mt-4"
              as={Link}
              to="/p/appointments"
            >
              Schedule New Appointment
            </Button>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white/90">Quick Actions</h2>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            as={Link}
            to="/p/appointments/new"
          >
            New Appointment
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <QuickActionCard 
              key={index}
              icon={action.icon}
              title={action.title}
              description={action.description}
              to={action.to}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;