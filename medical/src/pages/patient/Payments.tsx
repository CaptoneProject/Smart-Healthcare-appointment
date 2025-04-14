// src/pages/patient/Payments.tsx
import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Download,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Receipt,
  ChevronDown,
  X,
  Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api';

// Simple payment service with API calls
const paymentService = {
  getPatientInvoices: async (patientId) => {
    const response = await api.get(`/payments/invoices/patient/${patientId}`);
    return response.data;
  },
  
  getInvoiceDetails: async (invoiceId) => {
    const response = await api.get(`/payments/invoices/${invoiceId}`);
    return response.data;
  },
  
  processPayment: async (data) => {
    const response = await api.post('/payments/payments', data);
    return response.data;
  },

  getPaymentMethods: async () => {
    const response = await api.get('/payments/payment-methods');
    return response.data;
  },

  addPaymentMethod: async (data) => {
    const response = await api.post('/payments/payment-methods', data);
    return response.data;
  },

  deletePaymentMethod: async (id) => {
    const response = await api.delete(`/payments/payment-methods/${id}`);
    return response.data;
  },

  setDefaultPaymentMethod: async (id) => {
    const response = await api.put(`/payments/payment-methods/${id}/default`);
    return response.data;
  }
};

const PatientPayments = () => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddPaymentMethodOpen, setIsAddPaymentMethodOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form states
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load invoices and payment methods in parallel
      const [invoicesData, methodsData] = await Promise.all([
        paymentService.getPatientInvoices(user.id),
        paymentService.getPaymentMethods()
      ]);
      
      setInvoices(invoicesData);
      setPaymentMethods(methodsData);
      setError(null);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load payment information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (invoice) => {
    try {
      // First check if there are any payment methods
      if (paymentMethods.length === 0) {
        setIsAddPaymentMethodOpen(true);
        return toast.info("Please add a payment method first");
      }
      
      // Use the default payment method
      const defaultMethod = paymentMethods.find(m => m.is_default) || paymentMethods[0];
      
      // Ask for confirmation
      if (!window.confirm(`Process payment of $${invoice.remaining_amount.toFixed(2)} using card ending in ${defaultMethod.last_four}?`)) {
        return;
      }
      
      // Process the payment
      await paymentService.processPayment({
        invoiceId: invoice.id,
        amount: invoice.remaining_amount,
        paymentMethod: defaultMethod.id
      });
      
      toast.success("Payment processed successfully");
      loadData(); // Refresh data
    } catch (err) {
      toast.error("Failed to process payment. Please try again.");
    }
  };

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Validation
      if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
        return toast.error("All fields are required");
      }
      
      // Submit to API
      await paymentService.addPaymentMethod({
        cardNumber,
        expiryDate,
        cvv,
        cardholderName
      });
      
      // Reset form and close modal
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      setCardholderName('');
      setIsAddPaymentMethodOpen(false);
      
      // Reload data and show success message
      await loadData();
      toast.success("Payment method added successfully");
    } catch (err) {
      toast.error("Failed to add payment method");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePaymentMethod = async (id) => {
    try {
      if (!window.confirm("Are you sure you want to delete this payment method?")) {
        return;
      }
      
      await paymentService.deletePaymentMethod(id);
      toast.success("Payment method deleted successfully");
      loadData(); // Refresh data
    } catch (err) {
      toast.error("Failed to delete payment method");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await paymentService.setDefaultPaymentMethod(id);
      toast.success("Default payment method updated");
      loadData(); // Refresh data
    } catch (err) {
      toast.error("Failed to update default payment method");
    }
  };

  // Filter invoices based on active filter and search query
  const filteredInvoices = invoices.filter(invoice => {
    if (activeFilter !== 'all' && invoice.status.toLowerCase() !== activeFilter) {
      return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        invoice.description?.toLowerCase().includes(query) ||
        invoice.status?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Calculate stats
  const stats = {
    dueThisMonth: 0,
    paidThisMonth: 0,
    pending: 0
  };
  
  invoices.forEach(invoice => {
    const now = new Date();
    const dueDate = new Date(invoice.due_date);
    
    if (dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear()) {
      if (invoice.status.toLowerCase() !== 'paid') {
        stats.dueThisMonth += invoice.remaining_amount || invoice.amount;
      }
    }
    
    if (invoice.status.toLowerCase() === 'paid') {
      stats.paidThisMonth += invoice.amount;
    } else if (invoice.status.toLowerCase() === 'pending') {
      stats.pending += invoice.remaining_amount || invoice.amount;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Payments & Billing</h1>
          <p className="text-gray-400 mt-1">Manage your payments and view billing history</p>
        </div>
        <button
          onClick={() => setIsAddPaymentMethodOpen(true)}
          className="px-4 py-2 bg-blue-500 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Method
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-xl border border-white/10 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/5 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Due This Month</p>
              <p className="text-xl font-semibold">${stats.dueThisMonth.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900 rounded-xl border border-white/10 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/5 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Paid This Month</p>
              <p className="text-xl font-semibold">${stats.paidThisMonth.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900 rounded-xl border border-white/10 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/5 rounded-lg">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pending</p>
              <p className="text-xl font-semibold">${stats.pending.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900 rounded-xl border border-white/10 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/5 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Payment Methods</p>
              <p className="text-xl font-semibold">{paymentMethods.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-slate-900 rounded-xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold mb-4">Payment Methods</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 flex justify-center p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : paymentMethods.length > 0 ? (
            <>
              {paymentMethods.map(method => (
                <div key={method.id} className="p-4 border border-white/10 rounded-lg bg-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-6 h-6 text-blue-400" />
                      <div>
                        <p className="font-medium">{method.card_number}</p>
                        <p className="text-sm text-gray-400">Expires {method.expiry_date}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {method.is_default ? (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">Default</span>
                      ) : (
                        <button 
                          onClick={() => handleSetDefault(method.id)}
                          className="p-1 text-gray-400 hover:text-blue-400"
                          title="Set as default"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeletePaymentMethod(method.id)}
                        className="p-1 text-gray-400 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => setIsAddPaymentMethodOpen(true)}
                className="p-4 border border-dashed border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Card
              </button>
            </>
          ) : (
            <div className="col-span-2 p-4 border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center">
              <CreditCard className="w-12 h-12 text-gray-600 mb-2" />
              <p className="text-gray-400 mb-4">No payment methods added yet</p>
              <button 
                onClick={() => setIsAddPaymentMethodOpen(true)}
                className="px-4 py-2 bg-blue-500 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Add Payment Method
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['all', 'pending', 'paid', 'overdue'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
            />
          </div>
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredInvoices.length > 0 ? (
        <div className="space-y-4">
          {filteredInvoices.map(invoice => (
            <div key={invoice.id} className="bg-slate-900 rounded-xl border border-white/10 p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${
                    invoice.status.toLowerCase() === 'paid' ? 'bg-green-500/20 text-green-400' :
                    invoice.status.toLowerCase() === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                    'bg-red-500/20 text-red-400'
                  }`}>
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{invoice.description || 'Medical Service'}</h3>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status.toLowerCase() === 'paid' ? 'bg-green-500/20 text-green-400' : invoice.status.toLowerCase() === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {invoice.status}
                      </span>
                      <span className="text-xl font-semibold">${invoice.amount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {invoice.remaining_amount > 0 && (
                    <div className="text-sm text-gray-400">
                      Remaining: ${invoice.remaining_amount.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Invoice Date</p>
                  <p className="text-sm">{new Date(invoice.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Due Date</p>
                  <p className="text-sm">{new Date(invoice.due_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                <button 
                  className="flex items-center px-3 py-1.5 bg-white/5 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Details
                </button>
                
                {invoice.status.toLowerCase() !== 'paid' && invoice.remaining_amount > 0 && (
                  <button 
                    onClick={() => handlePayNow(invoice)}
                    className="flex items-center px-3 py-1.5 bg-blue-500 rounded-lg text-sm text-white hover:bg-blue-600 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay Now
                  </button>
                )}
                
                {invoice.status.toLowerCase() === 'paid' && (
                  <button className="flex items-center text-sm text-gray-400 hover:text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Download Receipt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 rounded-xl border border-white/10 p-12 flex flex-col items-center justify-center">
          <Receipt className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No invoices found</h3>
          <p className="text-gray-400 text-center max-w-md">
            {activeFilter !== 'all' 
              ? `You don't have any ${activeFilter} invoices at the moment.` 
              : "You don't have any invoices yet."}
          </p>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {isAddPaymentMethodOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddPaymentMethodOpen(false)} />
          <div className="relative w-full max-w-md mx-4 bg-slate-900 rounded-xl border border-white/10 p-6">
            <button 
              onClick={() => setIsAddPaymentMethodOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-semibold mb-4">Add Payment Method</h2>
            
            <form onSubmit={handleAddPaymentMethod} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Card Number</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Expiry Date</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">CVV</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Cardholder Name</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  placeholder="John Doe"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-500 text-white rounded-lg py-2 px-4 text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding...' : 'Add Card'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPayments;