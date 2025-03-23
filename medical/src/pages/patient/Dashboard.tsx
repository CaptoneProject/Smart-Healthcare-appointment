// src/pages/patient/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Pill, 
  CreditCard,
  ArrowRight,
  User,
  LucideIcon
} 
from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/api';

interface DashboardCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  footer?: string;
  link?: string;
}


// Add the missing interface
interface DoctorAppointmentCardProps {
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: string;
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


const DoctorAppointmentCard: React.FC<DoctorAppointmentCardProps> = ({ 
  doctor, 
  specialty, 
  date,
  time,
  status
}) => {
  // Format the date without timezone conversion
  const formatDate = (dateStr: string) => {
    // Get components without timezone conversion
    const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
    
    // Format as M/D/YYYY
    return `${month}/${day}/${year}`;
  };

  return (
    <Card>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium text-lg text-white/90">{doctor}</h3>
          <p className="text-white/60">{specialty}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      
      <div className="pt-2 border-t border-white/10">
        <div className="flex items-center text-white/60">
          <Calendar className="w-4 h-4 mr-2" />
          {formatDate(date)}
          <Clock className="w-4 h-4 ml-4 mr-2" />
          {time}
        </div>
      </div>
    </Card>
  );
};

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
        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 3);
        const endDate = futureDate.toISOString().split('T')[0];
        
        const appointmentsData = await appointmentService.getAppointments({
          userId: user.id,
          userType: 'patient',
          startDate: today,
          endDate: endDate
        });
        
        // Update appointment transformation to match
        const formattedAppointments = appointmentsData.map((appt: any) => ({
          id: appt.id,
          doctor: appt.doctor_name || 'Doctor',
          specialty: appt.specialty || appt.doctor_specialty || 'General Practice', // Match the format
          date: new Date(appt.date).toISOString().split('T')[0],
          time: appt.time.substring(0, 5),
          status: appt.status
        }));

        // Filter only confirmed appointments for the counter
        const confirmedAppointments = formattedAppointments.filter(
          (appt: Appointment) => appt.status.toLowerCase() === 'confirmed'
        );
        
        setAppointments(formattedAppointments);
        
        // Update stats with only confirmed appointments
        setStats({
          upcomingAppointments: confirmedAppointments.length,
          activePrescriptions: 0,
          recentDocuments: 0,
          pendingPayments: 0
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user?.id]);

  // Filter appointments for display in the appointments section
  const upcomingAppointments = appointments.filter(
    (appt: Appointment) => appt.status.toLowerCase() === 'confirmed'
  );

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
        ) : upcomingAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingAppointments.slice(0, 2).map((appointment, index) => (
              <DoctorAppointmentCard 
                key={appointment.id || index}
                doctor={appointment.doctor}
                specialty={appointment.specialty}
                date={appointment.date} // Pass the date string directly
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
    </div>
  );
};

export default PatientDashboard;