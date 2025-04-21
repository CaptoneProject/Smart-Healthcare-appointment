import api from './api';
 // Add this import

export interface Patient {
  id: number;
  name: string;
  email: string;
  dob?: string;
  gender?: string;
}

const patientService = {
  // Update this method to search only within doctor's affiliated patients
  searchPatients: async (query: string): Promise<Patient[]> => {
    // If the query is too short, return empty array
    if (!query || query.length < 2) return [];
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const doctorId = user?.id;
    
    // If user is a doctor, search only among their patients
    if (user?.userType === 'doctor' && doctorId) {
      try {
        // Get all the doctor's patients first
        const response = await api.get(`/doctors/patients/${doctorId}`);
        const allPatients = response.data;
        
        // Then filter them by the search query (client-side search)
        return allPatients.filter((patient: Patient) => 
          patient.name.toLowerCase().includes(query.toLowerCase()) || 
          patient.email.toLowerCase().includes(query.toLowerCase())
        );
      } catch (error) {
        console.error('Error searching doctor patients:', error);
        throw error;
      }
    } else {
      // For admin users or fallback, use the general search
      const response = await api.get(`/patients/search?query=${encodeURIComponent(query)}`);
      return response.data;
    }
  },
  
  getPatientById: async (id: number): Promise<Patient> => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },
  
  getPatientsList: async (): Promise<Patient[]> => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const doctorId = user?.userId || user?.id; // Handle both id and userId
    
    if (user?.userType === 'doctor' && doctorId) {
      try {
        // First try to get the doctor's affiliated patients
        const response = await api.get(`/doctors/patients/${doctorId}`);
        
        // If empty, try to search for all patients instead
        if (!response.data || response.data.length === 0) {
          try {
            const allResponse = await api.get('/doctors/all-patients');
            return allResponse.data || [];
          } catch (innerError) {
            console.error('Error fetching all patients:', innerError);
            return []; // Return empty array on error
          }
        }
        
        return response.data || [];
      } catch (error) {
        console.error('Error fetching doctor patients:', error);
        return []; // Return empty array on error
      }
    } else {
      // For admins or others
      try {
        const response = await api.get('/patients');
        return response.data || [];
      } catch (error) {
        console.error('Error fetching all patients:', error);
        return []; // Return empty array on error
      }
    }
  }
};

export default patientService;