import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  UserPlus, 
  FileText, 
  ArrowRight,
  User,
  LucideIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { doctorService, appointmentService } from '../../services/api';

interface DashboardCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  footer?: string;
  link?: string;
}

interface AppointmentCardProps {
  patientName: string;
  date: string;
  time: string;
  type: string;
  status: string;
}

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
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

const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  patientName, 
  date, 
  time, 
  type, 
  status 
}) => (
  <Card>
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="font-medium text-lg text-white/90">{patientName}</h3>
        <p className="text-white/60">{type}</p>
      </div>
      <StatusBadge status={status} />
    </div>
    
    <div className="space-y-3">
      <div className="flex items-center text-white/60">
        <Calendar className="w-4 h-4 mr-2" />
        {date}
        <Clock className="w-4 h-4 ml-4 mr-2" />
        {time}
      </div>
    </div>

    <div className="mt-4 pt-4 border-t border-white/10 flex justify-end space-x-3">
      <Button 
        variant="secondary" 
        size="sm"
      >
        View Details
      </Button>
      <Button 
        variant="primary" 
        size="sm"
      >
        Start Consultation
      </Button>
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

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    todayCount: 0,
    pendingCount: 0,
    newPatients: 0,
    pendingReports: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch today's appointments
        const appointments = await appointmentService.getAppointments({
          userId: user.id,
          userType: 'doctor',
          startDate: today,
          endDate: today
        });
        
        setTodayAppointments(appointments || []);
        
        // Set basic stats based on available data
        setStats({
          todayCount: appointments?.length || 0,
          pendingCount: 0, // This would come from a backend API
          newPatients: 0,  // This would come from a backend API
          pendingReports: 0 // This would come from a backend API
        });
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  // Data for stats cards
  const dashboardStats = [
    {
      icon: Calendar,
      title: "Today's Appointments",
      value: isLoading ? "..." : stats.todayCount,
      footer: "View schedule",
      link: "/d/schedule"
    },
    {
      icon: Clock,
      title: "Pending Appointments",
      value: isLoading ? "..." : stats.pendingCount,
      footer: "View all",
      link: "/d/appointments"
    },
    {
      icon: UserPlus,
      title: "Patients",
      value: isLoading ? "..." : "Manage",
      footer: "View patients",
      link: "/d/patients"
    },
    {
      icon: FileText,
      title: "Medical Records",
      value: isLoading ? "..." : "Access",
      footer: "View records",
      link: "/d/records"
    }
  ];

  // Data for quick actions
  const quickActions = [
    {
      icon: Calendar,
      title: "Update Schedule",
      description: "Manage your availability",
      to: "/d/schedule"
    },
    {
      icon: UserPlus,
      title: "Patient Management",
      description: "Update patient records",
      to: "/d/patients"
    },
    {
      icon: Clock,
      title: "Request Leave",
      description: "Schedule time off",
      to: "/d/leave-request"
    }
  ];

  if (isLoading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <PageHeader 
        title="Doctor Dashboard" 
        description="Manage your patients and appointments"
        action={
          <Button 
            variant="primary" 
            size="md" 
            icon={<User className="w-4 h-4" />}
            onClick={() => {}}
          >
            My Profile
          </Button>
        }
      />

      {/* Welcome Section */}
      <Card>
        <h2 className="text-xl font-semibold text-white/90">Welcome, {user?.name}</h2>
        <p className="text-white/60 mt-2">
          {stats.todayCount > 0 
            ? `You have ${stats.todayCount} appointments scheduled for today` 
            : "You have no appointments scheduled for today"}
        </p>
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
          <h2 className="text-xl font-semibold text-white/90">Today's Appointments</h2>
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => {}}
            as={Link}
            to="/d/appointments"
          >
            View all
          </Button>
        </div>
        {todayAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {todayAppointments.map((appointment, index) => (
              <AppointmentCard 
                key={index} 
                patientName={appointment.patient_name} 
                date={appointment.date}
                time={appointment.time}
                type={appointment.type || "Consultation"}
                status={appointment.status}
              />
            ))}
          </div>
        ) : (
          <Card>
            <div className="p-6 text-center">
              <p className="text-white/60">No appointments scheduled for today</p>
            </div>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white/90">Quick Actions</h2>
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

export default DoctorDashboard;