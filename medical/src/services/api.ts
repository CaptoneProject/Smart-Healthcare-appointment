import axios from 'axios';
import { MedicalRecord, AccessLog, ConsentStatus, Patient } from '../types/medical';

// Base URL for all API requests

// Create axios instance with standard config
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Define retry config outside axios instance
const RETRY_CONFIG = {
  retries: 2,
  initialDelayMs: 1000
};

// Request interceptor for auth header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor with retry logic
let isRetrying = false;

api.interceptors.response.use(
  response => response,
  async (error) => {
    const config = error.config;
    
    // Avoid infinite retry loops
    if (isRetrying || config._retry) {
      return Promise.reject(error);
    }

    if (error.code === 'ECONNABORTED') {
      isRetrying = true;
      config._retry = true;

      try {
        // Handle profile endpoint specially
        if (config.url === '/auth/profile') {
          const cachedUser = localStorage.getItem('user');
          if (cachedUser) {
            return Promise.resolve({ data: JSON.parse(cachedUser) });
          }
        }

        // Implement exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, RETRY_CONFIG.initialDelayMs)
        );

        const response = await api(config);
        isRetrying = false;
        return response;
      } catch (retryError) {
        isRetrying = false;
        return Promise.reject(retryError);
      }
    }

    // Handle 401 errors
    if (error.response?.status === 401) {
      try {
        await authService.refreshToken();
        return api(error.config);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Authentication services
export const authService = {
  login: async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const response = await api.post('/auth/login', { email, password });
      
      // Store tokens in localStorage
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error: any) {
      console.error('Login error details:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      
      // Pass through the exact error message from the backend
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      
      // Fallback generic error
      throw new Error('Failed to login. Please try again.');
    }
  },
  
  register: async (userData: { email: string, password: string, name: string, userType: string }) => {
    try {
      const response = await api.post('/auth/register', userData);
      // Store tokens in localStorage
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      // Set a shorter timeout specifically for logout
      const logoutPromise = api.post('/auth/logout', { refreshToken }, { timeout: 5000 });
      
      // Clear localStorage immediately
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Wait for API call but don't block on failure
      await Promise.race([
        logoutPromise,
        new Promise(resolve => setTimeout(resolve, 2000)) // Fallback after 2s
      ]);
      
      return true;
    } catch (error) {
      console.warn('Logout API call failed, but session was cleared locally');
      return true; // Still return success since local cleanup is done
    }
  },
  
  getProfile: async () => {
    try {
      // First try to use cached data
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        // Return cached data immediately
        const userData = JSON.parse(cachedUser);
        
        // Make API call in background to update cache
        api.get('/auth/profile')
          .then(response => {
            localStorage.setItem('user', JSON.stringify(response.data));
          })
          .catch(console.warn);
          
        return userData;
      }

      // If no cached data, make the API call
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },
  
  updateProfile: async (profileData: { name?: string, currentPassword?: string, newPassword?: string }) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post('/auth/refresh-token', { refreshToken });
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      return response.data;
    } catch (error) {
      // Clear localStorage if refresh fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw error;
    }
  },

  getDoctorStatus: async (doctorId: number) => {
    try {
      const response = await api.get(`/doctor/status/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking doctor status:', error);
      throw error;
    }
  }
};

// Appointment services
export const appointmentService = {
  getAppointments: async (params: any) => {
    // Using /api/appointments
    const response = await api.get('/appointments', { params });
    return response.data;
  },
  
  createAppointment: async (data: any) => {
    // Instead, just send the date as is
    const response = await api.post('/appointments', {
      ...data,
      date: data.date // Use original date
    });

    return response.data;
  },
  
  cancelAppointment: async (id: any) => {
    // Using /api/appointments/:id
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  },

  updateAppointmentStatus: async (id: number, status: string) => {
    // Using /api/appointments/:id/status
    const response = await api.put(`/appointments/${id}/status`, { status });
    return response.data;
  },

  rescheduleAppointment: async (appointmentId: number, data: {
    date: string;
    time: string;
    rescheduledBy: 'patient' | 'doctor' | 'admin';
    oldDate?: string;
    oldTime?: string;
  }) => {
    try {
      const response = await api.put(`/appointments/${appointmentId}/reschedule`, {
        date: data.date,
        time: data.time,
        rescheduledBy: data.rescheduledBy,
        oldDate: data.oldDate,
        oldTime: data.oldTime
      });
      return response.data;
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  },

  // Get confirmed appointments with pending payments
  getConfirmedUnpaidAppointments: async (patientId: number): Promise<PendingPaymentAppointment[]> => {
    try {
      const response = await api.get(`/appointments/patient/${patientId}/confirmed-unpaid`);
      return response.data;
    } catch (error) {
      console.error('Error fetching confirmed unpaid appointments:', error);
      throw error;
    }
  }
};

// Add this interface near your other interfaces
export interface PendingPaymentAppointment {
  id: number;
  date: string;
  time: string;
  status: string;
  doctor_name: string;
  invoice_id: number;
  amount: number;
  remaining_amount: number;
  invoice_status: string;
}

// Doctor scheduling services
export const doctorService = {
  setSchedule: async (doctorId: number, schedules: any[]) => {
    try {
      const response = await api.post('/doctors/schedule', { doctorId, schedules });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getSchedule: async (doctorId: number) => {
    try {
      // Use the correct endpoint
      const response = await api.get(`/doctor/schedule/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching schedule:', error);
      throw error;
    }
  },
  
  recordVisit: async (visitData: {
    patientId: number,
    doctorId: number,
    appointmentId: number,
    symptoms: string,
    diagnosis: string,
    prescription: string,
    notes?: string,
    followUpDate?: string
  }) => {
    try {
      const response = await api.post('/visits', visitData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getPatientVisits: async (patientId: number) => {
    try {
      const response = await api.get(`/patients/${patientId}/visits`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  requestLeave: async (leaveData: {
    doctorId: number,
    startDate: string,
    endDate: string,
    leaveType: string,
    reason: string
  }) => {
    try {
      const response = await api.post('/doctors/leave', leaveData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getDailySchedule: async (doctorId: number, date: string) => {
    try {
      const response = await api.get(`/doctors/${doctorId}/daily-schedule`, { params: { date } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getDoctors: async () => {
    try {
      const response = await api.get('/doctor/doctors');
      return response.data;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  },
  
  submitCredentials: async (data: any) => {
    try {
      const response = await api.post('/doctor/credentials', data);
      
      // Update the stored user data with pending status
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.doctorStatus = 'pending';
      localStorage.setItem('user', JSON.stringify(userData));
      
      return response.data;
    } catch (error) {
      console.error('Error submitting credentials:', error);
      throw error;
    }
  },
  
  addScheduleSlot: async (doctorId: number, slotData: any) => {
    try {
      // Log the data being sent
      console.log('Adding schedule slot:', { doctorId, ...slotData });
      
      const response = await api.post('/doctor/schedule-slots', {
        doctorId,
        ...slotData
      });
      
      // Log the response
      console.log('Schedule slot added:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding schedule slot:', error);
      throw error;
    }
  },
  
  updateScheduleSlot: async (doctorId: number, slotData: any) => {
    try {
      const response = await api.put(`/doctor/schedule-slots/${slotData.id}`, {
        doctorId,
        ...slotData
      });
      return response.data;
    } catch (error) {
      console.error('Error updating schedule slot:', error);
      throw error;
    }
  },
  
  deleteScheduleSlot: async (doctorId: number, slotId: number) => {
    try {
      const response = await api.delete(`/doctor/schedule-slots/${slotId}`, {
        params: { doctorId }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting schedule slot:', error);
      throw error;
    }
  },
  
  getCredentialsStatus: async (doctorId: number) => {
    try {
      const response = await api.get(`/doctor/credentials-status/${doctorId}`);
      return {
        status: response.data.verification_status || 'pending',
        hasSubmittedCredentials: response.data.hasSubmittedCredentials
      };
    } catch (error) {
      console.error('Error checking credentials status:', error);
      return {
        status: 'pending',
        hasSubmittedCredentials: false
      };
    }
  },
  
  getAvailableTimeSlots: async (doctorId: number, date: string) => {
    try {
      const response = await api.get('/doctor/available-slots', {
        params: { doctorId, date }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      return [];
    }
  },

  getAssociatedPatients: async (userId: number) => {
    try {
      const response = await api.get(`/medical/doctor/patients/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching associated patients:', error);
      throw error;
    }
  },

  uploadMedicalRecord: async (formData: FormData): Promise<MedicalRecord> => {
    try {
      const response = await api.post('/medical/records/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading medical record:', error);
      throw error;
    }
  },

  getPatientRecords: async (patientId: number): Promise<MedicalRecord[]> => {
    try {
      const response = await api.get(`/medical/records/${patientId}`);
      return response.data;
    } catch (error: unknown) {
      // Type assertion for the error
      const apiError = error as ApiError;
      console.error('Error fetching patient records:', apiError);
      if (apiError.response?.status === 403) {
        throw new Error('Patient has not provided consent for viewing records');
      }
      throw apiError;
    }
  },

  getPatientRecordsEmergency: async (patientId: number, reason: string): Promise<MedicalRecord[]> => {
    try {
      const response = await api.post('/medical/records/emergency-access', {
        patientId,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error accessing emergency records:', error);
      throw error;
    }
  },

  // Get patient invoices for a specific doctor
  getPatientInvoices: async (doctorId: number) => {
    try {
      const response = await api.get(`/payments/invoices/doctor/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor patient invoices:', error);
      throw error;
    }
  }
};

// Add this interface
export interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type: string;
  related_id?: number;
}

// Update the notification service
export const notificationService = {
  getNotifications: async (userId: number): Promise<Notification[]> => {
    try {
      const response = await api.get('/notifications', { 
        params: { userId } 
      });
      
      // Add validation
      if (!response.data) {
        console.error('No data received from notifications endpoint');
        return [];
      }

      // Ensure we got an array
      if (!Array.isArray(response.data)) {
        console.error('Expected array of notifications but got:', typeof response.data);
        return [];
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error; // Let component handle the error
    }
  },
  
  markAsRead: async (notificationId: number) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },
  
  markAllAsRead: async (userId: number) => {
    try {
      const response = await api.put('/notifications/read-all', { userId });
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
};

// Admin services
export const adminService = {
  getDoctorCredentials: async (filter: 'pending' | 'all' = 'pending') => {
    try {
      console.log(`Fetching doctor credentials with filter: ${filter}`);
      // Remove the duplicate /api prefix
      const response = await api.get(`/admin/doctor-credentials?filter=${filter}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching doctor credentials:", error.response || error);
      throw error;
    }
  },
  
  updateDoctorStatus: async (doctorId: number, status: 'approved' | 'rejected', reason?: string) => {
    try {
      // Fix: Change from doctor-credentials/:id to doctor-credentials/status/:id
      const response = await api.put(`/admin/doctor-credentials/status/${doctorId}`, {
        status,
        reason
      });
      return response.data;
    } catch (error) {
      console.error("Error updating doctor status:", error);
      throw error;
    }
  },
  
  getSystemStats: async () => {
    try {
      // Remove the duplicate /api prefix
      const response = await api.get('/admin/system-stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getDashboardStats: async () => {
    const response = await api.get('/admin/system-stats');
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  getRecentActivities: async () => {
    try {
      const response = await api.get('/admin/activities');
      return response.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  },

  getAllAppointments: async (dateFilter = 'today') => {
    const response = await api.get(`/admin/appointments?dateFilter=${dateFilter}`);
    return response.data;
  },

  getTodayAppointments: async () => {
    const response = await api.get('/admin/today-appointments');
    return response.data;
  },

  getAllActivities: async () => {
    try {
      const response = await api.get('/admin/activities');
      return response.data;
    } catch (error) {
      console.error('Error fetching all activities:', error);
      throw error;
    }
  },

  deleteUser: async (userId: number) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  getPatientRecordsEmergency: async (patientId: number, reason: string): Promise<MedicalRecord[]> => {
    const response = await api.post('/admin/medical-records/emergency-access', {
      patientId,
      reason
    });
    return response.data;
  },

  getMedicalRecordAccessLogs: async (recordId: number): Promise<AccessLog[]> => {
    const response = await api.get(`/admin/medical-records/${recordId}/access-logs`);
    return response.data;
  },

  getAllMedicalRecords: async (): Promise<MedicalRecord[]> => {
    const response = await api.get('/admin/medical-records');
    return response.data;
  },

  updateRecordAccess: async (recordId: number, action: 'restrict' | 'unrestrict') => {
    const response = await api.put(`/admin/medical-records/${recordId}/access`, { action });
    return response.data;
  },

  modifyMedicalRecord: async (recordId: number, updates: Partial<MedicalRecord>) => {
    const response = await api.put(`/admin/medical-records/${recordId}`, updates);
    return response.data;
  },
  
  deleteRecord: async (recordId: number, reason: string) => {
    const response = await api.delete(`/admin/medical-records/${recordId}`, {
      data: { reason }
    });
    return response.data;
  },

  // Add new analytics methods here
  getRecordAnalytics: async () => {
    const response = await api.get('/admin/medical-records/analytics');
    return response.data as {
      totalRecords: number;
      recordsByType: Record<string, number>;
      recordsByDepartment: Record<string, number>;
      accessFrequency: {
        daily: number;
        weekly: number;
        monthly: number;
      };
    };
  },
  
  getAccessPatterns: async () => {
    const response = await api.get('/admin/medical-records/access-patterns');
    return response.data as {
      mostAccessedRecords: Array<{
        recordId: number;
        accessCount: number;
        lastAccessed: string;
      }>;
      emergencyAccessCount: number;
      unauthorizedAttempts: number;
      peakAccessTimes: Record<string, number>;
    };
  },

  // Add reporting method
  getAccessSummaryReport: async (params: {
    startDate?: string;
    endDate?: string;
    recordType?: string;
    department?: string;
  }) => {
    const response = await api.get('/admin/reports/access-summary', { params });
    return response.data;
  },

  getRecordsWithEmergencyAccess: async (): Promise<MedicalRecord[]> => {
    const response = await api.get('/admin/medical-records/emergency');
    return response.data;
  },

  // Get all invoices (admin only)
  getAllInvoices: async () => {
    try {
      const response = await api.get('/payments/invoices');
      return response.data;
    } catch (error) {
      console.error('Error fetching all invoices:', error);
      throw error;
    }
  },
  
  // Get all patients for invoice creation
  getAllPatients: async () => {
    try {
      const response = await api.get('/admin/patients');
      return response.data;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }
};

// Medical services
interface ApiError {
  response?: {
    status?: number;
    data?: {
      error?: string;
    };
  };
  message: string;
}

export const medicalService = {
  uploadRecord: async (data: FormData): Promise<MedicalRecord> => {
    try {
      const response = await api.post('/medical/records/upload', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error uploading medical record:', apiError);
      throw apiError;
    }
  },
  
  getPatientRecords: async (patientId: number): Promise<MedicalRecord[]> => {
    try {
      console.log('Fetching records for patient:', patientId);
      const response = await api.get(`/medical/records/${patientId}`);
      console.log('Received records:', response.data);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error fetching patient records:', apiError);
      if (apiError.response?.status === 403) {
        throw new Error('Patient has not provided consent for viewing records');
      }
      throw apiError;
    }
  },
  
  getAssociatedPatients: async (doctorId: number): Promise<Patient[]> => {
    try {
      const response = await api.get(`/medical/doctor/patients/${doctorId}`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error fetching associated patients:', apiError);
      throw apiError;
    }
  },
  
  getRecordAccessLogs: async (recordId: number) => {
    const response = await api.get(`/medical/records/${recordId}/access-logs`);
    return response.data;
  },

  getConsentStatus: async (): Promise<ConsentStatus> => {
    const response = await api.get('/medical/consent');
    return response.data;
  },

  updateConsent: async (consent: boolean): Promise<ConsentStatus> => {
    const response = await api.post('/medical/consent', { consent });
    return response.data;
  },

  getOwnRecords: async (): Promise<MedicalRecord[]> => {
    try {
      // Use /records/patient instead of /records/{userId}
      const response = await api.get('/medical/records/patient');
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error fetching own records:', apiError);
      // Add this return statement to fix the TypeScript error
      return [];  // Return empty array on error
    }
  },

  getRestrictedRecordsCount: async (patientId: number): Promise<number> => {
    try {
      const response = await api.get(`/medical/patients/${patientId}/restricted-count`);
      return response.data.count;
    } catch (error) {
      console.error('Error fetching restricted records count:', error);
      return 0; // Default to 0 if there's an error
    }
  },

  getPatientRecordsEmergency: async (patientId: number, reason: string): Promise<MedicalRecord[]> => {
    try {
      const response = await api.post('/medical/records/emergency-access', {
        patientId,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error accessing emergency records:', error);
      throw error;
    }
  },
  
  // Add the getSignedUrl method here
  getSignedUrl: async (recordId: number, preview: boolean = true) => {
    try {
      const response = await api.get(`/medical/records/${recordId}/signed-url?preview=${preview}`);
      return response.data;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }
  }
};

// Add these methods to invoiceService
export const invoiceService = {
  // Create a new invoice
  createInvoice: async (data: any) => {
    try {
      const response = await api.post('/payments/invoices', data);
      return response.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },
  
  // Update an existing invoice
  updateInvoice: async (id: number, data: any) => {
    try {
      const response = await api.put(`/payments/invoices/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  },
  
  // Delete an invoice
  deleteInvoice: async (id: number) => {
    try {
      const response = await api.delete(`/payments/invoices/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  },
  
  // Approve an invoice
  approveInvoice: async (id: number) => {
    try {
      const response = await api.put(`/payments/invoices/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error('Error approving invoice:', error);
      throw error;
    }
  }
};

export default api;
