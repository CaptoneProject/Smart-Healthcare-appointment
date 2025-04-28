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
  Receipt,
  X,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import InvoiceTemplate from '../../components/InvoiceTemplate';
import { createRoot } from 'react-dom/client';
import { Button } from '../../components/ui/Button';

// Add some custom CSS for the animations
const animationStyles = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .animate-pulse {
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  .animation-delay-150 {
    animation-delay: 150ms;
  }
`;

// Define interfaces for the data structures
interface Invoice {
  id: number;
  patient_id: number;
  appointment_id?: number;
  amount: number;
  remaining_amount: number;
  status: string;
  due_date: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

interface PaymentMethod {
  id: number;
  user_id: number;
  card_number: string;
  last_four: string;
  expiry_date: string;
  cardholder_name: string;
  is_default: boolean;
  created_at?: string;
}

interface PaymentData {
  invoiceId: number;
  amount: number;
  paymentMethod: number;
}

interface PaymentMethodData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

interface Stats {
  dueThisMonth: number;
  paidThisMonth: number;
  pending: number;
}

// Simple payment service with API calls
const paymentService = {
  getPatientInvoices: async (patientId: number): Promise<Invoice[]> => {
    const response = await api.get(`/payments/invoices/patient/${patientId}`);
    return response.data;
  },
  
  getInvoiceDetails: async (invoiceId: number) => {
    const response = await api.get(`/payments/invoices/${invoiceId}`);
    return response.data;
  },
  
  processPayment: async (data: PaymentData) => {
    const response = await api.post('/payments/payments', data);
    return response.data;
  },

  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const response = await api.get('/payments/payment-methods');
    return response.data;
  },

  addPaymentMethod: async (data: PaymentMethodData) => {
    const response = await api.post('/payments/payment-methods', data);
    return response.data;
  },

  deletePaymentMethod: async (id: number) => {
    const response = await api.delete(`/payments/payment-methods/${id}`);
    return response.data;
  },

  setDefaultPaymentMethod: async (id: number) => {
    const response = await api.put(`/payments/payment-methods/${id}/default`);
    return response.data;
  }
};

const PatientPayments = () => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddPaymentMethodOpen, setIsAddPaymentMethodOpen] = useState<boolean>(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState<boolean>(false);
  const [paidInvoice, setPaidInvoice] = useState<Invoice | null>(null);
  const [isPaymentConfirmOpen, setIsPaymentConfirmOpen] = useState<boolean>(false);
  const [invoiceToPayNow, setInvoiceToPayNow] = useState<Invoice | null>(null);
  
  // Form states
  const [cardNumber, setCardNumber] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [cvv, setCvv] = useState<string>('');
  const [cardholderName, setCardholderName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [totalPages, setTotalPages] = useState<number>(1);

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
        paymentService.getPatientInvoices(user?.id as number),
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

  const handlePayNow = (invoice: Invoice) => {
    try {
      // First check if there are any payment methods
      if (paymentMethods.length === 0) {
        setIsAddPaymentMethodOpen(true);
        return toast.info("Please add a payment method first");
      }
      
      // Instead of window.confirm, set the states for the modal
      setInvoiceToPayNow(invoice);
      setIsPaymentConfirmOpen(true);
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Failed to process payment. Please try again.");
    }
  };

  const confirmPayment = async () => {
    if (!invoiceToPayNow) return;
    
    try {
      const defaultMethod = paymentMethods.find(m => m.is_default) || paymentMethods[0];
      const remainingAmount = parseFloat(String(invoiceToPayNow.remaining_amount || 0));
      
      // Close the confirmation modal
      setIsPaymentConfirmOpen(false);
      
      // Set processing state
      setIsProcessingPayment(true);
      
      // Process the payment (with artificial delay for UI feedback)
      setTimeout(async () => {
        try {
          await paymentService.processPayment({
            invoiceId: invoiceToPayNow.id,
            amount: remainingAmount,
            paymentMethod: defaultMethod.id
          });
          
          // Set a short delay before showing success modal
          setTimeout(() => {
            setIsProcessingPayment(false);
            setPaidInvoice({...invoiceToPayNow, status: 'paid', remaining_amount: 0});
            setIsPaymentSuccess(true);
            
            // Update local data
            loadData(); // Refresh data
          }, 500);
        } catch (err) {
          console.error("Payment error:", err);
          toast.error("Failed to process payment. Please try again.");
          setIsProcessingPayment(false);
        }
      }, 1500); // Simulate processing time
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Failed to process payment. Please try again.");
      setIsProcessingPayment(false);
    } finally {
      setInvoiceToPayNow(null);
    }
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
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

  const handleDeletePaymentMethod = async (id: number) => {
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

  const handleSetDefault = async (id: number) => {
    try {
      // First update the UI immediately without waiting for the API
      setPaymentMethods(currentMethods => 
        currentMethods.map(method => ({
          ...method,
          is_default: method.id === id
        }))
      );
      
      // Then update in the background
      await paymentService.setDefaultPaymentMethod(id);
      
      // No need to reload data - we've already updated the UI
      toast.success("Default payment method updated");
    } catch (err) {
      // If there's an error, reload from the server to ensure consistency
      toast.error("Failed to update default payment method");
      loadData();
    }
  };

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDetailsOpen(true);
  };

  const handleDownloadReceipt = async (invoice: Invoice) => {
    try {
      toast.info("Preparing your invoice...");

      // First, get more detailed invoice info including doctor name
      const invoiceDetails = await paymentService.getInvoiceDetails(invoice.id);
      
      // Create a container for the invoice template
      const invoiceContainer = document.createElement('div');
      invoiceContainer.style.position = 'absolute';
      invoiceContainer.style.left = '-9999px';
      document.body.appendChild(invoiceContainer);
      
      // Render the invoice template inside the container
      const invoiceRoot = createRoot(invoiceContainer);
      
      // Wait for invoice to render and capture as canvas
      await new Promise<void>(resolve => {
        invoiceRoot.render(
          <InvoiceTemplate 
            invoice={invoiceDetails} 
            ref={(el) => {
              if (el) {
                // Use timeout to ensure the component is fully rendered
                setTimeout(() => {
                  // Convert the HTML to canvas
                  html2canvas(el, {
                    scale: 2, // Higher scale for better quality
                    logging: false,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                  }).then(canvas => {
                    // Create PDF from canvas
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({
                      orientation: 'portrait',
                      unit: 'mm',
                      format: 'a4'
                    });
                    
                    const imgWidth = 210; // A4 width in mm
                    const imgHeight = canvas.height * imgWidth / canvas.width;
                    
                    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                    pdf.save(`invoice-${invoice.id}.pdf`);
                    
                    // Clean up
                    invoiceRoot.unmount();
                    document.body.removeChild(invoiceContainer);
                    
                    toast.success("Invoice downloaded successfully");
                    resolve();
                  }).catch(err => {
                    console.error('Error generating PDF:', err);
                    toast.error("Failed to generate invoice PDF");
                    resolve();
                  });
                }, 500);
              }
            }}
          />
        );
      });
    } catch (err) {
      console.error("Receipt download error:", err);
      toast.error("Failed to download invoice");
    }
  };

  // Filter invoices based on active filter and search query
  const filteredInvoices = invoices.filter(invoice => {
    // Convert status to lowercase once to avoid repeated operations
    const status = invoice.status?.toLowerCase() || '';
    
    if (activeFilter !== 'all' && status !== activeFilter) {
      return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (invoice.description?.toLowerCase().includes(query) || false) ||
        (status.includes(query))
      );
    }
    
    return true;
  });

  // Pagination logic
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  // Update totalPages when filtered invoices change
  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));
    setTotalPages(newTotalPages);
    
    // If current page is out of bounds after filtering, reset to page 1
    if (currentPage > newTotalPages) {
      setCurrentPage(1);
    }
  }, [filteredInvoices, itemsPerPage]); // This dependency array now correctly includes itemsPerPage

  // Pagination helper functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Calculate stats
  const stats: Stats = {
    dueThisMonth: 0,
    paidThisMonth: 0,
    pending: 0
  };
  
  invoices.forEach(invoice => {
    const now = new Date();
    const dueDate = new Date(invoice.due_date);
    
    if (dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear()) {
      if (invoice.status.toLowerCase() !== 'paid') {
        // Ensure we're adding a number
        const amount = parseFloat(String(invoice.remaining_amount || invoice.amount || 0));
        stats.dueThisMonth += amount;
      }
    }
    
    if (invoice.status.toLowerCase() === 'paid') {
      // Ensure we're adding a number
      stats.paidThisMonth += parseFloat(String(invoice.amount || 0));
    } else if (invoice.status.toLowerCase() === 'pending') {
      // Ensure we're adding a number
      const amount = parseFloat(String(invoice.remaining_amount || invoice.amount || 0));
      stats.pending += amount;
    }
  });

  return (
    <div className="space-y-6">
      {/* Custom Animation Styles */}
      <style>{animationStyles}</style>
      
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
              <p className="text-xl font-semibold">${(stats.dueThisMonth || 0).toFixed(2)}</p>
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
              <p className="text-xl font-semibold">${(stats.paidThisMonth || 0).toFixed(2)}</p>
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
              <p className="text-xl font-semibold">${(stats.pending || 0).toFixed(2)}</p>
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
          {['all', 'pending', 'approved', 'paid', 'overdue'].map((filter) => (
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
      ) : paginatedInvoices.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 py-3 border-b border-white/10 items-center">
            <div className="col-span-4">
              <p className="text-sm text-gray-400">Description</p>
            </div>
            <div className="col-span-3">
              <p className="text-sm text-gray-400">Amount</p>
            </div>
            <div className="col-span-3">
              <p className="text-sm text-gray-400">Status</p>
            </div>
            <div className="col-span-2 text-right">
              <p className="text-sm text-gray-400">Actions</p>
            </div>
          </div>
          {paginatedInvoices.map(invoice => (
            <div key={invoice.id} className="grid grid-cols-12 gap-4 py-3 border-b border-white/10 items-center">
              <div className="col-span-4">
                <p>{invoice.description || 'Medical Service'}</p>
              </div>
              <div className="col-span-3">
                <p>${parseFloat(String(invoice.amount || 0)).toFixed(2)}</p>
              </div>
              <div className="col-span-3">
                <span className={`px-2 py-1 text-xs rounded-full capitalize inline-flex items-center space-x-1 ${
                  invoice.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                  invoice.status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {invoice.status === 'paid' ? <CheckCircle className="w-3 h-3 mr-1" /> : 
                   invoice.status === 'approved' ? <Clock className="w-3 h-3 mr-1" /> : 
                   <AlertCircle className="w-3 h-3 mr-1" />}
                  {invoice.status}
                </span>
              </div>
              <div className="col-span-2 text-right">
                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleViewDetails(invoice)}
                  >
                    Details
                  </Button>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={invoice.status.toLowerCase() === 'paid'}
                    onClick={() => handlePayNow(invoice)}
                  >
                    {invoice.status.toLowerCase() === 'paid' ? 'Paid' : 'Pay Now'}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {filteredInvoices.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              <div className="text-sm text-white/60">
                Showing {filteredInvoices.length > 0 ? ((currentPage - 1) * itemsPerPage + 1) : 0} to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
              </div>
              <div className="flex items-center">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-md ${
                    currentPage === 1 
                      ? 'text-white/30 cursor-not-allowed' 
                      : 'text-white/70 hover:bg-white/10'
                  }`}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                {/* Page numbers */}
                <div className="flex items-center mx-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`w-8 h-8 mx-1 rounded-md ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-white/70 hover:bg-white/10'
                        }`}
                        aria-label={`Page ${pageNum}`}
                        aria-current={currentPage === pageNum ? 'page' : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-md ${
                    currentPage === totalPages 
                      ? 'text-white/30 cursor-not-allowed' 
                      : 'text-white/70 hover:bg-white/10'
                  }`}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                
                {/* Items per page selector */}
                <div className="flex items-center ml-4">
                  <label className="text-sm text-white/60 mr-2">Items per page:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-slate-800 border border-white/10 rounded-lg p-1 text-sm text-white/80"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>
            </div>
          )}
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

      {/* Invoice Details Modal */}
      {isViewDetailsOpen && selectedInvoice && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewDetailsOpen(false)} />
          <div className="relative w-full max-w-md mx-4 bg-slate-900 rounded-xl border border-white/10 p-6">
            <button 
              onClick={() => setIsViewDetailsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-semibold mb-4">Invoice Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  selectedInvoice.status.toLowerCase() === 'paid' ? 'bg-green-500/20 text-green-400' :
                  selectedInvoice.status.toLowerCase() === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                  'bg-red-500/20 text-red-400'
                }`}>
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">{selectedInvoice.description || 'Medical Service'}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedInvoice.status.toLowerCase() === 'paid' ? 'bg-green-500/20 text-green-400' :
                    selectedInvoice.status.toLowerCase() === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Invoice ID</p>
                  <p className="text-sm">#{selectedInvoice.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Amount</p>
                  <p className="text-sm font-medium">${parseFloat(String(selectedInvoice.amount || 0)).toFixed(2)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Invoice Date</p>
                  <p className="text-sm">{new Date(selectedInvoice.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Due Date</p>
                  <p className="text-sm">{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                </div>
                
                {selectedInvoice.remaining_amount > 0 && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-400">Remaining Amount</p>
                    <p className="text-sm font-medium">${parseFloat(String(selectedInvoice.remaining_amount || 0)).toFixed(2)}</p>
                  </div>
                )}
                
                {selectedInvoice.appointment_id && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-400">Linked Appointment</p>
                    <p className="text-sm">Appointment #{selectedInvoice.appointment_id}</p>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-white/10 flex justify-end">
                {selectedInvoice.status.toLowerCase() !== 'paid' && selectedInvoice.remaining_amount > 0 && (
                  <button 
                    onClick={() => {
                      setIsViewDetailsOpen(false);
                      handlePayNow(selectedInvoice);
                    }}
                    className="flex items-center px-3 py-1.5 bg-blue-500 rounded-lg text-sm text-white hover:bg-blue-600 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay Now
                  </button>
                )}
                
                {selectedInvoice.status.toLowerCase() === 'paid' && (
                  <button 
                    onClick={() => handleDownloadReceipt(selectedInvoice)}
                    className="flex items-center px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Receipt
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {isPaymentConfirmOpen && invoiceToPayNow && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPaymentConfirmOpen(false)} />
          <div className="relative w-full max-w-md mx-4 bg-slate-900 rounded-xl border border-white/10 p-6">
            <button 
              onClick={() => setIsPaymentConfirmOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-semibold mb-4">Confirm Payment</h2>
            
            <div className="space-y-4">
              <div className="flex items-start p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <CreditCard className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-white/90 mb-1">
                    Process payment of ${parseFloat(String(invoiceToPayNow.remaining_amount || 0)).toFixed(2)} using card ending in {(paymentMethods.find(m => m.is_default) || paymentMethods[0]).last_four}?
                  </p>
                  <p className="text-sm text-white/70">
                    {invoiceToPayNow.description || 'Medical Service'} 
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
                <button 
                  className="px-4 py-2 bg-white/10 text-white/70 rounded-lg text-sm font-medium hover:bg-white/20"
                  onClick={() => setIsPaymentConfirmOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                  onClick={confirmPayment}
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Processing Modal */}
      {isProcessingPayment && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-4 bg-slate-900 rounded-xl border border-white/10 p-6 flex flex-col items-center">
            <div className="w-20 h-20 mb-4 relative">
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-4 border-t-blue-400 border-r-transparent border-b-transparent border-l-transparent animate-spin animation-delay-150"></div>
              <div className="absolute inset-4 flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            
            <h3 className="text-xl font-medium mb-2">Processing Payment</h3>
            <p className="text-gray-400 text-center mb-4">Please wait while we process your payment...</p>
            
            <div className="w-full bg-slate-800 rounded-full h-2 mb-4">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse"></div>
            </div>
            
            <p className="text-sm text-gray-400">This will only take a moment</p>
          </div>
        </div>
      )}

      {/* Payment Success Modal */}
      {isPaymentSuccess && paidInvoice && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => {
              setIsPaymentSuccess(false);
              setPaidInvoice(null);
            }} 
          />
          <div className="relative w-full max-w-md mx-4 bg-slate-900 rounded-xl border border-white/10 p-6 flex flex-col items-center">
            <button 
              onClick={() => {
                setIsPaymentSuccess(false);
                setPaidInvoice(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-20 h-20 mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            
            <h3 className="text-xl font-medium mb-2">Payment Successful!</h3>
            <p className="text-gray-400 text-center mb-4">
              Your payment of ${parseFloat(String(paidInvoice.amount || 0)).toFixed(2)} has been processed successfully.
            </p>
            
            <div className="w-full bg-slate-800 p-4 rounded-lg mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Amount:</span>
                <span>${parseFloat(String(paidInvoice.amount || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Invoice:</span>
                <span>#{paidInvoice.id}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Date:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-green-400">Paid</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => handleDownloadReceipt(paidInvoice)}
                className="flex items-center px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </button>
              <button 
                onClick={() => {
                  setIsPaymentSuccess(false);
                  setPaidInvoice(null);
                }}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPayments;