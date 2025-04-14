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
  Star,
  X,
  Calendar,
  Printer,
  Share2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';

// Payment service with API calls
const paymentService = {
  getPatientInvoices: async (patientId) => {
    const response = await api.get(`/payments/invoices/patient/${patientId}`);
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

// Payment Method Modal Component
const AddPaymentMethodModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ cardNumber, expiryDate, cvv, cardholderName });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-slate-900 rounded-xl border border-white/10 p-6">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold mb-4">Add Payment Method</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
  );
};

// Invoice Card Component
const InvoiceCard = ({ invoice, onViewDetails, onPayNow, isHighlighted }) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'overdue':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div 
      id={`invoice-${invoice.id}`}
      className={`bg-slate-900 rounded-xl border ${
        isHighlighted 
          ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
          : 'border-white/10'
      } p-6 transition-all duration-300`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-4">
          <div className={`p-2 rounded-lg ${getStatusColor(invoice.status)}`}>
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-medium text-lg">{invoice.description || 'Medical Service'}</h3>
            <div className="flex items-center space-x-3 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
              <span className="text-xl font-semibold">${Number(invoice.amount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
        {invoice.remaining_amount > 0 && (
          <div className="text-sm text-gray-400">
            Remaining: ${Number(invoice.remaining_amount).toFixed(2)}
          </div>
        )}
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
          onClick={() => onViewDetails(invoice)}
          className="flex items-center px-3 py-1.5 bg-white/5 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
        >
          <FileText className="w-4 h-4 mr-2" />
          View Details
        </button>
        
        {invoice.status.toLowerCase() !== 'paid' && invoice.remaining_amount > 0 && (
          <button 
            onClick={() => onPayNow(invoice)}
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
  );
};

// Invoice Details Modal Component
const InvoiceDetailsModal = ({ isOpen, onClose, invoice }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  
  if (!isOpen || !invoice) return null;
  
  const handleDownload = () => {
    setIsDownloading(true);
    // Simulate download
    setTimeout(() => {
      setIsDownloading(false);
      toast.success("Receipt downloaded successfully");
    }, 1000);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleShare = () => {
    // Simple copy to clipboard function
    const text = `Invoice #${invoice.id} for ${invoice.description || 'Medical Services'}: ${Number(invoice.amount).toFixed(2)}`;
    navigator.clipboard.writeText(text);
    toast.success("Invoice details copied to clipboard");
  };

  // Helper function for formatting dates consistently
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Helper function to get status styling
  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'overdue':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl mx-4 bg-slate-900 rounded-xl border border-white/10 p-6 overflow-y-auto max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Invoice Details</h2>
            <p className="text-gray-400">#{invoice.id}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(invoice.status)}`}>
            {invoice.status}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="flex items-center text-gray-400 mb-2">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-sm">Date</span>
            </div>
            <p className="font-medium">{formatDate(invoice.created_at)}</p>
          </div>
          
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="flex items-center text-gray-400 mb-2">
              <Clock className="w-4 h-4 mr-2" />
              <span className="text-sm">Due Date</span>
            </div>
            <p className="font-medium">{formatDate(invoice.due_date)}</p>
          </div>
          
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="flex items-center text-gray-400 mb-2">
              <CreditCard className="w-4 h-4 mr-2" />
              <span className="text-sm">Payment Method</span>
            </div>
            <p className="font-medium">
              {invoice.payments && invoice.payments.length > 0 
                ? invoice.payments[0].payment_method 
                : "Not paid yet"}
            </p>
          </div>
        </div>
        
        <div className="border border-white/10 rounded-lg mb-6">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Description</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              <tr>
                <td className="py-3 px-4">
                  <p className="font-medium">{invoice.description || "Medical Services"}</p>
                </td>
                <td className="py-3 px-4 text-right font-medium">
                  ${Number(invoice.amount).toFixed(2)}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-800">
              <tr>
                <td className="py-3 px-4 text-right font-medium">Total</td>
                <td className="py-3 px-4 text-right font-medium">
                  ${Number(invoice.amount).toFixed(2)}
                </td>
              </tr>
              {Number(invoice.paid_amount) > 0 && (
                <>
                  <tr>
                    <td className="py-3 px-4 text-right font-medium text-gray-400">Paid</td>
                    <td className="py-3 px-4 text-right font-medium text-green-400">
                      ${Number(invoice.paid_amount).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-right font-medium">Balance</td>
                    <td className="py-3 px-4 text-right font-medium">
                      ${Number(invoice.remaining_amount).toFixed(2)}
                    </td>
                  </tr>
                </>
              )}
            </tfoot>
          </table>
        </div>
        
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Payment History</h3>
            <div className="space-y-3">
              {invoice.payments.map(payment => (
                <div key={payment.id} className="flex items-start p-3 bg-slate-800 rounded-lg">
                  <div className="p-2 bg-green-500/10 rounded-lg mr-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium">{payment.payment_method}</p>
                      <p className="font-medium">${Number(payment.amount).toFixed(2)}</p>
                    </div>
                    <p className="text-sm text-gray-400">
                      {formatDate(payment.payment_date)} • 
                      Transaction ID: {payment.transaction_id || 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          <div className="text-sm text-gray-400">
            Need help? Contact support at support@example.com
          </div>
          <div className="flex space-x-3">
            {invoice.status.toLowerCase() === 'paid' && (
              <>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloading ? 'Downloading...' : 'Download Receipt'}
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-600"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </button>
              </>
            )}
            <button
              onClick={handleShare}
              className="flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-600"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PatientPayments = () => {
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const highlightedInvoiceId = queryParams.get('invoiceId') ? parseInt(queryParams.get('invoiceId')) : null;
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddPaymentMethodOpen, setIsAddPaymentMethodOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
    
    // If there's a highlighted invoice and we don't have payment methods yet, show modal
    if (highlightedInvoiceId && paymentMethods.length === 0 && !loading) {
      setIsAddPaymentMethodOpen(true);
    }
  }, [user, highlightedInvoiceId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load invoices and payment methods in parallel
      const [invoicesData, methodsData] = await Promise.all([
        paymentService.getPatientInvoices(user.id),
        paymentService.getPaymentMethods()
      ]);
      
      setInvoices(invoicesData || []);
      setPaymentMethods(methodsData || []);
      setError(null);
      
      // Handle highlighted invoice
      if (highlightedInvoiceId) {
        setTimeout(() => {
          const invoiceElement = document.getElementById(`invoice-${highlightedInvoiceId}`);
          if (invoiceElement) {
            invoiceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          
          // If we have a highlighted invoice and payment methods, prompt payment
          if (methodsData && methodsData.length > 0) {
            const highlightedInvoice = invoicesData.find(inv => inv.id === highlightedInvoiceId);
            if (highlightedInvoice && highlightedInvoice.status.toLowerCase() !== 'paid') {
              handlePayNow(highlightedInvoice);
            }
          }
        }, 500);
      }
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
      if (!window.confirm(`Process payment of $${Number(invoice.remaining_amount).toFixed(2)} using card ending in ${defaultMethod.last_four}?`)) {
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

  const handleAddPaymentMethod = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Submit to API
      await paymentService.addPaymentMethod(data);
      
      // Close modal
      setIsAddPaymentMethodOpen(false);
      
      // Reload data and show success message
      await loadData();
      toast.success("Payment method added successfully");
      
      // If there's a highlighted invoice, process payment
      if (highlightedInvoiceId) {
        const invoice = invoices.find(inv => inv.id === highlightedInvoiceId);
        if (invoice && invoice.status.toLowerCase() !== 'paid') {
          handlePayNow(invoice);
        }
      }
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
        (invoice.description?.toLowerCase().includes(query) || false) ||
        (invoice.status?.toLowerCase().includes(query) || false)
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
  
  if (invoices && invoices.length > 0) {
    invoices.forEach(invoice => {
      try {
        const now = new Date();
        const dueDate = new Date(invoice.due_date);
        
        // Check for due this month
        if (dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear()) {
          if (invoice.status?.toLowerCase() !== 'paid') {
            // Ensure we have a valid number before adding
            const amount = parseFloat(invoice.remaining_amount || invoice.amount || 0);
            if (!isNaN(amount)) {
              stats.dueThisMonth += amount;
            }
          }
        }
        
        // Check for paid this month
        if (invoice.status?.toLowerCase() === 'paid') {
          const amount = parseFloat(invoice.amount || 0);
          if (!isNaN(amount)) {
            stats.paidThisMonth += amount;
          }
        } 
        // Check for pending
        else if (invoice.status?.toLowerCase() === 'pending') {
          const amount = parseFloat(invoice.remaining_amount || invoice.amount || 0);
          if (!isNaN(amount)) {
            stats.pending += amount;
          }
        }
      } catch (e) {
        console.error('Error processing invoice for stats:', e);
      }
    });
  }

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

      {/* Filters and Search */}
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
            <InvoiceCard 
              key={invoice.id}
              invoice={invoice}
              onViewDetails={(invoice) => {
                setSelectedInvoice(invoice);
                setIsInvoiceDetailsOpen(true);
              }}
              onPayNow={handlePayNow}
              isHighlighted={invoice.id === highlightedInvoiceId}
            />
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
      <AddPaymentMethodModal
        isOpen={isAddPaymentMethodOpen}
        onClose={() => setIsAddPaymentMethodOpen(false)}
        onSubmit={handleAddPaymentMethod}
        isSubmitting={isSubmitting}
      />
      
      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        isOpen={isInvoiceDetailsOpen}
        onClose={() => setIsInvoiceDetailsOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
};

export default PatientPayments;