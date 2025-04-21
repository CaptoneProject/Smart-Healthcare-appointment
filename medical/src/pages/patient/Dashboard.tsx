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
  LucideIcon,
  Bell
} 
from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { appointmentService, medicalService } from '../../services/api';
import api from '../../services/api';
import { formatDate, formatFullDate, formatTime } from '../../utils/dateTime';
import PaymentReminder from '../../components/PaymentReminder'; // Import the component
import prescriptionService from '../../services/prescriptionService'; // Import prescriptionService

interface DashboardCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  footer?: string;
  link?: string;
}

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

// Update the existing PendingPaymentAppointment interface
interface PendingPaymentAppointment {
  id: number;
  doctor_name: string;
  date: string;
  time: string;
  amount: number;
  remaining_amount: number; // Add this property
  invoice_id: number;
  invoice_status?: string;
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingPaymentAppointments, setPendingPaymentAppointments] = useState<PendingPaymentAppointment[]>([]);
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
        
        // Fetch appointments
        const appointmentsData = await appointmentService.getAppointments({
          userId: user.id,
          userType: 'patient',
          startDate: today,
          endDate: endDate
        });
        
        // Update appointment transformation to prevent date shift
        const formattedAppointments = appointmentsData.map((appt: any) => ({
          id: appt.id,
          doctor: appt.doctor_name || 'Doctor',
          specialty: appt.specialty || appt.doctor_specialty || 'General Practice',
          date: appt.date.split('T')[0],
          time: appt.time.substring(0, 5),
          status: appt.status
        }));

        setAppointments(formattedAppointments);
        
        // Filter only confirmed appointments for the counter
        const confirmedAppointments = formattedAppointments.filter(
          (appt: Appointment) => appt.status.toLowerCase() === 'confirmed'
        );
        
        // Fetch prescriptions for active prescription count
        let activePrescriptionsCount = 0;
        try {
          const prescriptionsData = await prescriptionService.getPatientPrescriptions();
          // Count prescriptions with "Active" status
          activePrescriptionsCount = prescriptionsData.filter(
            (prescription) => prescription.status === 'Active'
          ).length;
          console.log(`Found ${activePrescriptionsCount} active prescriptions`);
        } catch (error) {
          console.error('Error fetching prescriptions:', error);
        }
        
        // Fetch medical records count
        let recentDocumentsCount = 0;
        try {
          const medicalRecordsData = await medicalService.getOwnRecords();
          recentDocumentsCount = medicalRecordsData.length;
        } catch (error) {
          console.error('Error fetching medical records:', error);
        }

        // Fetch pending payments amount and appointments with pending payments
        let pendingPaymentsAmount = 0;
        try {
          const response = await api.get(`/payments/invoices/patient/${user.id}`);
          const invoices = response.data;
          
          // Calculate total pending amount - ONLY FOR APPROVED INVOICES
          pendingPaymentsAmount = invoices.reduce((total: number, invoice: any) => {
            if (invoice.status.toLowerCase() === 'approved') {  // Changed from 'paid' check to specifically look for 'approved'
              return total + parseFloat(String(invoice.remaining_amount || invoice.amount || 0));
            }
            return total;
          }, 0);
          
          // Get pending payment appointments - ONLY FOR APPROVED INVOICES
          const pendingInvoices = invoices.filter((invoice: any) => 
            invoice.status.toLowerCase() === 'approved' &&  // Changed from 'pending' to 'approved'
            invoice.appointment_id !== null
          );
          
          // If there are pending invoices with appointment IDs, fetch appointment details
          if (pendingInvoices.length > 0) {
            // Get appointment details for pending invoices
            const pendingPayments = await Promise.all(
              pendingInvoices.map(async (invoice: any) => {
                try {
                  const appointmentResponse = await api.get(`/appointments/${invoice.appointment_id}`);
                  const appointment = appointmentResponse.data;
                  
                  return {
                    id: appointment.id,
                    doctor_name: appointment.doctor_name,
                    date: appointment.date.split('T')[0],
                    time: appointment.time.substring(0, 5),
                    amount: parseFloat(String(invoice.remaining_amount || invoice.amount || 0)),
                    invoice_id: invoice.id
                  };
                } catch (err) {
                  console.error(`Error fetching appointment ${invoice.appointment_id}:`, err);
                  return null;
                }
              })
            );
            
            // Filter out any null results and set to state
            setPendingPaymentAppointments(pendingPayments.filter(Boolean));
          }
        } catch (error) {
          console.error('Error fetching payment data:', error);
        }
        
        // Update stats with all values including active prescriptions
        setStats({
          upcomingAppointments: confirmedAppointments.length,
          activePrescriptions: activePrescriptionsCount,
          recentDocuments: recentDocumentsCount,
          pendingPayments: pendingPaymentsAmount
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user?.id]);

  useEffect(() => {
    const fetchPendingPayments = async () => {
      if (!user?.id) return;
      try {
        // Get pending invoices with appointment information already included
        const pendingPayments = await appointmentService.getConfirmedUnpaidAppointments(user.id);
        
        // If we have pending payments, filter for only approved invoices
        if (pendingPayments && pendingPayments.length > 0) {
          // Filter to only show approved invoices
          const approvedPayments = pendingPayments.filter(
            payment => payment.invoice_status === 'approved'
          );
          
          // Format dates and times as needed
          const formattedPayments = approvedPayments.map(payment => ({
            id: payment.id,
            doctor_name: payment.doctor_name,
            date: payment.date.split('T')[0],
            time: payment.time.substring(0, 5),
            amount: parseFloat(String(payment.amount || 0)),
            remaining_amount: parseFloat(String(payment.remaining_amount || payment.amount || 0)),
            invoice_id: payment.invoice_id,
            invoice_status: payment.invoice_status
          }));
          
          setPendingPaymentAppointments(formattedPayments);
        } else {
          setPendingPaymentAppointments([]);
        }
      } catch (error) {
        console.error('Error fetching pending payment appointments:', error);
        setPendingPaymentAppointments([]);
      }
    };
    
    fetchPendingPayments();
  }, [user?.id]);

  const upcomingAppointments = appointments.filter(
    (appt: Appointment) => appt.status.toLowerCase() === 'confirmed'
  );

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
      value: loading ? "..." : `$${stats.pendingPayments.toFixed(2)}`,
      footer: "View payments",
      link: "/p/payments"
    },
    {
      icon: FileText,
      title: "Insurance Claims",
      value: loading ? "..." : "Manage",
      footer: "Submit & track claims",
      link: "/p/insurance"
    }
  ];

  return (
    <div className="space-y-6 p-6">
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

      <Card>
        <h2 className="text-xl font-semibold text-white/90">Welcome, {user?.name}</h2>
        <p className="text-white/60 mt-2">Here's an overview of your health management</p>
      </Card>

      {/* Payment Reminders Section */}
      {pendingPaymentAppointments.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center mb-4">
            <CreditCard className="w-5 h-5 text-blue-400 mr-2" />
            <h2 className="text-xl font-semibold text-white/90">Payment Reminders</h2>
          </div>
          <div className="space-y-4">
            {pendingPaymentAppointments.map(appointment => (
              <PaymentReminder
                key={appointment.id}
                appointmentId={appointment.id}
                doctorName={appointment.doctor_name}
                appointmentDate={appointment.date}
                appointmentTime={appointment.time}
                // Use amount if remaining_amount is not available
                amount={appointment.remaining_amount || appointment.amount}
                invoiceId={appointment.invoice_id}
              />
            ))}
          </div>
        </div>
      )}

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

      {upcomingAppointments.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center mb-4">
            <Bell className="w-5 h-5 text-yellow-400 mr-2" />
            <h2 className="text-xl font-semibold text-white/90">Appointment Reminders</h2>
          </div>
          <Card className="p-4 border-l-4 border-yellow-500">
            <div className="flex flex-col space-y-4">
              {upcomingAppointments.slice(0, 1).map((appointment) => (
                <div key={appointment.id} className="flex items-center">
                  <div className="flex-1">
                    <p className="text-white/90 font-medium">
                      You have an appointment with Dr. {appointment.doctor}
                    </p>
                    <p className="text-white/60 text-sm mt-1">
                      {formatFullDate(appointment.date)} at {formatTime(appointment.time)}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/p/appointments')}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

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
    </div>
  );
};

export default PatientDashboard;