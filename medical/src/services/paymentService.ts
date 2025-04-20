// src/services/paymentService.ts
import api from './api';

type PaymentData = {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
};

export const paymentService = {
  // Get all invoices for a patient
  getPatientInvoices: async (patientId: string) => {
    try {
      const response = await api.get(`/payments/invoices/patient/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },
  
  // Get detailed information about a specific invoice
  getInvoiceDetails: async (invoiceId: string) => {
    try {
      const response = await api.get(`/payments/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      throw error;
    }
  },
  
  // Process a payment for an invoice
  processPayment: async (data: PaymentData) => {
    try {
      const response = await api.post('/payments/payments', {
        invoiceId: data.invoiceId,
        amount: data.amount,
        paymentMethod: data.paymentMethod
      });
      return response.data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }
};

export default paymentService;