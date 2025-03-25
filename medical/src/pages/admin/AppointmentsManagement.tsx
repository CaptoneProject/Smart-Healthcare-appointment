import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { adminService, appointmentService } from '../../services/api'; // Add appointmentService
import { Search, Filter, Download, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal'; // Add Modal
import AppointmentForm, { AppointmentFormData } from '../../components/forms/AppointmentForm'; // Add these

const AppointmentsManagement: React.FC = () => {
  // Add new states
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState<boolean>(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<any>(null);
  
  // Existing states
  const [appointments, setAppointments] = useState<any[]>([]); // Specify the type as any[]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');

  // Add this function to handle rescheduling
  const handleReschedule = (appointment: any) => {
    setAppointmentToReschedule(appointment);
    setIsRescheduleModalOpen(true);
  };

  // Add this function to handle form submission
  const handleRescheduleSubmit = async (data: AppointmentFormData) => {
    if (!appointmentToReschedule) return;

    try {
      await appointmentService.rescheduleAppointment(appointmentToReschedule.id, {
        date: data.date,
        time: data.time,
        rescheduledBy: 'admin', // Set 'admin' as the rescheduler
        oldDate: appointmentToReschedule.date,
        oldTime: appointmentToReschedule.time
      });

      // Update local state
      setAppointments((prev: any[]) => prev.map(apt => 
        apt.id === appointmentToReschedule.id
          ? { 
              ...apt,
              date: data.date,
              time: data.time,
              status: 'confirmed'
            }
          : apt
      ));

      setIsRescheduleModalOpen(false);
      
      // Refresh appointments list
      fetchAppointments();
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reschedule appointment');
    }
  };

  // Move the fetchAppointments function outside of useEffect
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllAppointments(dateFilter);
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [dateFilter]);

  // Filter appointments based on search and status
  const filteredAppointments = appointments.filter((appt: any) => {
    const matchesSearch = 
      appt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      appt.doctor_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || appt.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Appointments Management" 
        description="View and manage all appointments in the system"
      />

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search appointments..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <select
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="canceled">Canceled</option>
              <option value="completed">Completed</option>
            </select>
            
            <select
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
            
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </Button>
            
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
            
            <Button variant="primary" size="sm" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Schedule</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="h-60 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="text-left p-3 text-white/60">Date</th>
                  <th className="text-left p-3 text-white/60">Time</th>
                  <th className="text-left p-3 text-white/60">Patient</th>
                  <th className="text-left p-3 text-white/60">Doctor</th>
                  <th className="text-left p-3 text-white/60">Specialty</th>
                  <th className="text-left p-3 text-white/60">Status</th>
                  <th className="text-left p-3 text-white/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-white/60">
                      No appointments found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appt: any) => (
                    <tr key={appt.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3 text-white/90">{new Date(appt.date).toLocaleDateString()}</td>
                      <td className="p-3 text-white/90">{appt.time.substring(0, 5)}</td>
                      <td className="p-3 text-white/90">{appt.patient_name}</td>
                      <td className="p-3 text-white/90">{appt.doctor_name}</td>
                      <td className="p-3 text-white/90">{appt.specialty || 'General'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          appt.status === 'confirmed' 
                            ? 'bg-blue-500/20 text-blue-400'  // Changed from green to blue for confirmed
                            : appt.status === 'canceled'
                            ? 'bg-red-500/20 text-red-400'
                            : appt.status === 'completed'
                            ? 'bg-green-500/20 text-green-400'  // Changed from blue to green for completed
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          {/* Add reschedule button */}
                          {(appt.status === 'confirmed' || appt.status === 'scheduled') && (
                            <button 
                              className="text-white/60 hover:text-blue-400 px-2 py-1 rounded hover:bg-blue-500/10" 
                              title="Reschedule"
                              onClick={() => handleReschedule(appt)}
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Existing buttons */}
                          <button className="text-white/60 hover:text-green-400 px-2 py-1 rounded hover:bg-green-500/10" title="Confirm">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button className="text-white/60 hover:text-red-400 px-2 py-1 rounded hover:bg-red-500/10" title="Cancel">
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button className="text-white/60 hover:text-white px-2 py-1 rounded hover:bg-white/10">
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6 border-t border-white/10 pt-4">
          <div className="text-sm text-white/60">
            Showing <span className="text-white/90">{filteredAppointments.length}</span> of <span className="text-white/90">{appointments.length}</span> appointments
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 rounded border border-white/10 text-white/60 hover:bg-white/5">Previous</button>
            <button className="px-3 py-1 rounded border border-white/10 text-white bg-white/10">1</button>
            <button className="px-3 py-1 rounded border border-white/10 text-white/60 hover:bg-white/5">2</button>
            <button className="px-3 py-1 rounded border border-white/10 text-white/60 hover:bg-white/5">3</button>
            <button className="px-3 py-1 rounded border border-white/10 text-white/60 hover:bg-white/5">Next</button>
          </div>
        </div>
      </Card>

      {/* Add Reschedule Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reschedule Appointment"
      >
        {appointmentToReschedule && (
          <AppointmentForm
            onSubmit={handleRescheduleSubmit}
            onCancel={() => setIsRescheduleModalOpen(false)}
            initialData={{
              doctorId: appointmentToReschedule.doctor_id,
              type: appointmentToReschedule.type || 'Consultation',
              location: appointmentToReschedule.location || 'Main Clinic'
            }}
            hideReasonField={true} // Add this prop
          />
        )}
      </Modal>
    </div>
  );
};

export default AppointmentsManagement;