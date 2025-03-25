import axios from 'axios';

// Base URL for all API requests

// Create axios instance with the correct base URL
const api = axios.create({
  baseURL: 'http://localhost:3000/api', // This already has /api
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Ensure the api interceptor correctly sets Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Setting auth header with token');
  } else {
    console.log('No token available for request');
  }
  return config;
});

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
      await api.post('/auth/logout', { refreshToken });
      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch (error) {
      // Clear localStorage even if API call fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw error;
    }
  },
  
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
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
  
  rescheduleAppointment: async (id: any, data: any) => {
    // Using /api/appointments/:id
    const response = await api.put(`/appointments/${id}`, data);
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
  }
};

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
  }
};

export default api;
