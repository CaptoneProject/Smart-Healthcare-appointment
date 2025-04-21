import api from './api';

export type PrescriptionStatus = 'Active' | 'Expired' | 'Refill Requested';

export interface Prescription {
  id: number;
  medication: string;
  dosage: string;
  status: PrescriptionStatus;
  refillsRemaining?: number;  // camelCase version
  refills_remaining?: number; // snake_case version from database
  doctor: string;
  doctor_id?: number;
  patient_id?: number;
  prescribedDate?: string;
  expiryDate?: string;
  lastFilled?: string;
  pharmacy?: string;
  instructions?: string;
  warnings?: string;
  
  // Also include possible snake_case versions that might come from DB
  prescribed_date?: string;
  expiry_date?: string;
  last_filled?: string;
}

export interface RefillRequest {
  prescriptionId: number;
  pharmacy: string;
  notes?: string;
}

export interface RefillRequestResponse {
  id: number;
  prescription_id: number;
  patient_id: number;
  pharmacy: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
  processed_by?: number;
  medication: string;
  dosage: string;
  // Support both patientName and patient_name
  patientName?: string;
  patient_name?: string;
  // Support both requestedDate and requested_date
  requestedDate?: string;
  requested_date?: string;
  doctor_name?: string;  // Name of the doctor who processed the request
  processed_date?: string; // Formatted date when the request was processed
}

const prescriptionService = {
  // Get all prescriptions for current patient
  getPatientPrescriptions: async (): Promise<Prescription[]> => {
    try {
      console.log("Making request to /prescriptions/patient/current");
      // Changed from /api/prescriptions/patient/current to just /prescriptions/patient/current
      const response = await api.get('/prescriptions/patient/current');
      console.log("Raw prescription data:", JSON.stringify(response.data, null, 2));
      return response.data || [];
    } catch (error: any) { // Type the error as any to allow property access
      console.error('Error fetching prescriptions:', error);
      // Check response status
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
  
  // Get prescriptions for a specific patient (doctor access)
  getPatientPrescriptionsById: async (patientId: number): Promise<Prescription[]> => {
    try {
      const response = await api.get(`/prescriptions/patient/${patientId}`);
      return response.data || [];
    } catch (error: any) {
      console.error(`Error fetching prescriptions for patient ${patientId}:`, error);
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
  
  // Request a prescription refill
  requestRefill: async (refillData: RefillRequest): Promise<{ message: string; id: number }> => {
    try {
      // Debug info logging
      console.log("Auth debug - Sending refill request with token");
      
      // Remove the /api prefix from the URL path
      const response = await api.post('/prescriptions/refill', refillData);
      console.log("Refill request successful, response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error requesting refill:', error);
      
      // Check if error is an authentication issue
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('Authentication error. Token may be invalid or expired.');
        // Log token details
        const tokenDetails = {
          localstorage: localStorage.getItem('token')?.substring(0, 10) + '...',
          sessionstorage: sessionStorage.getItem('token')?.substring(0, 10) + '...'
        };
        console.log('Token details:', tokenDetails);
        
        throw new Error('Authentication failed. Please log in again.');
      }
      
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
  
  // Get pending refill requests for doctor
  getDoctorRefillRequests: async (): Promise<RefillRequestResponse[]> => {
    try {
      const response = await api.get('/prescriptions/refill/doctor/current');
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching doctor refill requests:', error);
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
  
  // Get refill request history for patient
  getPatientRefillHistory: async (): Promise<RefillRequestResponse[]> => {
    try {
      const response = await api.get('/prescriptions/refill/patient/current');
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching patient refill history:', error);
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
  
  // Approve refill request
  approveRefill: async (refillId: number): Promise<{ message: string }> => {
    try {
      const response = await api.put(`/prescriptions/refill/${refillId}/approve`);
      return response.data;
    } catch (error: any) {
      console.error(`Error approving refill ${refillId}:`, error);
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
  
  // Reject refill request
  rejectRefill: async (refillId: number, reason: string): Promise<{ message: string }> => {
    try {
      const response = await api.put(`/prescriptions/refill/${refillId}/reject`, { reason });
      return response.data;
    } catch (error: any) {
      console.error(`Error rejecting refill ${refillId}:`, error);
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
  
  // Create new prescription (doctor only)
  createPrescription: async (prescriptionData: any): Promise<{ message: string; id: number }> => {
    try {
      const response = await api.post('/prescriptions', prescriptionData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
};

export default prescriptionService;