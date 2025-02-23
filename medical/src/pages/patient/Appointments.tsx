import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MapPin, 
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  X
} from 'lucide-react';

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

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="relative backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6 shadow-xl 
      hover:bg-white/10 transition-all duration-300 group">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-white/0 pointer-events-none" />
      <div className="relative">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-medium text-lg text-white/90">{appointment.doctor}</h3>
            <p className="text-white/60">{appointment.specialty}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
            {appointment.status}
          </div>
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
          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium 
            transition-colors duration-200">
            View Details
          </button>
          {appointment.status === 'Confirmed' && (
            <button className="text-red-400 hover:text-red-300 text-sm font-medium 
              transition-colors duration-200">
              Cancel Appointment
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 backdrop-blur-xl bg-white/5 rounded-xl 
        border border-white/10 p-6 shadow-xl">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-white/0 pointer-events-none" />
        <div className="relative">
          <h2 className="text-xl font-semibold mb-4 text-white/90">Schedule New Appointment</h2>
          {/* Add appointment form here */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white/90 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const PatientAppointments: React.FC = () => {
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Appointments</h1>
          <p className="text-white/60 mt-1">Manage your appointments and schedule new ones</p>
        </div>
        <button
          onClick={() => setIsNewAppointmentOpen(true)}
          className="px-4 py-2 bg-blue-500/80 backdrop-blur-sm rounded-lg text-sm font-medium 
            hover:bg-blue-600/80 transition-all duration-300 flex items-center shadow-lg 
            border border-blue-400/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between backdrop-blur-xl bg-white/5 rounded-xl p-4 
        border border-white/10">
        <div className="flex gap-2">
          {(['all', 'upcoming', 'past'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                filter === filterOption
                  ? 'bg-blue-500/80 text-white shadow-lg border border-blue-400/20'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search appointments..."
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm 
                focus:outline-none focus:border-blue-500/50 text-white placeholder-white/40
                backdrop-blur-sm"
            />
          </div>
          <button className="p-2 text-white/60 hover:text-white/90 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar View */}
      <div className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6 shadow-xl">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-white/0 pointer-events-none" />
        <div className="relative">
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
        </div>
      </div>

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