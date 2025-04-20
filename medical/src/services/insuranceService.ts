import api from './api';

export interface InsuranceClaim {
  id: number;
  invoice_id: number;
  patient_id: number;
  insurance_provider: string;
  policy_number: string;
  claim_amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed';
  submission_date: string | null;
  approval_date: string | null;
  rejection_reason: string | null;
  reimbursement_amount: number | null;
  reimbursement_date: string | null;
  claim_reference: string | null;
  documents_urls: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  invoice_description?: string;
  invoice_amount?: number;
  invoice_status?: string;
}

export interface InsuranceClaimFormData {
  invoiceId: number;
  insuranceProvider: string;
  policyNumber: string;
  claimAmount: number;
  notes?: string;
}

export const insuranceService = {
  // Get all insurance claims for a patient
  getPatientClaims: async (patientId: number): Promise<InsuranceClaim[]> => {
    try {
      const response = await api.get(`/insurance/patient/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching insurance claims:', error);
      throw error;
    }
  },
  
  // Get a specific insurance claim
  getClaimDetails: async (claimId: number): Promise<InsuranceClaim> => {
    try {
      const response = await api.get(`/insurance/${claimId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching insurance claim:', error);
      throw error;
    }
  },
  
  // Create a new insurance claim
  createClaim: async (data: InsuranceClaimFormData): Promise<InsuranceClaim> => {
    try {
      const response = await api.post('/insurance', {
        invoiceId: data.invoiceId,
        insuranceProvider: data.insuranceProvider,
        policyNumber: data.policyNumber,
        claimAmount: data.claimAmount,
        notes: data.notes
      });
      return response.data;
    } catch (error) {
      console.error('Error creating insurance claim:', error);
      throw error;
    }
  },
  
  // Update an insurance claim
  updateClaim: async (claimId: number, data: Partial<InsuranceClaimFormData>): Promise<InsuranceClaim> => {
    try {
      const response = await api.put(`/insurance/${claimId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating insurance claim:', error);
      throw error;
    }
  },
  
  // Submit an insurance claim
  submitClaim: async (claimId: number, documentUrls: string[]): Promise<InsuranceClaim> => {
    try {
      // Convert all the S3 URLs into a format that can be stored in PostgreSQL TEXT[] column
      const response = await api.post(`/insurance/${claimId}/submit`, {
        documentUrls: documentUrls
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting insurance claim:', error);
      throw error;
    }
  },
  
  // Delete a draft insurance claim
  deleteClaim: async (claimId: number): Promise<void> => {
    try {
      await api.delete(`/insurance/${claimId}`);
    } catch (error) {
      console.error('Error deleting insurance claim:', error);
      throw error;
    }
  }
};

export default insuranceService;