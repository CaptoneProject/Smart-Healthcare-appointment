import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { FilterBar } from '../../components/ui/FilterBar';
import { Modal } from '../../components/ui/Modal';
import { RecordDetailsModal } from '../../components/modals/RecordDetailsModal';
import { RecordCard } from '../../components/records/RecordCard';
import { AlertTriangle } from 'lucide-react';
import { adminService } from '../../services/api';
import { MedicalRecord, AccessLog } from '../../types/medical';

interface AccessLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AccessLog[];
  loading?: boolean;
}

export const AccessLogsViewer: React.FC<AccessLogViewerProps> = ({
  isOpen,
  onClose,
  logs,
  loading
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Access Logs">
      <div className="space-y-4">
        {loading ? (
          <div>Loading...</div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="p-4 bg-white/5 rounded-lg">
              <div className="flex justify-between">
                <div>
                  <p className="text-white/90">{log.accessedBy}</p>
                  <p className="text-sm text-white/60">{log.accessorRole}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/90">{new Date(log.timestamp).toLocaleDateString()}</p>
                  <p className="text-sm text-white/60">{new Date(log.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
              {log.isEmergency && (
                <div className="mt-2 p-2 bg-red-500/10 rounded">
                  <p className="text-sm text-red-400">Emergency Access: {log.reason}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

const MedicalRecordsManagement: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [showAccessLogs, setShowAccessLogs] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isRecordDetailsOpen, setIsRecordDetailsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getAllMedicalRecords();
      setRecords(data);
    } catch (error) {
      setError('Failed to fetch medical records');
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setIsRecordDetailsOpen(true);
  };

  const handleViewAccessLogs = async (recordId: number) => {
    try {
      setLoading(true);
      const logs = await adminService.getMedicalRecordAccessLogs(recordId);
      setAccessLogs(logs);
      setShowAccessLogs(true);
    } catch (error) {
      console.error('Error fetching access logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmEmergencyAccess = async () => {
    if (!selectedPatientId || !emergencyReason) return;

    try {
      const records = await adminService.getPatientRecordsEmergency(
        selectedPatientId,
        emergencyReason
      );
      setRecords(records);
      setShowEmergencyModal(false);
    } catch (error) {
      console.error('Error accessing emergency records:', error);
    }
  };

  const handleDownload = (record: MedicalRecord) => {
    if (record.file_url) {
      window.open(record.file_url, '_blank');
    }
  };

  const handleAccessControl = async (recordId: number, action: 'restrict' | 'unrestrict') => {
    try {
      await adminService.updateRecordAccess(recordId, action);
      // Refresh records
      fetchRecords();
    } catch (error) {
      console.error('Failed to update record access');
    }
  };

  const handleBulkAccessControl = async (records: number[], action: 'restrict' | 'unrestrict') => {
    try {
      await Promise.all(records.map(id => adminService.updateRecordAccess(id, action)));
      fetchRecords();
    } catch (error) {
      console.error('Failed to update access levels');
    }
  };

  const filteredRecords = records.filter(record => {
    if (!searchQuery) return true;
    
    return (
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const BulkActions = () => {
    if (selectedRecords.length === 0) return null;

    return (
      <div className="fixed bottom-6 right-6 p-4 bg-slate-800 rounded-lg shadow-lg border border-white/10">
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/70">
            {selectedRecords.length} records selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleBulkAccessControl(selectedRecords, 'restrict')}
          >
            Restrict Access
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleBulkAccessControl(selectedRecords, 'unrestrict')}
          >
            Unrestrict Access
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedRecords([])}
          >
            Clear Selection
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title="Medical Records Management"
        description="System-wide medical records access and monitoring"
      />

      {/* Add error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 mr-3" />
            <div>
              <h4 className="font-medium text-red-400">Error</h4>
              <p className="text-sm text-red-300/90">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add loading state */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20"></div>
        </div>
      ) : (
        <>
          <FilterBar 
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            options={[
              { id: 'all', label: 'All Records' },
              { id: 'recent', label: 'Recently Added' },
              { id: 'emergency', label: 'Emergency Access' }
            ]}
            searchPlaceholder="Search records..."
            onSearchChange={setSearchQuery}
            searchValue={searchQuery}
          />

          {/* Records Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecords.map(record => (
              <RecordCard
                key={record.id}
                record={record}
                onViewRecord={handleViewRecord}
                onViewAccessLogs={() => handleViewAccessLogs(record.id)}
                showPatientInfo
                onEmergencyAccess={() => {
                  setSelectedPatientId(record.patient_id);
                  setShowEmergencyModal(true);
                }}
                onAccessControlChange={(action) => handleAccessControl(record.id, action)}
                isSelected={selectedRecords.includes(record.id)}
                onSelect={(selected) => {
                  setSelectedRecords(prev => 
                    selected 
                      ? [...prev, record.id]
                      : prev.filter(id => id !== record.id)
                  );
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Add BulkActions component */}
      <BulkActions />

      {/* Emergency Access Modal */}
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
            <Button
              variant="ghost"
              onClick={() => setShowEmergencyModal(false)}
            >
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

      {/* Access Logs Viewer */}
      <AccessLogsViewer
        isOpen={showAccessLogs}
        onClose={() => setShowAccessLogs(false)}
        logs={accessLogs}
        loading={loading}
      />

      <RecordDetailsModal 
        isOpen={isRecordDetailsOpen}
        onClose={() => setIsRecordDetailsOpen(false)}
        record={selectedRecord || {} as MedicalRecord} // Provide a default empty record
        onViewHistory={(recordId: number) => handleViewAccessLogs(recordId)}
        onDownload={handleDownload}
      />
    </div>
  );
};

export default MedicalRecordsManagement;