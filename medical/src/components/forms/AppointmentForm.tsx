// src/components/forms/AppointmentForm.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, FileText, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { doctorService } from '../../services/api';
import { formatTime, format, DATE_FORMATS,createLocalDate } from '../../utils/dateTime';

export interface AppointmentFormData {
  doctorId: number;
  date: string;
  time: string;
  type: string;
  reason: string;
  location: string;
}

interface AppointmentFormProps {
  onSubmit: (data: AppointmentFormData) => void;
  onCancel: () => void;
  initialData?: Partial<AppointmentFormData>;
}

interface Doctor {
  id: number;
  name: string;
  specialty: string;
}

// Add this interface for doctor schedule
interface DoctorSchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ onSubmit, onCancel, initialData = {} }) => {
  const [formData, setFormData] = useState<AppointmentFormData>({
    doctorId: initialData.doctorId || 0,
    date: initialData.date || '',
    time: initialData.time || '',
    type: initialData.type || 'Consultation',
    reason: initialData.reason || '',
    location: initialData.location || 'Main Clinic'
  });
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof AppointmentFormData, string>>>({});
  const [availabilityMessage, setAvailabilityMessage] = useState<string>('');
  
  // Add state for doctor schedule
  const [doctorSchedule, setDoctorSchedule] = useState<DoctorSchedule[]>([]);
  
  // Fetch doctors on component mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await doctorService.getDoctors();
        setDoctors(response);
      } catch (error) {
        console.error('Error fetching doctors:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctors();
  }, []);
  
  // Update useEffect to fetch doctor schedule when doctor is selected
  useEffect(() => {
    if (formData.doctorId) {
      const fetchDoctorSchedule = async () => {
        try {
          const schedule = await doctorService.getSchedule(formData.doctorId);
          setDoctorSchedule(schedule);
        } catch (error) {
          console.error('Error fetching doctor schedule:', error);
        }
      };

      fetchDoctorSchedule();
    }
  }, [formData.doctorId]);
  
  // Fetch available time slots when doctor and date are selected
  useEffect(() => {
    const fetchAvailableTimeSlots = async () => {
      if (!formData.doctorId || !formData.date) return;
      
      try {
        setLoading(true);
        const response = await doctorService.getAvailableTimeSlots(formData.doctorId, formData.date);
        
        if (response.length === 0) {
          // Check if the doctor has a schedule for this day
          const scheduleResponse = await doctorService.getSchedule(formData.doctorId);
          const dayOfWeek = new Date(formData.date).getDay();
          const hasDaySchedule = scheduleResponse.some((s: any) => s.day_of_week === dayOfWeek);
          
          if (!hasDaySchedule) {
            setAvailabilityMessage('Doctor does not work on this day.');
          } else {
            setAvailabilityMessage('No available time slots on this day.');
          }
        } else {
          setAvailabilityMessage('');
        }
        
        setAvailableTimeSlots(response);
      } catch (error) {
        console.error('Error fetching available time slots:', error);
        setAvailableTimeSlots([]);
        setAvailabilityMessage('Error fetching available times. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailableTimeSlots();
  }, [formData.doctorId, formData.date]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors for this field
    if (errors[name as keyof AppointmentFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AppointmentFormData, string>> = {};
    
    if (!formData.doctorId) {
      newErrors.doctorId = 'Please select a doctor';
    }
    
    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }
    
    if (!formData.time) {
      newErrors.time = 'Please select a time';
    }
    
    if (!formData.type) {
      newErrors.type = 'Please select an appointment type';
    }
    
    if (!formData.location) {
      newErrors.location = 'Please select a location';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const appointmentData = {
      ...formData,
      date: formData.date,
      time: formData.time ? formatTime(formData.time) : '' // Add null check and use formatTime
    };

    onSubmit(appointmentData);
  };

  // Add helper function to format date with day
  const formatDateWithDay = (dateStr: string) => {
    // Use our utility to create timezone-safe dates
    const date = createLocalDate(dateStr);
    return format(date, 'EEEE, ' + DATE_FORMATS.DISPLAY.DATE);
  };

  // Update the generateAvailableDates function
  const generateAvailableDates = (): string[] => {
    if (!doctorSchedule || doctorSchedule.length === 0) return [];
    
    const dates: string[] = [];
    
    // Get today's date without time component
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the schedule days
    const scheduledDays = doctorSchedule.map(s => s.day_of_week);
    
    // Look ahead 30 days, INCLUDING today
    for (let i = 0; i <= 30; i++) {
      const currentDate = new Date();
      currentDate.setDate(today.getDate() + i);
      
      // Get day of week (0-6, Sunday-Saturday)
      const dayOfWeek = currentDate.getDay();
      
      // Check if doctor works on this day
      if (scheduledDays.includes(dayOfWeek)) {
        // Use our date utility for consistent formatting
        const dateStr = format(currentDate, DATE_FORMATS.DATABASE);
        // Always add the date if doctor works on this day
        dates.push(dateStr);
      }
    }
    
    return dates;
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        {/* Doctor Selection */}
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">
            Select Doctor
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              name="doctorId"
              value={formData.doctorId}
              onChange={handleChange}
              className={`w-full bg-white/10 border ${errors.doctorId ? 'border-red-500' : 'border-white/20'} 
                rounded-lg py-2 pl-10 pr-4 appearance-none focus:outline-none focus:border-blue-500 
                transition-colors text-white`}
            >
              <option value="">Select a doctor</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} ({doctor.specialty})
                </option>
              ))}
            </select>
          </div>
          {errors.doctorId && <p className="text-red-400 text-sm mt-1">{errors.doctorId}</p>}
        </div>
        
        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">
            Select Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              name="date"
              value={formData.date}
              onChange={handleChange}
              disabled={!formData.doctorId}
              className={`w-full bg-white/10 border ${errors.date ? 'border-red-500' : 'border-white/20'} 
                rounded-lg py-2 pl-10 pr-4 appearance-none focus:outline-none focus:border-blue-500 
                transition-colors text-white ${!formData.doctorId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="">Select a date</option>
              {generateAvailableDates().map(date => (
                <option key={date} value={date}>
                  {formatDateWithDay(date)}
                </option>
              ))}
            </select>
          </div>
          {errors.date && <p className="text-red-400 text-sm mt-1">{errors.date}</p>}
          {!formData.doctorId && (
            <p className="text-sm text-white/60 mt-1">
              Please select a doctor first to see available dates
            </p>
          )}
        </div>
        
        {/* Time Selection */}
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">
            Select Time
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              name="time"
              value={formData.time}
              onChange={handleChange}
              disabled={!formData.date}
              className={`w-full bg-white/10 border ${errors.time ? 'border-red-500' : 'border-white/20'} 
                rounded-lg py-2 pl-10 pr-4 appearance-none focus:outline-none focus:border-blue-500 
                transition-colors text-white ${!formData.date ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="">Select a time</option>
              {availableTimeSlots.map(slot => (
                <option 
                  key={slot.time} 
                  value={slot.time}
                  disabled={!slot.available}
                >
                  {formatTime(slot.time)} {/* Use formatTime here */}
                </option>
              ))}
            </select>
          </div>
          {errors.time && <p className="text-red-400 text-sm mt-1">{errors.time}</p>}
          {availabilityMessage && (
            <p className="text-yellow-400 text-sm mt-1">{availabilityMessage}</p>
          )}
        </div>
        
        {/* Appointment Type */}
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">
            Appointment Type
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={`w-full bg-white/10 border ${errors.type ? 'border-red-500' : 'border-white/20'} 
                rounded-lg py-2 pl-10 pr-4 appearance-none focus:outline-none focus:border-blue-500 
                transition-colors text-white`}
            >
              <option value="Consultation">General Consultation</option>
              <option value="Follow-up">Follow-up Visit</option>
              <option value="Check-up">Routine Check-up</option>
              <option value="Urgent">Urgent Care</option>
              <option value="Specialist">Specialist Consultation</option>
            </select>
          </div>
          {errors.type && <p className="text-red-400 text-sm mt-1">{errors.type}</p>}
        </div>
        
        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`w-full bg-white/10 border ${errors.location ? 'border-red-500' : 'border-white/20'} 
                rounded-lg py-2 pl-10 pr-4 appearance-none focus:outline-none focus:border-blue-500 
                transition-colors text-white`}
            >
              <option value="Main Clinic">Main Clinic</option>
              <option value="North Branch">North Branch</option>
              <option value="Downtown Office">Downtown Office</option>
              <option value="Medical Center">Medical Center</option>
            </select>
          </div>
          {errors.location && <p className="text-red-400 text-sm mt-1">{errors.location}</p>}
        </div>
        
        {/* Reason / Notes */}
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">
            Reason for Visit
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows={4}
            className="w-full bg-white/10 border border-white/20 rounded-lg p-4 focus:outline-none focus:border-blue-500 transition-colors text-white"
            placeholder="Please describe your symptoms or reason for the appointment..."
          />
        </div>
      </div>
      
      <div className="pt-4 border-t border-white/10 flex justify-end space-x-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Schedule Appointment'}
        </Button>
      </div>
    </form>
  );
};

export default AppointmentForm;
