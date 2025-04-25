import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { toast } from 'react-toastify';
import api from '../services/api';
import { ModalPortal } from './ui/ModalPortal';

interface Invoice {
  id: number;
  patient_id: number;
  patient_name: string;
  appointment_id?: number;
  amount: number;
  remaining_amount: number;
  status: string;
  due_date: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

interface InvoiceFormData {
  patient_id: number;
  appointment_id?: number;
  amount: number;
  due_date: string;
  description: string;
}

interface InvoiceManagementProps {
  userType: 'admin' | 'doctor';
  userId?: number;
}

const InvoiceManagement: React.FC<InvoiceManagementProps> = ({ userType, userId }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<InvoiceFormData>({
    patient_id: 0,
    amount: 0,
    due_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, [userType, userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch invoices based on user type
      let invoicesData = { data: [] };
      try {
        if (userType === 'doctor' && userId) {
          // For doctors, fetch only invoices related to their patients
          invoicesData = await api.get(`/payments/invoices/doctor/${userId}`);
        } else {
          // For admins, fetch all invoices
          invoicesData = await api.get('/payments/invoices');
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
        toast.error('Could not load invoices');
      }
      
      // Fetch patients for dropdown
      let patientsData = { data: [] };
      try {
        if (userType === 'admin') {
          patientsData = await api.get('/admin/patients');
        } else if (userType === 'doctor' && userId) {
          patientsData = await api.get(`/doctor/patients/${userId}`);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
      
      if (patientsData.data) {
        setPatients(patientsData.data);
      }
      
      // Fetch appointments for dropdown
      let appointmentsData = { data: [] };
      try {
        if (userType === 'doctor' && userId) {
          appointmentsData = await api.get(`/appointments/doctor/${userId}`);
        } else {
          appointmentsData = await api.get('/admin/appointments');
        }
        
        if (appointmentsData.data) {
          setAppointments(appointmentsData.data);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
      
      setInvoices(invoicesData.data || []);
    } catch (error) {
      console.error('Error in fetchData:', error);
      toast.error('An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  // Filter invoices based on active filter and search query
  const filteredInvoices = invoices.filter(invoice => {
    // Apply status filter
    if (activeFilter !== 'all' && invoice.status.toLowerCase() !== activeFilter) {
      return false;
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (invoice.patient_name?.toLowerCase().includes(query) || false) ||
        (invoice.description?.toLowerCase().includes(query) || false) ||
        (invoice.status.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  const handleCreateInvoice = async () => {
    try {
      await api.post('/payments/invoices', formData);
      setIsCreateModalOpen(false);
      toast.success('Invoice created successfully');
      fetchData(); // Refresh data
      resetForm();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    }
  };

  const handleUpdateInvoice = async () => {
    if (!selectedInvoice) return;
    
    try {
      await api.put(`/payments/invoices/${selectedInvoice.id}`, {
        amount: formData.amount,
        due_date: formData.due_date,
        description: formData.description,
        status: selectedInvoice.status
      });
      setIsEditModalOpen(false);
      toast.success('Invoice updated successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    }
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;
    
    try {
      await api.delete(`/payments/invoices/${selectedInvoice.id}`);
      setIsDeleteModalOpen(false);
      toast.success('Invoice deleted successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };

  const handleApproveInvoice = async () => {
    if (!selectedInvoice) return;
    
    try {
      await api.put(`/payments/invoices/${selectedInvoice.id}/approve`);
      setIsApproveModalOpen(false);
      toast.success('Invoice approved successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error approving invoice:', error);
      toast.error('Failed to approve invoice');
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: 0,
      amount: 0,
      due_date: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  const openEditModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      patient_id: invoice.patient_id,
      appointment_id: invoice.appointment_id,
      amount: invoice.amount,
      due_date: invoice.due_date,
      description: invoice.description || ''
    });
    setIsEditModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
          <input
            type="text"
            placeholder="Search invoices..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <select
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="all">All Invoices</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
          
          <Button 
            variant="primary" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-60 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full"></div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/90 mb-2">No Invoices Found</h3>
          <p className="text-white/60 mb-4">There are no invoices matching your search criteria.</p>
          <Button 
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="mx-auto"
          >
            Create New Invoice
          </Button>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-slate-900/50 rounded-lg overflow-hidden">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-white/5">
                  <td className="px-4 py-4 whitespace-nowrap text-white/90">{invoice.patient_name}</td>
                  <td className="px-4 py-4 text-white/90">{invoice.description || 'Medical Service'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-white/90">
                    ${parseFloat(String(invoice.amount || 0)).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-white/90">{formatDate(invoice.due_date)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                      invoice.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                      invoice.status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm flex justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openEditModal(invoice)} 
                      title="Edit Invoice"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    {/* Only show delete button for pending invoices */}
                    {invoice.status === 'pending' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setIsDeleteModalOpen(true);
                        }}
                        title="Delete Invoice"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {invoice.status === 'pending' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setIsApproveModalOpen(true);
                        }}
                        title="Approve Invoice"
                      >
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Replace Create Invoice Modal */}
      {isCreateModalOpen && (
        <ModalPortal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Invoice"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-1">Patient</label>
              <select
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                value={formData.patient_id}
                onChange={(e) => setFormData({...formData, patient_id: Number(e.target.value)})}
              >
                <option value={0}>Select a patient</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>{patient.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-white/60 text-sm mb-1">Appointment (Optional)</label>
              <select
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                value={formData.appointment_id || ""}
                onChange={(e) => setFormData({...formData, appointment_id: e.target.value ? Number(e.target.value) : undefined})}
              >
                <option value="">No Appointment</option>
                {appointments.filter(appt => appt.patient_id === formData.patient_id).map(appointment => (
                  <option key={appointment.id} value={appointment.id}>
                    {new Date(appointment.date).toLocaleDateString()} at {appointment.time.substring(0, 5)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-white/60 text-sm mb-1">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
              />
            </div>
            
            <div>
              <label className="block text-white/60 text-sm mb-1">Due Date</label>
              <input
                type="date"
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-white/60 text-sm mb-1">Description</label>
              <textarea
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleCreateInvoice}
              >
                Create Invoice
              </Button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Replace Edit Invoice Modal */}
      {isEditModalOpen && selectedInvoice && (
        <ModalPortal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Invoice"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-1">Patient</label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white/60 focus:outline-none"
                value={selectedInvoice.patient_name}
                disabled
              />
            </div>
            
            <div>
              <label className="block text-white/60 text-sm mb-1">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
              />
            </div>
            
            <div>
              <label className="block text-white/60 text-sm mb-1">Due Date</label>
              <input
                type="date"
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-white/60 text-sm mb-1">Description</label>
              <textarea
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleUpdateInvoice}
              >
                Update Invoice
              </Button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Replace Delete Invoice Modal */}
      {isDeleteModalOpen && selectedInvoice && (
        <ModalPortal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Invoice"
        >
          <div className="space-y-4">
            <div className="flex items-start p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-white/90 mb-1">
                  Are you sure you want to delete this invoice?
                </p>
                <p className="text-sm text-white/70">
                  This action cannot be undone. All payments associated with this invoice will also be deleted.
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
              <Button 
                variant="ghost"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="danger"
                onClick={handleDeleteInvoice}
              >
                Delete Invoice
              </Button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Replace Approve Invoice Modal */}
      {isApproveModalOpen && selectedInvoice && (
        <ModalPortal
          isOpen={isApproveModalOpen}
          onClose={() => setIsApproveModalOpen(false)}
          title="Approve Invoice"
        >
          <div className="space-y-4">
            <div className="flex items-start p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-white/90 mb-1">
                  Are you sure you want to approve this invoice?
                </p>
                <p className="text-sm text-white/70">
                  This will mark the invoice as approved and it will be available for payment by the patient.
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
              <Button 
                variant="ghost"
                onClick={() => setIsApproveModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                onClick={handleApproveInvoice}
              >
                Approve Invoice
              </Button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default InvoiceManagement;