// src/components/modals/InvoiceDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Share2, 
  FileText, 
  CreditCard, 
  Calendar, 
  Clock,
  CheckCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatting';
import api from '../../services/api';
import { toast } from 'react-toastify';

// Simple invoice service for the modal
const invoiceService = {
  getInvoiceDetails: async (invoiceId) => {
    try {
      const response = await api.get(`/payments/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      throw error;
    }
  },
  
  downloadReceipt: async (invoiceId) => {
    try {
      const response = await api.get(`/payments/invoices/${invoiceId}/receipt`, {
        responseType: 'blob'
      });
      
      // Create a download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error downloading receipt:', error);
      throw error;
    }
  }
};

const InvoiceDetailsModal = ({ isOpen, onClose, invoiceId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  useEffect(() => {
    if (isOpen && invoiceId) {
      loadInvoiceDetails();
    }
  }, [isOpen, invoiceId]);
  
  const loadInvoiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await invoiceService.getInvoiceDetails(invoiceId);
      setInvoice(data);
    } catch (err) {
      console.error("Error loading invoice details:", err);
      setError("Failed to load invoice details. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await invoiceService.downloadReceipt(invoiceId);
      toast.success("Receipt downloaded successfully");
    } catch (err) {
      toast.error("Failed to download receipt. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleShare = () => {
    // This is just a simple mock implementation
    if (navigator.share) {
      navigator.share({
        title: `Invoice #${invoiceId}`,
        text: `View invoice details for ${invoice?.description || 'medical services'}`,
        url: window.location.href
      })
      .catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback - copy link to clipboard
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };
  
  if (!isOpen) return null;
  
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
        
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="mb-4 text-red-400">
              <FileText className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Error Loading Invoice</h3>
            <p className="text-gray-400">{error}</p>
            <button
              onClick={loadInvoiceDetails}
              className="mt-4 px-4 py-2 bg-blue-500 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : invoice ? (
          <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Invoice Details</h2>
                <p className="text-gray-400">#{invoice.id}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                invoice.status.toLowerCase() === 'paid' ? 'bg-green-500/20 text-green-400' :
                invoice.status.toLowerCase() === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                'bg-red-500/20 text-red-400'
              }`}>
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
                      {invoice.appointment && (
                        <p className="text-sm text-gray-400">
                          Appointment on {formatDate(invoice.appointment.date)}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(invoice.amount)}
                    </td>
                  </tr>
                  
                  {/* If there are specific line items, you can map through them here */}
                  {invoice.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="py-3 px-4">
                        <p className="font-medium">{item.description}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-800">
                  <tr>
                    <td className="py-3 px-4 text-right font-medium">Total</td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(invoice.amount)}
                    </td>
                  </tr>
                  {Number(invoice.paid_amount) > 0 && (
                    <>
                      <tr>
                        <td className="py-3 px-4 text-right font-medium text-gray-400">Paid</td>
                        <td className="py-3 px-4 text-right font-medium text-green-400">
                          {formatCurrency(invoice.paid_amount)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-right font-medium">Balance</td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatCurrency(invoice.remaining_amount)}
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
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        </div>
                        <p className="text-sm text-gray-400">
                          {formatDate(payment.payment_date)} • 
                          Transaction ID: {payment.transaction_id}
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
          </>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-400">No invoice details found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetailsModal;