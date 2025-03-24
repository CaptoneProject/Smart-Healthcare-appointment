import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, Edit, Trash, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/api';

// Day names for reference
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface TimeSlot {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  maxPatients: number;
}

const DoctorSchedule: React.FC = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  
  // Helper function to format time to HH:MM for consistency
  const formatTimeForStorage = (timeString: string | undefined): string | undefined => {
    if (!timeString) return undefined;
    // Ensure time is in HH:MM format
    return timeString.toString().substring(0, 5);
  };
  
  // Fetch doctor's schedule
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const data = await doctorService.getSchedule(user.id);
        // Normalize the data from the API
        const normalizedData = Array.isArray(data) ? data.map(normalizeSlotData) : [];
        setSchedule(normalizedData);
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError('Failed to load your schedule. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSchedule();
  }, [user?.id]);
  
  const handleAddSlot = () => {
    setSelectedSlot({
      dayOfWeek: 1, // Monday by default
      startTime: '09:00',
      endTime: '17:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      maxPatients: 4 // Patients per hour
    });
    setIsModalOpen(true);
  };
  
  const handleEditSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };
  
  const handleDeleteSlot = async (slotId?: number) => {
    if (!slotId || !user?.id) return;
    
    try {
      await doctorService.deleteScheduleSlot(user.id, slotId);
      setSchedule(schedule.filter(slot => slot.id !== slotId));
    } catch (err) {
      console.error('Error deleting schedule slot:', err);
      setError('Failed to delete time slot. Please try again.');
    }
  };
  
  const handleSubmitSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !user?.id) return;
    
    try {
      // Format all times to HH:MM format for consistent API submission
      const formattedSlot = {
        ...selectedSlot,
        startTime: formatTimeForStorage(selectedSlot.startTime) || '',
        endTime: formatTimeForStorage(selectedSlot.endTime) || '',
        breakStart: formatTimeForStorage(selectedSlot.breakStart),
        breakEnd: formatTimeForStorage(selectedSlot.breakEnd)
      };
      
      console.log('Submitting slot with formatted times:', formattedSlot);
      
      if (selectedSlot.id) {
        // Update existing slot
        const updatedSlot = await doctorService.updateScheduleSlot(user.id, formattedSlot);
        console.log('Slot updated:', updatedSlot);
        
        setSchedule(prevSchedule => 
          prevSchedule.map(slot => 
            slot.id === selectedSlot.id ? normalizeSlotData(updatedSlot) : slot
          )
        );
      } else {
        // Add new slot
        const newSlot = await doctorService.addScheduleSlot(user.id, formattedSlot);
        console.log('New slot added:', newSlot);
        
        setSchedule(prevSchedule => [...prevSchedule, normalizeSlotData(newSlot)]);
      }
      
      setIsModalOpen(false);
      setSelectedSlot(null);
    } catch (err) {
      console.error('Error saving schedule slot:', err);
      setError('Failed to save time slot. Please try again.');
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Field changed: ${name} = ${value}`);
    
    if (!selectedSlot) return;
    
    // Format time values if they are time fields
    if (name === 'startTime' || name === 'endTime' || name === 'breakStart' || name === 'breakEnd') {
      // Force re-render by creating a completely new object
      const updatedSlot = { ...selectedSlot };
      
      // Format time to HH:MM
      (updatedSlot as any)[name] = formatTimeForStorage(value);
      
      console.log('Updated slot with formatted time:', updatedSlot);
      setSelectedSlot(updatedSlot);
    } else if (name === 'dayOfWeek' || name === 'maxPatients') {
      // Handle numeric fields
      const updatedSlot = { ...selectedSlot };
      (updatedSlot as any)[name] = parseInt(value, 10);
      setSelectedSlot(updatedSlot);
    } else {
      // Handle other fields
      const updatedSlot = { ...selectedSlot };
      (updatedSlot as any)[name] = value;
      setSelectedSlot(updatedSlot);
    }
  };

  const normalizeSlotData = (slotData: any): TimeSlot => {
    return {
      id: slotData.id,
      dayOfWeek: slotData.day_of_week,
      startTime: formatTimeForStorage(slotData.start_time) || '', // Handle "09:00:00" format
      endTime: formatTimeForStorage(slotData.end_time) || '',
      breakStart: slotData.break_start ? formatTimeForStorage(slotData.break_start) : undefined,
      breakEnd: slotData.break_end ? formatTimeForStorage(slotData.break_end) : undefined,
      maxPatients: slotData.max_patients
    };
  };
  
  // // Function to validate time input is in correct format
  // const validateTimeFormat = (timeString: string): boolean => {
  //   const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  //   return timePattern.test(timeString);
  // };
  
  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title="Manage Your Schedule" 
        description="Set your availability to allow patients to book appointments"
        action={
          <Button 
            variant="primary" 
            size="md" 
            icon={<Plus className="w-4 h-4" />}
            onClick={handleAddSlot}
          >
            Add Time Slot
          </Button>
        }
      />
      
      {error && (
        <Card className="bg-red-500/10 border-red-500/30 p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </div>
        </Card>
      )}
      
      {isLoading ? (
        <Card className="p-6 flex justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full mb-2" />
            <p className="text-white/60">Loading your schedule...</p>
          </div>
        </Card>
      ) : schedule.length === 0 ? (
        <Card className="p-6">
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white/90 mb-2">No Schedule Set</h3>
            <p className="text-white/60 mb-6">
              You haven't set up your availability yet. Add time slots to allow patients to book appointments.
            </p>
            <Button 
              variant="primary" 
              size="md" 
              icon={<Plus className="w-4 h-4" />}
              onClick={handleAddSlot}
            >
              Add Your First Time Slot
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DAYS.map((day, index) => {
            const daySlots = schedule.filter(slot => slot.dayOfWeek === index);
            if (daySlots.length === 0) return null;
            
            return (
              <Card key={day} className="p-6">
                <h3 className="text-lg font-medium text-white/90 mb-4">{day}</h3>
                
                {daySlots.map(slot => (
                  <div key={slot.id} className="mb-4 p-4 bg-white/5 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center text-white/90">
                        <Clock className="w-4 h-4 mr-2 text-blue-400" />
                        <span>{slot.startTime} - {slot.endTime}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditSlot(slot)}
                          className="p-1 text-white/60 hover:text-white/90 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-1 text-white/60 hover:text-red-400 transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {slot.breakStart && slot.breakEnd && (
                      <div className="text-sm text-white/60 mb-1">
                        Break: {slot.breakStart} - {slot.breakEnd}
                      </div>
                    )}
                    
                    <div className="text-sm text-white/60">
                      Max {slot.maxPatients} patients per hour
                    </div>
                  </div>
                ))}
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Add/Edit Time Slot Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSlot?.id ? "Edit Time Slot" : "Add New Time Slot"}
      >
        <form onSubmit={handleSubmitSlot} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Day of Week</label>
            <select
              name="dayOfWeek"
              value={selectedSlot?.dayOfWeek || 0}
              onChange={handleChange}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
            >
              {DAYS.map((day, index) => (
                <option key={day} value={index}>{day}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">Start Time</label>
              <input
                type="time"
                name="startTime"
                value={selectedSlot?.startTime || ''}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                step="60" // 1-minute increments
                pattern="[0-9]{2}:[0-9]{2}" // Force HH:MM format
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">End Time</label>
              <input
                type="time"
                name="endTime"
                value={selectedSlot?.endTime || ''}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                step="60" // 1-minute increments
                pattern="[0-9]{2}:[0-9]{2}" // Force HH:MM format
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">Break Start (Optional)</label>
              <input
                type="time"
                name="breakStart"
                value={selectedSlot?.breakStart || ''}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                step="60" // 1-minute increments
                pattern="[0-9]{2}:[0-9]{2}" // Force HH:MM format
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">Break End (Optional)</label>
              <input
                type="time"
                name="breakEnd"
                value={selectedSlot?.breakEnd || ''}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                step="60" // 1-minute increments
                pattern="[0-9]{2}:[0-9]{2}" // Force HH:MM format
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">
              Max Patients Per Hour
            </label>
            <input
              type="number"
              name="maxPatients"
              min="1"
              max="10"
              value={selectedSlot?.maxPatients || 4}
              onChange={handleChange}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
            />
          </div>
          
          <div className="flex justify-end">
            <small className="text-white/40">Time format: HH:MM</small>
          </div>
          
          <div className="pt-4 border-t border-white/10 flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              {selectedSlot?.id ? 'Update Slot' : 'Add Slot'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DoctorSchedule;