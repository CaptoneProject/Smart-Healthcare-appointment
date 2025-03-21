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
  doctor_name?: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  status: string; // Use string instead of enum to avoid case issues
  type: string;
  notes?: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onViewDetails: (appointment: Appointment) => void;
  onCancelAppointment: (appointmentId: number) => void;
}

// Update the AppointmentCard component to properly format the date
const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  appointment, 
  onViewDetails, 
  onCancelAppointment 
}) => {
  const statusLower = appointment.status.toLowerCase();
  
  // Format date for display - extract this to avoid repetition
  const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  });
  
  // Format time to remove seconds
  const formattedTime = appointment.time.substring(0, 5);
  
  return (
    <Card>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium text-lg text-white/90">{appointment.doctor}</h3>
          <p className="text-sm text-white/60">{appointment.specialty}</p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center text-white/60">
          <CalendarIcon className="w-4 h-4 mr-2" />
          {formattedDate}
          <Clock className="w-4 h-4 ml-4 mr-2" />
          {formattedTime}
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
        {statusLower === 'confirmed' && (
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

interface AppointmentDetailsProps {
  appointment: Appointment;
  onClose: () => void;
}

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({ appointment, onClose }) => {
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
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  
  // Move this useState to the top level
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const fetchAppointments = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Get current date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Get date 1 year in the future
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const endDate = futureDate.toISOString().split('T')[0];
      
      // Get date 1 year in the past
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      const startDate = pastDate.toISOString().split('T')[0];
      
      const appointmentsData = await appointmentService.getAppointments({
        userId: user.id,
        userType: 'patient',
        startDate, // Include past appointments
        endDate // Include future appointments
      });
      
      // Process appointments for display
      const processedAppointments = appointmentsData.map((appt: any) => ({
        id: appt.id,
        doctor: appt.doctor_name || 'Doctor',
        doctor_name: appt.doctor_name || 'Doctor',
        specialty: appt.specialty || 'General Practice',
        // Preserve the original date format for consistent comparison
        date: appt.date,
        time: appt.time,
        location: appt.location || 'Main Clinic',
        status: appt.status || 'Pending',
        type: appt.type || 'Consultation',
        notes: appt.notes || ''
      }));
      
      setAppointments(processedAppointments);
      
      // Create calendar events from appointments
      const events = processedAppointments.map((appointment: { id: any; time: string; doctor: any; date: any; status: string; type: any; }) => ({
        id: appointment.id,
        title: `${appointment.time.substring(0, 5)} - Dr. ${appointment.doctor}`,
        date: appointment.date, 
        classNames: getEventClassName(appointment.status),
        extendedProps: {
          status: appointment.status,
          type: appointment.type
        }
      }));
      
      setCalendarEvents(events);
      
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user?.id]);

  const filterAppointments = () => {
    if (!appointments) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      appointmentDate.setHours(0, 0, 0, 0); // Start of appointment date
      const statusLower = appointment.status.toLowerCase();
      
      if (filter === 'upcoming') {
        // Only future appointments and today's appointments
        return appointmentDate >= today && statusLower !== 'cancelled';
      } else if (filter === 'past') {
        // Only past appointments
        return appointmentDate < today || statusLower === 'completed';
      } else {
        // All appointments
        return true;
      }
    });
  };

  const getFilteredAppointments = () => {
    const filtered = filterAppointments();
    
    // Apply search filter if there's a query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return filtered.filter(appointment => (
        appointment.doctor.toLowerCase().includes(searchLower) ||
        appointment.specialty.toLowerCase().includes(searchLower) ||
        appointment.location.toLowerCase().includes(searchLower) ||
        appointment.type.toLowerCase().includes(searchLower)
      ));
    }
    
    return filtered;
  };

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

  const handleCalendarEventClick = (info: any) => {
    const appointmentId = parseInt(info.event.id);
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
      setSelectedAppointment(appointment);
      setIsDetailsModalOpen(true); // Use the correct modal state variable
    }
  };

  // Add this helper function to get event class names based on status
  const getEventClassName = (status: string) => {
    switch (status.toLowerCase()) {
      case 'cancelled': return 'bg-red-500/50 border-red-500';
      case 'completed': return 'bg-green-500/50 border-green-500';
      case 'confirmed': return 'bg-blue-500/50 border-blue-500';
      case 'pending': return 'bg-yellow-500/50 border-yellow-500';
      default: return 'bg-blue-500/50 border-blue-500';
    }
  };

  // Update the calendar render code
  const renderCalendarView = () => {
    // Add console logging for appointments to debug date formats
    console.log("Current appointments:", appointments.map(a => ({ 
      id: a.id, 
      date: a.date,
      status: a.status 
    })));
    
    // Group appointments by date for easier rendering
    const appointmentsByDate: Record<string, Appointment[]> = {};
    
    appointments.forEach(appointment => {
      // Get date in YYYY-MM-DD format regardless of input format
      let dateKey;
      try {
        // Handle both ISO format and YYYY-MM-DD format
        const dateObj = new Date(appointment.date);
        dateKey = dateObj.toISOString().split('T')[0];
        console.log(`Processing appointment date: ${appointment.date} → ${dateKey}`);
      } catch (e) {
        console.error(`Error processing date: ${appointment.date}`, e);
        return; // Skip this appointment if date is invalid
      }
      
      if (!appointmentsByDate[dateKey]) {
        appointmentsByDate[dateKey] = [];
      }
      appointmentsByDate[dateKey].push(appointment);
    });
    
    // Log the appointment groups for debugging
    console.log("Appointments by date:", Object.keys(appointmentsByDate));
    
    // Get current month and year for the calendar
    // Remove the useState from here - use the one from above
    // const [currentMonth, setCurrentMonth] = useState(() => {
    //   const today = new Date();
    //   return new Date(today.getFullYear(), today.getMonth(), 1);
    // });
    
    // Get days in the current month
    const getDaysInMonth = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };
    
    // Get day of week for the first day of the month
    const getFirstDayOfMonth = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };
    
    // Navigate to previous month
    const goToPreviousMonth = () => {
      setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };
    
    // Navigate to next month
    const goToNextMonth = () => {
      setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };
    
    // Format date as YYYY-MM-DD consistently
    const formatDateString = (year: number, month: number, day: number) => {
      const date = new Date(year, month, day);
      return date.toISOString().split('T')[0];
    };
    
    // Check if a date has appointments (with better logging)
    const hasAppointments = (year: number, month: number, day: number) => {
      const dateString = formatDateString(year, month, day);
      const hasAppt = Boolean(appointmentsByDate[dateString]?.length);
      
      // Only log days with appointments to reduce console spam
      if (hasAppt) {
        console.log(`Found appointments on ${dateString}:`, appointmentsByDate[dateString]);
      }
      
      return hasAppt;
    };
    
    // Get status for date with appointments (for color coding)
    const getAppointmentStatus = (year: number, month: number, day: number) => {
      const dateString = formatDateString(year, month, day);
      const dateAppointments = appointmentsByDate[dateString] || [];
      
      if (dateAppointments.length === 0) return null;
      
      // Log the appointments for this date to debug
      console.log(`Status check for ${dateString}:`, dateAppointments.map(a => a.status));
      
      // Priority: confirmed > pending > completed > cancelled > scheduled
      if (dateAppointments.some(a => a.status.toLowerCase() === 'confirmed')) {
        return 'confirmed';
      }
      if (dateAppointments.some(a => a.status.toLowerCase() === 'scheduled')) {
        return 'scheduled'; // Add this line to handle "scheduled" status
      }
      if (dateAppointments.some(a => a.status.toLowerCase() === 'pending')) {
        return 'pending';  
      }
      if (dateAppointments.some(a => a.status.toLowerCase() === 'completed')) {
        return 'completed';
      }
      if (dateAppointments.some(a => a.status.toLowerCase() === 'cancelled')) {
        return 'cancelled';
      }
      
      // Default to the status of the first appointment if none of the above match
      return dateAppointments[0].status.toLowerCase();
    };
    
    // Handle click on a date
    const handleDateClick = (year: number, month: number, day: number) => {
      const dateString = formatDateString(year, month, day);
      const dateAppointments = appointmentsByDate[dateString] || [];
      
      if (dateAppointments.length > 0) {
        setSelectedAppointment(dateAppointments[0]);
        setIsDetailsModalOpen(true);
      }
    };
    
    // Get background class based on appointment status
    const getStatusClass = (status: string | null) => {
      if (!status) return '';
      
      switch (status.toLowerCase()) {
        case 'confirmed': return 'bg-blue-500/20 border-blue-500';
        case 'pending': return 'bg-yellow-500/20 border-yellow-500'; 
        case 'completed': return 'bg-green-500/20 border-green-500';
        case 'cancelled': return 'bg-red-500/20 border-red-500';
        case 'scheduled': return 'bg-blue-500/20 border-blue-500'; // Handle "scheduled" status
        default: return 'bg-blue-500/20 border-blue-500'; // Default to blue for unknown statuses
      }
    };
    
    // Generate calendar grid
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 border border-white/10"></div>);
    }
    
    // Add cells for each day in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const hasAppts = hasAppointments(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const status = getAppointmentStatus(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      
      days.push(
        <div 
          key={`day-${day}`}
          className={`h-16 border border-white/10 p-1 relative ${
            hasAppts 
              ? `cursor-pointer hover:bg-white/20 ${getStatusClass(status)}` 
              : ''
          }`}
          onClick={() => hasAppts && handleDateClick(currentMonth.getFullYear(), currentMonth.getMonth(), day)}
        >
          <div className="font-medium text-sm">{day}</div>
          {/* Remove the dot since we're coloring the whole cell */}
        </div>
      );
    }
    
    // Add this debugging in your renderCalendarView function after the appointment grouping
    // Check the March 25th appointment specifically
    const marchDate = new Date(2025, 2, 25); // March 25, 2025
    const marchDateISO = marchDate.toISOString().split('T')[0];
    const marchAppointments = appointmentsByDate[marchDateISO] || [];

    console.log("March 25th appointments:", {
      dateString: marchDateISO,
      appointments: marchAppointments,
      statuses: marchAppointments.map(a => ({
        original: a.status,
        lowercase: a.status.toLowerCase()
      }))
    });

    return (
      <div className="bg-white/5 rounded-lg backdrop-blur-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={goToPreviousMonth}
            className="text-white/60 hover:text-white/90 transition-colors"
          >
            &lt; Previous
          </button>
          <h3 className="font-medium text-lg">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            onClick={goToNextMonth}
            className="text-white/60 hover:text-white/90 transition-colors"
          >
            Next &gt;
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-medium text-white/60 py-2">{day}</div>
          ))}
          
          {/* Calendar days */}
          {days}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 justify-end">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500 mr-2"></div>
            <span className="text-xs text-white/60">Confirmed/Scheduled</span>
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
      </div>
    );
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
          {renderCalendarView()}

          {/* Appointments List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {getFilteredAppointments().length > 0 ? (
              getFilteredAppointments().map((appointment) => (
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