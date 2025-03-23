import api from './api';

export const medicalRecordsService = {
  // Verify password before accessing records
  verifyAccessPassword: async (password: string) => {
    try {
      // Use the stored user email with the provided password
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (!userData.email) {
        throw new Error('User session data not found');
      }
      
      // This will throw an error if the password is incorrect
      await api.post('/auth/verify-password', {
        email: userData.email,
        password
      });
      
      return true;
    } catch (error) {
      console.error('Password verification error:', error);
      throw error;
    }
  },
  
  // Get all medical records for the logged-in user
  getUserMedicalRecords: async () => {
    try {
      const response = await api.get('/medical-records');
      return response.data;
    } catch (error) {
      console.error('Error fetching medical records:', error);
      throw error;
    }
  },
  
  // Get a specific medical record by ID
  getMedicalRecordById: async (recordId: number) => {
    try {
      const response = await api.get(`/medical-records/${recordId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching medical record ${recordId}:`, error);
      throw error;
    }
  },
  
  // Download a medical record document
  downloadRecordDocument: async (recordId: number, fileName: string) => {
    try {
      const response = await api.get(`/medical-records/${recordId}/download`, {
        responseType: 'blob'
      });
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      console.error(`Error downloading record ${recordId}:`, error);
      throw error;
    }
  }
};

export default medicalRecordsService;