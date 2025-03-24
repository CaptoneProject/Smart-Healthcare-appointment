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
      console.log('Submitting slot:', selectedSlot);
      
      if (selectedSlot.id) {
        // Update existing slot
        const updatedSlot = await doctorService.updateScheduleSlot(user.id, selectedSlot);
        console.log('Slot updated:', updatedSlot);
        
        setSchedule(prevSchedule => 
          prevSchedule.map(slot => 
            slot.id === selectedSlot.id ? normalizeSlotData(updatedSlot) : slot
          )
        );
      } else {
        // Add new slot
        const newSlot = await doctorService.addScheduleSlot(user.id, selectedSlot);
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
    console.log(`Field changed: ${name} = ${value}`); // Add logging
    
    if (!selectedSlot) return;
    
    // Force re-render by creating a completely new object
    const updatedSlot = { ...selectedSlot };
    
    if (name === 'dayOfWeek' || name === 'maxPatients') {
      (updatedSlot as any)[name] = parseInt(value, 10);
    } else {
      (updatedSlot as any)[name] = value;
    }
    
    console.log('Updated slot:', updatedSlot); // Log the new slot object
    setSelectedSlot(updatedSlot);
  };

  const normalizeSlotData = (slotData: any): TimeSlot => {
    return {
      id: slotData.id,
      dayOfWeek: slotData.day_of_week,
      startTime: slotData.start_time.substring(0, 5), // Handle "09:00:00" format
      endTime: slotData.end_time.substring(0, 5),
      breakStart: slotData.break_start ? slotData.break_start.substring(0, 5) : undefined,
      breakEnd: slotData.break_end ? slotData.break_end.substring(0, 5) : undefined,
      maxPatients: slotData.max_patients
    };
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };
  
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS.map((day, index) => {
            const daySlots = schedule.filter(slot => slot.dayOfWeek === index);
            
            return (
              <Card key={day} className="overflow-hidden">
                {/* Day header - centered alignment */}
                <div className="bg-slate-800 p-3 border-b border-white/10 text-center">
                  <h3 className="text-base font-semibold text-white/90">{day}</h3>
                </div>
                
                {/* Day content - reduced padding */}
                <div className="p-3">
                  {daySlots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[100px] py-2">
                      <p className="text-xs text-white/40 mb-2">No time slots</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSlot({
                            dayOfWeek: index,
                            startTime: '09:00',
                            endTime: '17:00',
                            breakStart: '12:00',
                            breakEnd: '13:00',
                            maxPatients: 4
                          });
                          setIsModalOpen(true);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add slot
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {daySlots.map(slot => (
                        <div 
                          key={slot.id} 
                          className="border border-white/10 rounded-md hover:border-white/20 transition-colors"
                        >
                          {/* Time header - improved text size and spacing */}
                          <div className="flex justify-between items-center p-2.5 border-b border-white/5 bg-white/5">
                            <div className="flex items-center text-white/90">
                              <Clock className="w-4 h-4 mr-2 text-blue-400 flex-shrink-0" />
                              <span className="text-sm font-medium">
                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                              </span>
                            </div>
                            <div className="flex flex-shrink-0">
                              <button 
                                onClick={() => handleEditSlot(slot)}
                                className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="p-1 rounded-md text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
                                title="Delete"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Slot details - improved text sizing and spacing */}
                          <div className="p-3 bg-transparent text-left space-y-2">
                            {slot.breakStart && slot.breakEnd && (
                              <div className="flex items-start">
                                <span className="w-2 h-2 bg-yellow-500/70 rounded-full mr-2 flex-shrink-0 mt-1" />
                                <div>
                                  <span className="text-sm text-white/60">Break: </span>
                                  <span className="text-sm text-white/50">
                                    {formatTime(slot.breakStart)} - {formatTime(slot.breakEnd)}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-start">
                              <span className="w-2 h-2 bg-green-500/70 rounded-full mr-2 flex-shrink-0 mt-1" />
                              <div>
                                <span className="text-sm text-white/60">Capacity: </span>
                                <span className="text-sm text-white/50">
                                  {slot.maxPatients} patients/hour
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add another slot button - smaller */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full flex items-center justify-center text-white/50 hover:text-white/80 border border-dashed border-white/10 hover:border-white/20 py-1"
                        onClick={() => {
                          setSelectedSlot({
                            dayOfWeek: index,
                            startTime: '09:00',
                            endTime: '17:00',
                            breakStart: '12:00',
                            breakEnd: '13:00',
                            maxPatients: 4
                          });
                          setIsModalOpen(true);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add slot
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Modal remains the same */}
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
                step="300"
                required
                lang="en"
                data-hour-cycle="h24"
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
                step="300"
                required
                lang="en"
                data-hour-cycle="h24"
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
                step="300"
                lang="en"
                data-hour-cycle="h24"
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
                step="300"
                lang="en"
                data-hour-cycle="h24"
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
            <small className="text-white/40">Time format: HH:mm (24-hour)</small>
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