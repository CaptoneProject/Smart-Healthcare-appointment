import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Search, 
  CalendarDays,
  User, 
  X,
  AlertTriangle
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { toast } from 'react-hot-toast';
import prescriptionService from '../../services/prescriptionService';
import patientService from '../../services/patientService';

interface Patient {
  id: number;
  name: string;
  email: string;
}

interface PrescriptionFormData {
  patientId: number;
  medication: string;
  dosage: string;
  instructions: string;
  refillsRemaining: number;
  expiryDate: string;
  pharmacy: string;
  warnings: string;
}

const CreatePrescription: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSearch, setShowPatientSearch] = useState(true);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionFormData>({
    patientId: 0,
    medication: '',
    dosage: '',
    instructions: '',
    refillsRemaining: 0,
    expiryDate: '',
    pharmacy: '',
    warnings: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate default expiry date (30 days from now)
  useEffect(() => {
    const today = new Date();
    const in30Days = new Date(today);
    in30Days.setDate(today.getDate() + 30);
    
    setPrescriptionData(prev => ({
      ...prev,
      expiryDate: in30Days.toISOString().split('T')[0]
    }));
  }, []);
  
  // Fetch patients on search
  useEffect(() => {
    const fetchPatients = async () => {
      if (searchQuery.length < 2) return;
      
      try {
        setLoading(true);
        const data = await patientService.searchPatients(searchQuery);
        setPatients(data);
      } catch (err) {
        console.error('Error searching patients:', err);
        toast.error('Failed to search patients');
      } finally {
        setLoading(false);
      }
    };
    
    const debounce = setTimeout(() => {
      fetchPatients();
    }, 300);
    
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Get recent patients for the doctor when component mounts
  useEffect(() => {
    const fetchRecentPatients = async () => {
      if (searchQuery.length === 0) {
        try {
          setLoading(true);
          // Get the doctor's recent patients (limit to 5)
          const data = await patientService.getPatientsList();
          setPatients(data.slice(0, 5)); // Show only first 5
        } catch (err) {
          console.error('Error fetching recent patients:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchRecentPatients();
  }, []);  // Empty dependency array so it only runs once
  
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPrescriptionData(prev => ({
      ...prev,
      patientId: patient.id
    }));
    setShowPatientSearch(false);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPrescriptionData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Get current user from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Current user:', user);
      
      // Explicitly set the doctor ID
      const prescriptionPayload = {
        ...prescriptionData,
        doctorId: user.userId || user.id // Make sure to include the doctor's ID
      };
      
      console.log('Sending prescription data:', prescriptionPayload);
      
      await prescriptionService.createPrescription(prescriptionPayload);
      
      toast.success(`Prescription created for ${selectedPatient.name}`);
      
      // Reset form
      setSelectedPatient(null);
      setShowPatientSearch(true);
      setPrescriptionData({
        patientId: 0,
        medication: '',
        dosage: '',
        instructions: '',
        refillsRemaining: 0,
        expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        pharmacy: '',
        warnings: ''
      });
      
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Failed to create prescription');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Prescription"
        description="Create a new prescription for your patient"
      />
      
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        {showPatientSearch ? (
          <div className="space-y-6">
            <h2 className="text-xl font-medium text-white/90">Select Patient</h2>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="text"
                placeholder="Search patients by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-10 py-3 text-white"
              />
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {patients.length === 0 && searchQuery.length >= 2 ? (
                  <div className="text-center py-8">
                    <p className="text-white/60">No patients found</p>
                  </div>
                ) : patients.length === 0 && searchQuery.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/60">No recent patients</p>
                  </div>
                ) : searchQuery.length < 2 && searchQuery.length > 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/60">Enter at least 2 characters to search</p>
                  </div>
                ) : (
                  <>
                    {searchQuery.length === 0 && <p className="text-white/60 mb-2 ml-1">Recent patients:</p>}
                    {patients.map(patient => (
                      <div
                        key={patient.id}
                        className="flex items-center p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleSelectPatient(patient)}
                      >
                        <div className="p-2 rounded-full bg-blue-500/20 mr-3">
                          <User className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white/90 font-medium">{patient.name}</p>
                          <p className="text-white/60 text-sm">{patient.email}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selected Patient Info */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <User className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-white/90 font-medium">{selectedPatient?.name}</p>
                  <p className="text-white/60 text-sm">{selectedPatient?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPatient(null);
                  setShowPatientSearch(true);
                }}
                className="text-white/60 hover:text-white/90 p-2 rounded-full hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Medication */}
              <div>
                <label className="block text-white/70 mb-2">Medication *</label>
                <input
                  name="medication"
                  value={prescriptionData.medication}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white"
                  placeholder="Ex: Amoxicillin"
                />
              </div>
              
              {/* Dosage */}
              <div>
                <label className="block text-white/70 mb-2">Dosage *</label>
                <input
                  name="dosage"
                  value={prescriptionData.dosage}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white"
                  placeholder="Ex: 500mg twice daily"
                />
              </div>
              
              {/* Instructions */}
              <div className="md:col-span-2">
                <label className="block text-white/70 mb-2">Instructions *</label>
                <textarea
                  name="instructions"
                  value={prescriptionData.instructions}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white"
                  placeholder="Ex: Take with food, two times daily for 7 days"
                />
              </div>
              
              {/* Pharmacy */}
              <div>
                <label className="block text-white/70 mb-2">Preferred Pharmacy</label>
                <input
                  name="pharmacy"
                  value={prescriptionData.pharmacy}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white"
                  placeholder="Ex: HealthCare Pharmacy"
                />
              </div>
              
              {/* Expiry Date */}
              <div>
                <label className="block text-white/70 mb-2">Expiry Date *</label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type="date"
                    name="expiryDate"
                    value={prescriptionData.expiryDate}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-10 py-3 text-white"
                  />
                </div>
              </div>
              
              {/* Refills */}
              <div>
                <label className="block text-white/70 mb-2">Refills Allowed *</label>
                <select
                  name="refillsRemaining"
                  value={prescriptionData.refillsRemaining}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white"
                >
                  {[0, 1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              
              {/* Warnings */}
              <div className="md:col-span-2">
                <label className="block text-white/70 mb-2">Warnings / Side Effects</label>
                <textarea
                  name="warnings"
                  value={prescriptionData.warnings}
                  onChange={handleChange}
                  rows={2}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white"
                  placeholder="Ex: May cause drowsiness, do not operate heavy machinery"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <div className="flex items-center text-yellow-400">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <p className="text-sm">Double-check all information before submitting</p>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2 font-medium flex items-center
                  disabled:bg-blue-800/50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Pill className="h-4 w-4 mr-2" />
                    Create Prescription
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreatePrescription;