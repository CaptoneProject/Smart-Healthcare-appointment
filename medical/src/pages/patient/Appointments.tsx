// src/pages/patient/Appointments.tsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus,
  FileText
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import Calendar from '../../components/Calendar';
import AppointmentForm, { AppointmentFormData } from '../../components/forms/AppointmentForm';
import { appointmentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Appointment {
  id: number;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
  type: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onViewDetails: (appointment: Appointment) => void;
  onCancelAppointment: (appointmentId: number) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  appointment, 
  onViewDetails, 
  onCancelAppointment 
}) => {
  // Update the date formatting to match the server format
  const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });

  return (
    <Card>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium text-lg text-white/90">{appointment.doctor}</h3>
          <p className="text-white/60">{appointment.specialty}</p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center text-white/60">
          <CalendarIcon className="w-4 h-4 mr-2" />
          {formattedDate}
          <Clock className="w-4 h-4 ml-4 mr-2" />
          {appointment.time}
        </div>
        <div className="flex items-center text-white/60">
          <MapPin className="w-4 h-4 mr-2" />
          {appointment.location}
        </div>
        <div className="flex items-center text-white/60">
          <FileText className="w-4 h-4 mr-2" />
          {appointment.type}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onViewDetails(appointment)}
        >
          View Details
        </Button>
        {appointment.status === 'Confirmed' && (
          <Button 
            variant="danger" 
            size="sm"
            onClick={() => onCancelAppointment(appointment.id)}
          >
            Cancel Appointment
          </Button>
        )}
      </div>
    </Card>
  );
};

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  isOpen,
  onClose,
  appointment
}) => {
  if (!appointment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Appointment Details">
      <AppointmentDetails appointment={appointment} onClose={onClose} />
    </Modal>
  );
};

const AppointmentDetails = ({ appointment, onClose }) => {
  // Format the date properly
  const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });
  
  // Format the time properly (remove seconds)
  const formattedTime = appointment.time.substring(0, 5);
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white/90 mb-1">Appointment Details</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white/90">{appointment.doctor_name}</h4>
            <p className="text-sm text-white/60">
              {appointment.specialty || "General Practice"}
            </p>
          </div>
          
          <StatusBadge status={appointment.status} />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Date</label>
              <p className="text-white">{formattedDate}</p>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Time</label>
              <p className="text-white">{formattedTime}</p>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Location</label>
              <p className="text-white">{appointment.location || "Main Clinic"}</p>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Type</label>
              <p className="text-white">{appointment.type}</p>
            </div>
          </div>
          
          {appointment.notes && (
            <div>
              <label className="block text-sm text-white/60 mb-1">Notes</label>
              <p className="text-white text-sm">{appointment.notes}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="pt-4 border-t border-white/10 flex justify-end">
        <Button 
          variant="secondary" 
          size="md" 
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
};

const CalendarLegend: React.FC = () => (
  <div className="flex items-center justify-end gap-4 mt-4 px-4 pb-2">
    <div className="flex items-center">
      <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500 mr-2"></div>
      <span className="text-xs text-white/60">Confirmed</span>
    </div>
    <div className="flex items-center">
      <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500 mr-2"></div>
      <span className="text-xs text-white/60">Pending</span>
    </div>
    <div className="flex items-center">
      <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500 mr-2"></div>
      <span className="text-xs text-white/60">Completed</span>
    </div>
    <div className="flex items-center">
      <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500 mr-2"></div>
      <span className="text-xs text-white/60">Cancelled</span>
    </div>
  </div>
);

const PatientAppointments: React.FC = () => {
  const { user } = useAuth();
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if user is logged in
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get date range for the past 6 months and next 6 months
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      const data = await appointmentService.getAppointments({
        userId: user.id,
        userType: 'patient',
        startDate: formattedStartDate,
        endDate: formattedEndDate
      });
      
      // Transform API data to match component's expected format
      const transformedData = data.map((item: any) => ({
        id: item.id,
        doctor: item.doctor_name,
        specialty: item.doctor_specialty || "Specialty not specified",
        date: item.date, // Keep the original date from backend
        time: item.time.substring(0, 5),
        location: item.location || "Main Clinic",
        status: (item.status.charAt(0).toUpperCase() + item.status.slice(1)) as 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled',
        type: item.type || "Consultation"
      }));
      
      setAppointments(transformedData);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Convert appointments to calendar events
  const calendarEvents = appointments.map(appointment => {
    // Parse date parts manually to avoid timezone shifts
    const [year, month, day] = appointment.date.split('-');
    // Create date using local timezone
    const eventDate = new Date(
      Number(year), 
      Number(month) - 1, // Months are 0-based
      Number(day),
      12 // Set to noon to avoid any timezone issues
    );
    
    return {
      id: appointment.id,
      date: eventDate,
      title: `${appointment.time} - ${appointment.doctor}`,
      type: appointment.type
    };
  });

  const filteredAppointments = appointments.filter(appointment => {
    // Filter by status
    if (filter !== 'all') {
      const isUpcoming = new Date(`${appointment.date} ${appointment.time}`) > new Date();
      if (filter === 'upcoming' && !isUpcoming) return false;
      if (filter === 'past' && isUpcoming) return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        appointment.doctor.toLowerCase().includes(searchLower) ||
        appointment.specialty.toLowerCase().includes(searchLower) ||
        appointment.location.toLowerCase().includes(searchLower) ||
        appointment.type.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' }
  ];

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  const handleCancelAppointment = (appointmentId: number) => {
    setAppointmentToCancel(appointmentId);
    setIsCancelModalOpen(true);
  };

  const confirmCancelAppointment = async () => {
    if (!appointmentToCancel) return;
    
    try {
      await appointmentService.cancelAppointment(appointmentToCancel);
      
      // Update the local state to reflect the cancellation
      setAppointments(appointments.map(appointment => 
        appointment.id === appointmentToCancel 
          ? { ...appointment, status: 'Cancelled' }
          : appointment
      ));
      
      setIsCancelModalOpen(false);
      setAppointmentToCancel(null);
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      // Show error to user
      setError('Failed to cancel appointment. Please try again.');
    }
  };

  const handleScheduleAppointment = async (data: AppointmentFormData) => {
    try {
      setError('');
      
      await appointmentService.createAppointment({
        patientId: user!.id,
        doctorId: data.doctorId,
        date: data.date,
        time: data.time,
        duration: 30, // Default duration in minutes
        type: data.type,
        notes: data.reason
      });
      
      setIsNewAppointmentOpen(false);
      
      // Refresh appointments
      fetchAppointments();
    } catch (err) {
      console.error('Error scheduling appointment:', err);
      setError('Failed to schedule appointment. Please try again.');
    }
  };

  const handleCalendarEventClick = (event: any) => {
    const appointment = appointments.find(a => a.id === event.id);
    if (appointment) {
      handleViewDetails(appointment);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <PageHeader 
        title="Appointments" 
        description="Manage your appointments and schedule new ones"
        action={
          <Button 
            variant="primary" 
            size="md" 
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsNewAppointmentOpen(true)} // Make sure this is correct
          >
            New Appointment
          </Button>
        }
      />

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Filters */}
      <FilterBar 
        activeFilter={filter}
        onFilterChange={(value) => setFilter(value as 'all' | 'upcoming' | 'past')}
        options={filterOptions}
        searchPlaceholder="Search appointments..."
        onSearchChange={setSearchQuery}
        searchValue={searchQuery}
      />

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Calendar View */}
          <div className="space-y-2">
            <Calendar 
              events={calendarEvents}
              onEventClick={handleCalendarEventClick}
            />
            <CalendarLegend />
          </div>

          {/* Appointments List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <AppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                  onViewDetails={handleViewDetails}
                  onCancelAppointment={handleCancelAppointment}
                />
              ))
            ) : (
              <div className="col-span-1 lg:col-span-2 flex justify-center p-10">
                <div className="text-center">
                  <p className="text-white/60">
                    {loading 
                      ? 'Loading appointments...' 
                      : 'No appointments found matching your criteria.'}
                  </p>
                  <Button 
                    variant="primary" 
                    size="md" 
                    className="mt-4"
                    onClick={() => setIsNewAppointmentOpen(true)}
                  >
                    Schedule New Appointment
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* New Appointment Modal */}
      <Modal 
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
        title="Schedule New Appointment"
      >
        <AppointmentForm 
          onSubmit={handleScheduleAppointment}
          onCancel={() => setIsNewAppointmentOpen(false)}
        />
      </Modal>

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        appointment={selectedAppointment}
      />

      {/* Cancel Appointment Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Appointment"
      >
        <div className="py-4">
          <p className="text-white/90">Are you sure you want to cancel this appointment?</p>
          <p className="text-white/60 mt-2">This action cannot be undone.</p>
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
          <Button 
            variant="secondary" 
            onClick={() => setIsCancelModalOpen(false)}
          >
            Keep Appointment
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmCancelAppointment}
          >
            Cancel Appointment
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default PatientAppointments;