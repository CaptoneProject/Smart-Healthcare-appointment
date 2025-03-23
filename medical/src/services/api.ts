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

// Helper function to format time to HH:MM for consistency
const formatTime = (timeString: string | undefined): string | undefined => {
  if (!timeString) return undefined;
  // Ensure time is in HH:MM format
  return timeString.toString().substring(0, 5);
};

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
  },
  
  // New method to verify password for medical records access
  verifyAccessPassword: async (password: string) => {
    try {
      const response = await api.post('/auth/verify-password', { password });
      return response.data;
    } catch (error) {
      console.error('Error verifying password:', error);
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
    console.log('API date before sending:', data.date);
    
    // We no longer need to adjust the date - just keep it as is
    const dateToSend = data.date;
    
    // Format time to HH:MM
    const formattedTime = formatTime(data.time) || '';
    
    console.log('Formatted appointment data to send:', {
      date: dateToSend,
      time: formattedTime
    });
    
    // Send with standardized format
    const response = await api.post('/appointments', {
      ...data,
      date: dateToSend,
      time: formattedTime
    });
    
    return response.data;
  },
  
  rescheduleAppointment: async (id: any, data: any) => {
    // Format time to HH:MM before sending
    const formattedData = {
      ...data,
      time: formatTime(data.time) || ''
    };
    
    const response = await api.put(`/appointments/${id}`, formattedData);
    return response.data;
  },
  
  cancelAppointment: async (id: any) => {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  },

  updateAppointmentStatus: async (id: number, status: string) => {
    const response = await api.put(`/appointments/${id}/status`, { status });
    return response.data;
  }
};

// Doctor scheduling services
export const doctorService = {
  setSchedule: async (doctorId: number, schedules: any[]) => {
    try {
      // Format all times in the schedules
      const formattedSchedules = schedules.map(schedule => ({
        ...schedule,
        startTime: formatTime(schedule.startTime) || '',
        endTime: formatTime(schedule.endTime) || '',
        breakStart: formatTime(schedule.breakStart),
        breakEnd: formatTime(schedule.breakEnd)
      }));
      
      const response = await api.post('/doctors/schedule', { 
        doctorId, 
        schedules: formattedSchedules 
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getSchedule: async (doctorId: number) => {
    try {
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
      // Format all time fields to HH:MM
      const formattedSlotData = {
        ...slotData,
        startTime: formatTime(slotData.startTime) || '',
        endTime: formatTime(slotData.endTime) || '',
        breakStart: formatTime(slotData.breakStart),
        breakEnd: formatTime(slotData.breakEnd)
      };
      
      console.log('Adding schedule slot with formatted times:', { 
        doctorId, 
        ...formattedSlotData 
      });
      
      const response = await api.post('/doctor/schedule-slots', {
        doctorId,
        ...formattedSlotData
      });
      
      console.log('Schedule slot added:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding schedule slot:', error);
      throw error;
    }
  },
  
  updateScheduleSlot: async (doctorId: number, slotData: any) => {
    try {
      // Format all time fields to HH:MM
      const formattedSlotData = {
        ...slotData,
        startTime: formatTime(slotData.startTime) || '',
        endTime: formatTime(slotData.endTime) || '',
        breakStart: formatTime(slotData.breakStart),
        breakEnd: formatTime(slotData.breakEnd)
      };
      
      console.log('Updating schedule slot with formatted times:', {
        doctorId,
        ...formattedSlotData
      });
      
      const response = await api.put(`/doctor/schedule-slots/${slotData.id}`, {
        doctorId,
        ...formattedSlotData
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
      console.log(`Fetching available slots for date: ${date}`);
      const response = await api.get('/doctor/available-slots', {
        params: { doctorId, date }
      });
      
      // Format the time slots consistently
      const formattedSlots = response.data.map((slot: any) => ({
        ...slot,
        time: formatTime(slot.time) || ''
      }));
      
      console.log(`Received ${formattedSlots.length} available slots`);
      return formattedSlots;
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      return [];
    }
  }
};

// Notification services
export const notificationService = {
  getNotifications: async (userId: number) => {
    try {
      const response = await api.get('/notifications', { params: { userId } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  markAsRead: async (notificationId: number) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Medical records services
export const medicalRecordsService = {
  verifyAccessPassword: async (password: string) => {
    try {
      const response = await api.post('/auth/verify-password', { password });
      return response.data;
    } catch (error) {
      console.error('Error verifying password for medical records:', error);
      throw error;
    }
  },
  
  getUserMedicalRecords: async () => {
    try {
      const response = await api.get('/medical-records');
      return response.data;
    } catch (error) {
      console.error('Error fetching medical records:', error);
      throw error;
    }
  },
  
  getMedicalRecordById: async (recordId: number) => {
    try {
      const response = await api.get(`/medical-records/${recordId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching medical record:', error);
      throw error;
    }
  },
  
  downloadRecordDocument: async (recordId: number) => {
    try {
      const response = await api.get(`/medical-records/${recordId}/download`);
      return response.data;
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }
};

// Admin services
export const adminService = {
  getDoctorCredentials: async (filter: 'pending' | 'all' = 'pending') => {
    try {
      console.log(`Fetching doctor credentials with filter: ${filter}`);
      const response = await api.get(`/admin/doctor-credentials?filter=${filter}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching doctor credentials:", error.response || error);
      throw error;
    }
  },
  
  updateDoctorStatus: async (doctorId: number, status: 'approved' | 'rejected', reason?: string) => {
    try {
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
      const response = await api.get('/admin/system-stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default api;