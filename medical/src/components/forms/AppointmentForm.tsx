// src/components/forms/AppointmentForm.tsx
import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, FileText } from 'lucide-react';
import { Button } from '../ui/Button';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  availableDates?: string[];
}

interface AppointmentFormProps {
  onSubmit: (data: AppointmentFormData) => void;
  onCancel: () => void;
  initialData?: Partial<AppointmentFormData>;
}

export interface AppointmentFormData {
  doctorId: number;
  date: string;
  time: string;
  type: string;
  reason: string;
  location: string;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  onSubmit, 
  onCancel,
  initialData = {} 
}) => {
  const [formData, setFormData] = useState<AppointmentFormData>({
    doctorId: initialData.doctorId || 0,
    date: initialData.date || '',
    time: initialData.time || '',
    type: initialData.type || 'Consultation',
    reason: initialData.reason || '',
    location: initialData.location || 'Main Clinic'
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AppointmentFormData, string>>>({});

  // Mock data - in a real app would come from API
  const doctors: Doctor[] = [
    { id: 1, name: 'Dr. Sarah Wilson', specialty: 'General Physician' },
    { id: 2, name: 'Dr. Michael Chen', specialty: 'Cardiologist' },
    { id: 3, name: 'Dr. Emily Rodriguez', specialty: 'Dermatologist' },
    { id: 4, name: 'Dr. James Smith', specialty: 'Orthopedic Surgeon' }
  ];

  const appointmentTypes = [
    'Consultation', 
    'Follow-up', 
    'Check-up', 
    'Treatment', 
    'Procedure'
  ];

  const locations = [
    'Main Clinic',
    'North Branch',
    'Downtown Office',
    'Medical Center'
  ];

  // Available time slots (would typically come from API based on selected date and doctor)
  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is changed
    if (errors[name as keyof AppointmentFormData]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white/60 mb-1">Doctor</label>
        <div className="relative">
          <User className="w-5 h-5 text-white/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <select
            name="doctorId"
            value={formData.doctorId}
            onChange={handleChange}
            className={`w-full bg-white/10 border ${
              errors.doctorId ? 'border-red-500' : 'border-white/20'
            } rounded-lg pl-10 pr-4 py-2 text-white appearance-none focus:outline-none focus:border-blue-500`}
          >
            <option value={0} disabled>Select a doctor</option>
            {doctors.map(doctor => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} - {doctor.specialty}
              </option>
            ))}
          </select>
        </div>
        {errors.doctorId && <p className="mt-1 text-sm text-red-400">{errors.doctorId}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white/60 mb-1">Date</label>
          <div className="relative">
            <Calendar className="w-5 h-5 text-white/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`w-full bg-white/10 border ${
                errors.date ? 'border-red-500' : 'border-white/20'
              } rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500`}
            />
          </div>
          {errors.date && <p className="mt-1 text-sm text-red-400">{errors.date}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/60 mb-1">Time</label>
          <div className="relative">
            <Clock className="w-5 h-5 text-white/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <select
              name="time"
              value={formData.time}
              onChange={handleChange}
              className={`w-full bg-white/10 border ${
                errors.time ? 'border-red-500' : 'border-white/20'
              } rounded-lg pl-10 pr-4 py-2 text-white appearance-none focus:outline-none focus:border-blue-500`}
            >
              <option value="" disabled>Select a time</option>
              {timeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          {errors.time && <p className="mt-1 text-sm text-red-400">{errors.time}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white/60 mb-1">Appointment Type</label>
          <div className="relative">
            <FileText className="w-5 h-5 text-white/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={`w-full bg-white/10 border ${
                errors.type ? 'border-red-500' : 'border-white/20'
              } rounded-lg pl-10 pr-4 py-2 text-white appearance-none focus:outline-none focus:border-blue-500`}
            >
              {appointmentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          {errors.type && <p className="mt-1 text-sm text-red-400">{errors.type}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/60 mb-1">Location</label>
          <div className="relative">
            <MapPin className="w-5 h-5 text-white/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`w-full bg-white/10 border ${
                errors.location ? 'border-red-500' : 'border-white/20'
              } rounded-lg pl-10 pr-4 py-2 text-white appearance-none focus:outline-none focus:border-blue-500`}
            >
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          {errors.location && <p className="mt-1 text-sm text-red-400">{errors.location}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/60 mb-1">Reason for Visit</label>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          rows={3}
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          placeholder="Please describe your symptoms or reason for appointment..."
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
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
        >
          Schedule Appointment
        </Button>
      </div>
    </form>
  );
};

export default AppointmentForm;