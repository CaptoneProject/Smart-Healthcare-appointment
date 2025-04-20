import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Eye, Plus, Search, FileText, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { medicalService } from '../../services/api';
import MedicalRecordForm from '../../components/forms/MedicalRecordForm';
import { RecordDetailsModal } from '../../components/modals/RecordDetailsModal';
import { AccessHistoryModal } from '../../components/modals/AccessHistoryModal';
import { MedicalRecord } from '../../types/medical';
import { toast } from 'react-toastify';

interface Patient {
  id: number;
  name: string;
  email: string;
  consent_given: boolean;
  records?: MedicalRecord[];
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const DoctorMedicalRecords: React.FC = () => {
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [patientRecords, setPatientRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewRecordsModalOpen, setIsViewRecordsModalOpen] = useState(false);
  const [isRecordDetailsOpen, setIsRecordDetailsOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [isAccessHistoryOpen, setIsAccessHistoryOpen] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [showEmergencyPatientModal, setShowEmergencyPatientModal] = useState(false);
  const [restrictedRecordsCount, setRestrictedRecordsCount] = useState<Record<number, number>>({});
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedRecordTitle, setUploadedRecordTitle] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const data = await medicalService.getAssociatedPatients(user.id);
        setPatients(data);

        // Get restricted records count for each patient
        const restrictedCounts: Record<number, number> = {};
        for (const patient of data) {
          try {
            const count = await medicalService.getRestrictedRecordsCount(patient.id);
            restrictedCounts[patient.id] = count;
          } catch (err) {
            console.error(`Error fetching restricted records count for patient ${patient.id}:`, err);
          }
        }
        setRestrictedRecordsCount(restrictedCounts);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Failed to load patient list');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [user?.id]);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewRecordDetails = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setIsRecordDetailsOpen(true);
  };

  const handleViewFileUrl = async (recordId: number, fileUrl: string): Promise<void> => {
    try {
      if (!fileUrl) {
        toast.error('No file URL available');
        return;
      }
      
      if (!recordId) {
        toast.error('Record ID not available');
        return;
      }
      
      // First try the signed URL approach
      try {
        const response = await medicalService.getSignedUrl(recordId, true);
        if (response && response.signedUrl) {
          // Open the signed URL in a new tab
          window.open(response.signedUrl, '_blank');
          return;
        }
      } catch (e) {
        console.warn('Failed to get signed URL, falling back to direct URL:', e);
      }
      
      // Fallback: Try to open the file URL directly
      // This helps if the signed URL generation is failing
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Error opening file:', error);
      toast.error('Failed to open file for preview');
    }
  };

  const handleDownloadRecord = async (record: MedicalRecord): Promise<void> => {
    try {
      if (!record.id) {
        toast.error('Record ID not available');
        return;
      }
      
      // Request a signed URL for downloading the file - set preview to false for download
      const response = await medicalService.getSignedUrl(record.id, false);
      if (response && response.signedUrl) {
        // Create an invisible anchor element to trigger download
        const link = document.createElement('a');
        link.href = response.signedUrl;
        // Set download attribute to force download instead of opening in browser
        link.setAttribute('download', `${record.title || 'medical-record'}.${getFileExtension(record.file_url)}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.error('Failed to generate download URL');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  // Helper function to extract file extension
  const getFileExtension = (fileUrl: string): string => {
    if (!fileUrl) return 'pdf';
    const parts = fileUrl.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'pdf';
  };

  const handleUpload = async (formData: FormData) => {
    try {
      setLoading(true);
      
      // Get the record title from the form data for success message
      let recordTitle = 'Medical record';
      try {
        const titleEntry = formData.get('title');
        if (titleEntry && typeof titleEntry === 'string') {
          recordTitle = titleEntry;
        }
      } catch (e) {
        console.warn('Could not extract title from form data:', e);
      }
      
      // Upload the record
      await medicalService.uploadRecord(formData);

      if (selectedPatient) {
        const records = await medicalService.getPatientRecords(selectedPatient.id);
        setPatientRecords(records);
      }
      
      // First close the upload modal
      setIsUploadModalOpen(false);
      
      // Then set data for success modal and show it
      setUploadedRecordTitle(recordTitle);
      setUploadSuccess(true);
      
    } catch (error) {
      console.error('Error uploading record:', error);
      setError('Failed to upload medical record');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecords = async (patientId: number) => {
    try {
      setLoading(true);
      setError(null);
      // Find and set the selected patient before fetching records
      const patient = patients.find(p => p.id === patientId);
      setSelectedPatient(patient || null);

      const records = await medicalService.getPatientRecords(patientId);
      setPatientRecords(records);
      setIsViewRecordsModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch records');
      setPatientRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAccessHistory = async (recordId: number) => {
    try {
      setAccessLoading(true);
      console.log('Fetching access logs for record:', recordId);
      const logs = await medicalService.getRecordAccessLogs(recordId);
      setAccessLogs(logs);
      setIsAccessHistoryOpen(true);
    } catch (err) {
      console.error('Error fetching access logs:', err);
      toast.error('Failed to fetch access history');
    } finally {
      setAccessLoading(false);
    }
  };

  const handleEmergencyAccess = async (recordId: number) => {
    setShowEmergencyModal(true);
    setSelectedRecordId(recordId);
  };

  const handleEmergencyPatientSelect = async (patientId: number) => {
    try {
      setSelectedPatientId(patientId);
      setShowEmergencyPatientModal(false);
      setEmergencyReason('');
      setShowEmergencyModal(true);
    } catch (error) {
      console.error('Error selecting patient for emergency access:', error);
    }
  };

  const confirmEmergencyAccess = async () => {
    try {
      // Use selectedRecordId or selectedPatientId as needed
      if ((!selectedPatientId && !selectedRecordId) || !emergencyReason) return;

      if (selectedRecordId) {
        // Instead of using a non-existent method, use the patient emergency access 
        // with the record's patient ID
        const record = patientRecords.find(r => r.id === selectedRecordId);
        if (record) {
          // Request emergency access for this specific patient
          const records = await medicalService.getPatientRecordsEmergency(
            record.patient_id,
            emergencyReason
          );
          
          // Find the specific record in the returned data
          const updatedRecord = records.find(r => r.id === selectedRecordId);
          if (updatedRecord) {
            // Update the UI to show the record
            setSelectedRecord(updatedRecord);
            setIsRecordDetailsOpen(true);
          }
        }
      } else if (selectedPatientId) {
        // Request emergency access for all patient records (existing flow)
        const restrictedRecords = await medicalService.getPatientRecordsEmergency(
          selectedPatientId,
          emergencyReason
        );

        // Show the records after emergency access is granted
        const patient = patients.find(p => p.id === selectedPatientId);
        setSelectedPatient(patient || null);
        setPatientRecords(restrictedRecords);
        setIsViewRecordsModalOpen(true);
      }

      setShowEmergencyModal(false);
      setEmergencyReason('');
      setSelectedRecordId(null);
    } catch (error) {
      console.error('Error confirming emergency access:', error);
      toast.error('Failed to confirm emergency access');
    }
  };

  const filteredRecords = patientRecords.filter(record => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      record.title.toLowerCase().includes(searchLower) ||
      record.type.toLowerCase().includes(searchLower) ||
      record.department.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title={`Medical Records - ${selectedPatient?.name || ''}`}
        description="View and manage patient medical records"
        action={
          <Button 
            variant="danger" 
            onClick={() => setShowEmergencyPatientModal(true)}
            className="flex items-center"
          >
            <Shield className="w-4 h-4 mr-2" />
            Emergency Access
          </Button>
        }
      />

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.length === 0 ? (
              <p className="text-gray-400 col-span-full text-center py-8">
                No patients found
              </p>
            ) : (
              filteredPatients.map(patient => (
                <Card key={patient.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg text-white/90">{patient.name}</h3>
                      <p className="text-white/60">{patient.email}</p>

                      <div className="mt-4">
                        {patient.consent_given ? (
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleViewRecords(patient.id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Records
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedPatient(patient);
                                setIsUploadModalOpen(true);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Record
                            </Button>
                          </div>
                        ) : (
                          <span className="text-yellow-400 text-sm flex items-center">
                            <Shield className="w-4 h-4 mr-1" />
                            Pending Consent
                          </span>
                        )}
                        {patient.consent_given && restrictedRecordsCount[patient.id] > 0 && (
                          <div className="mt-2 flex items-center">
                            <Shield className="w-4 h-4 mr-1 text-red-400" />
                            <span className="text-sm text-red-400">
                              {restrictedRecordsCount[patient.id]} restricted records
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={`Upload Medical Record - ${selectedPatient?.name}`}
      >
        {selectedPatient && (
          <MedicalRecordForm
            patientId={selectedPatient.id}
            onSubmit={handleUpload}
            onCancel={() => setIsUploadModalOpen(false)}
          />
        )}
      </Modal>

      <Modal
        isOpen={isViewRecordsModalOpen}
        onClose={() => setIsViewRecordsModalOpen(false)}
        title={`Medical Records - ${selectedPatient?.name}`}
      >
        <div className="space-y-4">
          {filteredRecords.length === 0 ? (
            <p className="text-center text-gray-500">No records found</p>
          ) : (
            filteredRecords.map((record) => (
              <div 
                key={record.id} 
                className="p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-white/90">{record.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-white/60">
                        Type: {record.type}
                      </span>
                      <span className="text-sm text-white/60">
                        Added: {formatDate(record.created_at)}
                      </span>
                    </div>
                    {record.content && (
                      <p className="mt-2 text-sm text-white/70">
                        {record.content.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewFileUrl(record.id, record.file_url)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      View File
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewRecordDetails(record)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEmergencyAccess(record.id)}
                    >
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Emergency Access
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <RecordDetailsModal
        isOpen={isRecordDetailsOpen}
        onClose={() => setIsRecordDetailsOpen(false)}
        record={selectedRecord || {} as MedicalRecord}
        onDownload={handleDownloadRecord}
        onViewHistory={handleViewAccessHistory}
      />

      <AccessHistoryModal 
        isOpen={isAccessHistoryOpen}
        onClose={() => setIsAccessHistoryOpen(false)}
        recordId={selectedRecord?.id || 0}
        accessLogs={accessLogs}
        isLoading={accessLoading}
      />

      <Modal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        title="Emergency Access Authorization"
      >
        <div className="space-y-4">
          <div className="flex items-start p-4 bg-red-500/10 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-white/90">Emergency Access Request</h4>
              <p className="text-sm text-white/70">
                You are requesting emergency access to a restricted medical record.
                This action will be logged and monitored. Please provide a valid reason.
              </p>
            </div>
          </div>

          <textarea
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3"
            placeholder="Enter reason for emergency access..."
            value={emergencyReason}
            onChange={(e) => setEmergencyReason(e.target.value)}
            rows={4}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setShowEmergencyModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmEmergencyAccess}
              disabled={!emergencyReason}
            >
              Confirm Emergency Access
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEmergencyPatientModal}
        onClose={() => setShowEmergencyPatientModal(false)}
        title="Emergency Access to Restricted Records"
      >
        <div className="space-y-4">
          <div className="bg-red-500/10 p-4 rounded-lg">
            <p className="text-white/80">
              Select a patient to request emergency access to their restricted medical records.
              This action is for emergency situations only and will be thoroughly logged.
            </p>
          </div>

          <div className="divide-y divide-white/10">
            {patients.filter(p => restrictedRecordsCount[p.id] > 0).map(patient => (
              <div key={patient.id} className="py-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-white/90">{patient.name}</h4>
                    <p className="text-sm text-white/60">{restrictedRecordsCount[patient.id]} restricted records</p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleEmergencyPatientSelect(patient.id)}
                  >
                    Request Access
                  </Button>
                </div>
              </div>
            ))}

            {patients.filter(p => restrictedRecordsCount[p.id] > 0).length === 0 && (
              <p className="text-center py-4 text-white/60">No patients with restricted records</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Success Modal - this will appear after the upload modal closes */}
      <Modal
        isOpen={uploadSuccess}
        onClose={() => setUploadSuccess(false)}
        title="Record Uploaded Successfully"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center p-6 bg-green-500/10 rounded-lg">
            <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8 text-green-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-medium text-white/90 mb-2">Upload Complete</h3>
            <p className="text-white/70">
              <span className="font-medium">"{uploadedRecordTitle}"</span> has been successfully 
              uploaded to <span className="font-medium">{selectedPatient?.name}'s</span> medical records.
            </p>
          </div>
          
          <div className="flex justify-center pt-4">
            <Button variant="primary" onClick={() => setUploadSuccess(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DoctorMedicalRecords;