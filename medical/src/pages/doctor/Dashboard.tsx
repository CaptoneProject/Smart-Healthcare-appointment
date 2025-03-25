import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  UserPlus, 
  FileText, 
  ArrowRight,
  User,
  LucideIcon,
  Bell
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/api';
import { formatTime } from '../../utils/dateTime';

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

// First, define an interface for the appointment data
interface AppointmentData {
  id: number;
  patient_name: string;
  date: string;
  time: string;
  type: string;
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
      <StatusBadge status={status as any} />
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
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  
  // Either use error variable or remove it
  const [error, setError] = useState<string | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<AppointmentData[]>([]);
  const [stats, setStats] = useState({
    todayCount: 0,
    pendingCount: 0,
    newPatients: 0,
    pendingReports: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Get all appointments including future ones
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 3); // 3 months ahead
        const endDate = futureDate.toISOString().split('T')[0];
        
        const appointmentsData = await appointmentService.getAppointments({
          userId: user.id,
          userType: 'doctor',
          startDate: today,
          endDate: endDate
        });

        // Process appointments with proper typing
        const processedAppointments = appointmentsData.map((appt: any) => ({
          id: appt.id,
          patient_name: appt.patient_name || 'Patient',
          date: appt.date,
          time: appt.time,
          type: appt.type || 'Consultation',
          status: appt.status || 'Scheduled'
        }));
        
        // Use the defined type for filter operations
        setTodayAppointments(processedAppointments.filter((appt: AppointmentData) => {
          // Clean date comparison without time component
          const appointmentDate = appt.date.split('T')[0];
          const today = new Date().toISOString().split('T')[0];
          
          return appointmentDate === today && 
                 appt.status.toLowerCase() === 'confirmed';
        }));
        
        // Update stats with proper typing
        setStats({
          todayCount: processedAppointments.filter((appt: AppointmentData) => {
            const appointmentDate = appt.date.split('T')[0];
            const today = new Date().toISOString().split('T')[0];
            
            return appointmentDate === today && 
                   appt.status.toLowerCase() === 'confirmed';
          }).length,
          pendingCount: processedAppointments.filter((appt: AppointmentData) => {
            const status = appt.status.toLowerCase();
            return status === 'pending_approval' || 
                   status === 'pending' || 
                   status === 'scheduled';
          }).length,
          newPatients: 0,
          pendingReports: 0
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  // Display error message if there is one
  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  // Data for stats cards
  const dashboardStats = [
    {
      icon: Calendar,
      title: "Today's Appointments",
      value: loading ? "..." : stats.todayCount,
      footer: "View schedule",
      link: "/d/appointments?filter=today" // Changed from /d/schedule to /d/appointments with today filter
    },
    {
      icon: Clock,
      title: "Pending Approvals", // Changed from "Pending Appointments"
      value: loading ? "..." : stats.pendingCount,
      footer: "View all",
      link: "/d/appointments?filter=pending_approval" // Updated link with filter query param
    },
    {
      icon: UserPlus,
      title: "Patients",
      value: loading ? "..." : "Manage",
      footer: "View patients",
      link: "/d/patients"
    },
    {
      icon: FileText,
      title: "Medical Records",
      value: loading ? "..." : "Access",
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

  if (loading) {
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
          <Link to="/d/appointments">
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => {}}
            >
              View all
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : todayAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {todayAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                patientName={appointment.patient_name}
                date={appointment.date}
                time={appointment.time}
                type={appointment.type}
                status={appointment.status}
              />
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-white/60">No appointments scheduled for today</p>
          </Card>
        )}
      </div>

      {/* Appointment Notifications */}
      {todayAppointments.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center mb-4">
            <Bell className="w-5 h-5 text-yellow-400 mr-2" />
            <h2 className="text-xl font-semibold text-white/90">Today's Reminders</h2>
          </div>
          <Card className="p-4 border-l-4 border-yellow-500">
            <div className="flex flex-col space-y-4">
              {todayAppointments.slice(0, 1).map((appointment) => (
                <div key={appointment.id} className="flex items-center">
                  <div className="flex-1">
                    <p className="text-white/90 font-medium">
                      You have an appointment with {appointment.patient_name}
                    </p>
                    <p className="text-white/60 text-sm mt-1">
                      Today at {formatTime(appointment.time)}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/d/appointments')}
                  >
                    View Schedule
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

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