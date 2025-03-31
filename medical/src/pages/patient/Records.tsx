// src/pages/patient/Records.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { medicalService } from '../../services/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { FilterBar } from '../../components/ui/FilterBar';
import { RecordCard } from '../../components/records/RecordCard';
import { ConsentModal } from '../../components/modals/ConsentModal';
import { RecordDetailsModal } from '../../components/modals/RecordDetailsModal';
import { AccessHistoryModal } from '../../components/modals/AccessHistoryModal';
import { Shield, Plus } from 'lucide-react';
import { MedicalRecord } from '../../types/medical';
import { toast } from 'react-toastify';

const PatientRecords: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isAccessHistoryOpen, setIsAccessHistoryOpen] = useState(false);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);

  useEffect(() => {
    checkConsentAndLoadRecords();
  }, [user]);

  const checkConsentAndLoadRecords = async () => {
    try {
      const { consentGiven } = await medicalService.getConsentStatus();
      setConsentGiven(consentGiven);
      
      if (consentGiven) {
        // Use the new method instead
        const records = await medicalService.getOwnRecords();
        setRecords(records);
      }
    } catch (error) {
      setError('Failed to load medical records');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = async (consent: boolean) => {
    try {
      await medicalService.updateConsent(consent);
      setConsentGiven(consent);
      if (consent) {
        checkConsentAndLoadRecords();
      }
    } catch (error) {
      setError('Failed to update consent');
    }
    setIsConsentModalOpen(false);
  };

  const handleViewRecord = (record: MedicalRecord) => {
    console.log('Viewing record:', record);
    setSelectedRecord(record);
    setIsRecordModalOpen(true);
  };

  const handleDownload = async (record: MedicalRecord): Promise<void> => {
    try {
      console.log('Downloading record:', record.file_url);
      if (!record.file_url) {
        toast.error('No file URL available');
        return;
      }
      
      // Create and click a download link
      const link = document.createElement('a');
      link.href = record.file_url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleViewAccessHistory = async (recordId: number) => {
    try {
      setAccessLoading(true);
      const logs = await medicalService.getRecordAccessLogs(recordId);
      setAccessLogs(logs);
      setIsAccessHistoryOpen(true);
    } catch (err) {
      setError('Failed to fetch access history');
    } finally {
      setAccessLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    // Search query filter
    const matchesSearch = !searchQuery || (
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.sensitivity_level?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Category filter
    let matchesFilter = activeFilter === 'all';
    
    if (!matchesFilter) {
      // Map our filter categories to actual record types
      switch (activeFilter) {
        case 'test':
          matchesFilter = record.type.toLowerCase().includes('test');
          break;
        case 'prescription':
          matchesFilter = record.type.toLowerCase() === 'prescription';
          break;
        case 'diagnosis':
          matchesFilter = record.type.toLowerCase() === 'diagnosis';
          break;
        case 'report':
          matchesFilter = record.type.toLowerCase().includes('report');
          break;
        default:
          matchesFilter = true;
      }
    }

    return matchesSearch && matchesFilter;
  });

  const filterOptions = [
    { id: 'all', label: 'All Records' },
    { id: 'test', label: 'Test Results' },
    { id: 'prescription', label: 'Prescriptions' },
    { id: 'diagnosis', label: 'Diagnoses' },
    { id: 'report', label: 'Reports' }
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!consentGiven) {
    return (
      <div className="p-6">
        <PageHeader 
          title="Medical Records"
          description="Secure access to your medical history"
        />
        <div className="mt-8 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Consent Required</h2>
          <p className="max-w-md mx-auto mb-6 text-gray-500">
            You need to provide consent to access your medical records.
            This ensures your data is only used with your permission.
          </p>
          <Button onClick={() => setIsConsentModalOpen(true)}>
            Provide Consent
          </Button>
        </div>
        <ConsentModal
          isOpen={isConsentModalOpen}
          onClose={() => setIsConsentModalOpen(false)}
          onAccept={() => handleConsentChange(true)}
          onDecline={() => handleConsentChange(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title="Medical Records" 
        description="View and manage your medical history with secure access controls"
        action={
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
          >
            Upload Record
          </Button>
        }
      />

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <FilterBar 
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        options={filterOptions}
        searchPlaceholder="Search records..."
        onSearchChange={setSearchQuery}
        searchValue={searchQuery}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <RecordCard 
              key={record.id} 
              record={record} 
              onViewRecord={handleViewRecord}
            />
          ))
        ) : (
          <div className="col-span-1 md:col-span-2 flex justify-center p-10">
            <div className="text-center">
              <p className="text-white/60">No records found matching your criteria.</p>
            </div>
          </div>
        )}
      </div>

      <ConsentModal 
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        onAccept={() => handleConsentChange(true)}
        onDecline={() => handleConsentChange(false)}
      />

      <RecordDetailsModal 
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        record={selectedRecord || {} as MedicalRecord}
        onDownload={handleDownload}
        onViewHistory={handleViewAccessHistory}
      />

      <AccessHistoryModal 
        isOpen={isAccessHistoryOpen}
        onClose={() => setIsAccessHistoryOpen(false)}
        recordId={selectedRecord?.id || 0}
        accessLogs={accessLogs}
        isLoading={accessLoading}
      />
    </div>
  );
};

export default PatientRecords;