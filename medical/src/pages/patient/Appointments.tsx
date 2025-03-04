// src/pages/patient/Appointments.tsx
import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import {Card} from '../../components/ui/Card';
import {StatusBadge} from '../../components/ui/StatusBadge';
import {Modal} from '../../components/ui/Modal';
import {Button} from '../../components/ui/Button';
import {FilterBar} from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';

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
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment }) => {
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
          {appointment.date}
          <Clock className="w-4 h-4 ml-4 mr-2" />
          {appointment.time}
        </div>
        <div className="flex items-center text-white/60">
          <MapPin className="w-4 h-4 mr-2" />
          {appointment.location}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
        <Button variant="ghost" size="sm">
          View Details
        </Button>
        {appointment.status === 'Confirmed' && (
          <Button variant="danger" size="sm">
            Cancel Appointment
          </Button>
        )}
      </div>
    </Card>
  );
};

const NewAppointmentModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ 
  isOpen, 
  onClose 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule New Appointment">
      {/* Add appointment form here */}
    </Modal>
  );
};

const PatientAppointments: React.FC = () => {
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const appointments: Appointment[] = [
    {
      id: 1,
      doctor: "Dr. Sarah Wilson",
      specialty: "General Physician",
      date: "Feb 24, 2025",
      time: "10:00 AM",
      location: "Main Street Clinic, Room 204",
      status: "Confirmed",
      type: "Check-up"
    },
    {
      id: 2,
      doctor: "Dr. Michael Chen",
      specialty: "Cardiologist",
      date: "Feb 26, 2025",
      time: "2:30 PM",
      location: "Heart Care Center, Room 105",
      status: "Pending",
      type: "Consultation"
    },
    {
      id: 3,
      doctor: "Dr. Emily Rodriguez",
      specialty: "Dermatologist",
      date: "Feb 20, 2025",
      time: "3:45 PM",
      location: "Skin Care Clinic, Room 302",
      status: "Completed",
      type: "Follow-up"
    }
  ];

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true;
    const isUpcoming = new Date(`${appointment.date} ${appointment.time}`) > new Date();
    return filter === 'upcoming' ? isUpcoming : !isUpcoming;
  });

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' }
  ];

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
            onClick={() => setIsNewAppointmentOpen(true)}
          >
            New Appointment
          </Button>
        }
      />

      {/* Filters */}
      <FilterBar 
        activeFilter={filter}
        onFilterChange={(value) => setFilter(value as 'all' | 'upcoming' | 'past')}
        options={filterOptions}
        searchPlaceholder="Search appointments..."
        onSearchChange={setSearchQuery}
        searchValue={searchQuery}
      />

      {/* Calendar View */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white/90">Calendar</h2>
          <div className="flex items-center gap-2">
            <button className="p-1 text-white/60 hover:text-white/90 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-white/80">February 2025</span>
            <button className="p-1 text-white/60 hover:text-white/90 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Add calendar component here */}
      </Card>

      {/* Appointments List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAppointments.map((appointment) => (
          <AppointmentCard key={appointment.id} appointment={appointment} />
        ))}
      </div>

      {/* New Appointment Modal */}
      <NewAppointmentModal 
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
      />
    </div>
  );
};

export default PatientAppointments;