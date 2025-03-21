import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Filter, 
  Search, 
  FileText, 
  User,
  MapPin,
  Plus,
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/api';

interface Appointment {
  id: number;
  patient_name: string;
  date: string;
  time: string;
  type: string;
  status: string;
  location: string;
  notes?: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onViewDetails: (appointment: Appointment) => void;
  onUpdateStatus: (id: number, status: string) => void;
}

const AppointmentDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}> = ({ isOpen, onClose, appointment }) => {
  if (!appointment) return null;

  // Format the date for display
  const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });
  
  // Format the time (remove seconds)
  const formattedTime = appointment.time.substring(0, 5);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Appointment Details">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-white/90 mb-1">Patient Information</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-white/90">{appointment.patient_name}</h4>
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
        
        <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
          <Button 
            variant="secondary" 
            size="md" 
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  appointment, 
  onViewDetails,
  onUpdateStatus
}) => {
  const statusLower = appointment.status.toLowerCase();
  
  // Format date for display
  const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', {
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  
  // Format time (remove seconds)
  const formattedTime = appointment.time.substring(0, 5);
  
  return (
    <Card>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium text-lg text-white/90">{appointment.patient_name}</h3>
        </div>
        <StatusBadge status={appointment.status} />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center text-white/60">
          <Calendar className="w-4 h-4 mr-2" />
          {formattedDate}
          <Clock className="w-4 h-4 ml-4 mr-2" />
          {formattedTime}
        </div>
        <div className="flex items-center text-white/60">
          <MapPin className="w-4 h-4 mr-2" />
          {appointment.location || 'Main Clinic'}
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
        {statusLower === 'scheduled' && (
          <div className="flex space-x-2">
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => onUpdateStatus(appointment.id, 'confirmed')}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Confirm
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

const DoctorAppointments: React.FC = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'today'>('today');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchAppointments = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Calculate date ranges based on the filter
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let startDate;
      let endDate;
      
      if (filter === 'today') {
        startDate = today.toISOString().split('T')[0];
        endDate = startDate;
      } else if (filter === 'upcoming') {
        startDate = today.toISOString().split('T')[0];
        const futureDate = new Date(today);
        futureDate.setMonth(futureDate.getMonth() + 3); // 3 months ahead
        endDate = futureDate.toISOString().split('T')[0];
      } else if (filter === 'past') {
        const pastDate = new Date(today);
        pastDate.setMonth(pastDate.getMonth() - 6); // 6 months back
        startDate = pastDate.toISOString().split('T')[0];
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        endDate = yesterday.toISOString().split('T')[0];
      } else {
        // All appointments - get a year's worth
        const pastDate = new Date(today);
        pastDate.setFullYear(pastDate.getFullYear() - 1);
        startDate = pastDate.toISOString().split('T')[0];
        
        const futureDate = new Date(today);
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        endDate = futureDate.toISOString().split('T')[0];
      }
      
      const appointmentsData = await appointmentService.getAppointments({
        userId: user.id,
        userType: 'doctor',
        startDate,
        endDate
      });
      
      // Process appointments
      const processedAppointments = appointmentsData.map((appt: any) => ({
        id: appt.id,
        patient_name: appt.patient_name || 'Patient',
        date: appt.date,
        time: appt.time,
        location: appt.location || 'Main Clinic',
        status: appt.status || 'Scheduled',
        type: appt.type || 'Consultation',
        notes: appt.notes || ''
      }));
      
      setAppointments(processedAppointments);
      
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user?.id, filter]);

  const getFilteredAppointments = () => {
    if (!appointments) return [];
    
    // Apply search filter if there's a query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return appointments.filter(appointment => (
        appointment.patient_name.toLowerCase().includes(searchLower) ||
        appointment.type.toLowerCase().includes(searchLower) ||
        appointment.location.toLowerCase().includes(searchLower)
      ));
    }
    
    return appointments;
  };

  const filterOptions = [
    { id: 'today', label: 'Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
    { id: 'all', label: 'All' }
  ];

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateStatus = async (appointmentId: number, newStatus: string) => {
    try {
      await appointmentService.updateAppointmentStatus(appointmentId, newStatus);
      
      // Update the local state to reflect the status change
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === appointmentId 
            ? { ...appointment, status: newStatus } 
            : appointment
        )
      );
      
    } catch (err) {
      console.error('Error updating appointment status:', err);
      setError('Failed to update appointment status. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader 
        title="Patient Appointments" 
        description="Manage your appointment schedule"
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
        onFilterChange={(value) => setFilter(value as 'all' | 'upcoming' | 'past' | 'today')}
        options={filterOptions}
        searchPlaceholder="Search patients..."
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
          {/* Appointments List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {getFilteredAppointments().length > 0 ? (
              getFilteredAppointments().map((appointment) => (
                <AppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                  onViewDetails={handleViewDetails}
                  onUpdateStatus={handleUpdateStatus}
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
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        appointment={selectedAppointment}
      />
    </div>
  );
};

export default DoctorAppointments;