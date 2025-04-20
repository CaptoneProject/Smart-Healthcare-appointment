import { forwardRef, ForwardRefRenderFunction } from 'react';
import { formatDate } from '../utils/dateTime';

interface InvoiceTemplateProps {
  invoice: {
    id: number;
    description?: string;
    amount: number;
    created_at: string;
    due_date: string;
    status: string;
    patient_name?: string;
    doctor_name?: string;
  };
}

// Use ForwardRefRenderFunction to correctly type a component that receives a ref
const InvoiceTemplateBase: ForwardRefRenderFunction<HTMLDivElement, InvoiceTemplateProps> = 
  ({ invoice }, ref) => {
  const currentDate = new Date().toLocaleDateString();
  
  // Define color variables using standard hex instead of oklch
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'paid':
        return '#22c55e'; // Standard hex green 
      case 'approved':
        return '#3b82f6'; // Standard hex blue
      default:
        return '#eab308'; // Standard hex yellow
    }
  };
  
  return (
    <div 
      ref={ref} 
      className="bg-white text-black p-6 max-w-2xl mx-auto" 
      style={{ 
        minHeight: '800px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Header */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem', 
          paddingBottom: '1rem', 
          borderBottom: '1px solid #e5e7eb' 
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#2563eb' }}>
            SMART HEALTHCARE
          </h1>
          <p style={{ color: '#6b7280' }}>Your Health, Our Priority</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#374151' }}>
            INVOICE
          </h2>
          <p style={{ color: '#6b7280' }}>#{invoice.id}</p>
          <p style={{ color: '#6b7280' }}>{currentDate}</p>
        </div>
      </div>
      
      {/* Address Information */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>From:</h3>
          <p style={{ color: '#4b5563' }}>Smart Healthcare Medical Center</p>
          <p style={{ color: '#4b5563' }}>123 Medical Avenue</p>
          <p style={{ color: '#4b5563' }}>Health City, HC 10001</p>
          <p style={{ color: '#4b5563' }}>contact@smarthealthcare.com</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h3 style={{ fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}>Bill To:</h3>
          <p style={{ color: '#4b5563' }}>{invoice.patient_name || 'Patient'}</p>
          <p style={{ color: '#4b5563' }}>Patient ID: {invoice.id}</p>
          <p style={{ color: '#4b5563' }}>Date of Payment: {formatDate(invoice.created_at)}</p>
          <p style={{ color: '#4b5563' }}>Due Date: {formatDate(invoice.due_date)}</p>
        </div>
      </div>
      
      {/* Service Details */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: 'bold', color: '#374151', marginBottom: '1rem' }}>Service Details:</h3>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db' }}>Description</th>
              <th style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db' }}>Provider</th>
              <th style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db' }}>
                {invoice.description || 'Medical Service'}
              </td>
              <td style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db' }}>
                {invoice.doctor_name || 'Healthcare Provider'}
              </td>
              <td style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', textAlign: 'right' }}>
                ${parseFloat(String(invoice.amount || 0)).toFixed(2)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <td 
                style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', fontWeight: 'bold' }} 
                colSpan={2}
              >
                Total
              </td>
              <td 
                style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', textAlign: 'right', fontWeight: 'bold' }}
              >
                ${parseFloat(String(invoice.amount || 0)).toFixed(2)}
              </td>
            </tr>
            <tr style={{ backgroundColor: '#eff6ff' }}>
              <td 
                style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', fontWeight: 'bold' }} 
                colSpan={2}
              >
                Status
              </td>
              <td 
                style={{ 
                  padding: '0.5rem 1rem', 
                  border: '1px solid #d1d5db', 
                  textAlign: 'right', 
                  fontWeight: 'bold',
                  color: getStatusColor(invoice.status)
                }}
              >
                {invoice.status.toUpperCase()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {/* Payment Information */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>Payment Information:</h3>
        <p style={{ color: '#4b5563', marginBottom: '0.25rem' }}>
          Please make payment by the due date: {formatDate(invoice.due_date)}
        </p>
        <p style={{ color: '#4b5563' }}>Payment Method: Credit Card / Bank Transfer</p>
      </div>
      
      {/* Thank You Note */}
      <div 
        style={{ 
          textAlign: 'center', 
          marginBottom: '2rem', 
          padding: '1rem', 
          backgroundColor: '#eff6ff', 
          borderRadius: '0.5rem' 
        }}
      >
        <p style={{ color: '#374151' }}>Thank you for choosing Smart Healthcare for your medical needs.</p>
        <p style={{ color: '#374151' }}>We appreciate your prompt payment.</p>
      </div>
      
      {/* Footer */}
      <div 
        style={{ 
          textAlign: 'center', 
          color: '#6b7280', 
          fontSize: '0.875rem', 
          marginTop: '2rem', 
          paddingTop: '1rem', 
          borderTop: '1px solid #e5e7eb' 
        }}
      >
        <p>Smart Healthcare Medical Center • 123 Medical Avenue • Health City, HC 10001</p>
        <p>Phone: (555) 123-4567 • Email: billing@smarthealthcare.com</p>
        <p>www.smarthealthcare.com</p>
      </div>
    </div>
  );
};

// Create the forwarded ref component
const InvoiceTemplate = forwardRef(InvoiceTemplateBase);

export default InvoiceTemplate;