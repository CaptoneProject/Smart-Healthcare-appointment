// src/pages/patient/Records.tsx
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter,
  Download,
  Eye,
  CalendarDays,
  User,
  Activity,
  Pill,
  Plus,
  ChevronDown,
  Clock,
  Lock,
  Shield,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';

interface MedicalRecord {
  id: number;
  title: string;
  type: 'Test Result' | 'Prescription' | 'Diagnosis' | 'Report';
  department: string;
  doctor: string;
  date: string;
  lastUpdated: string;
  status: string;
  sensitivityLevel: 'Normal' | 'Sensitive' | 'Restricted';
  content?: string;
  accessHistory?: AccessLogEntry[];
}

interface AccessLogEntry {
  id: number;
  accessedBy: string;
  role: string;
  timestamp: string;
  reason: string;
  emergency: boolean;
}

interface RecordCardProps {
  record: MedicalRecord;
  onViewRecord: (record: MedicalRecord) => void;
  onDownloadRecord: (recordId: number) => void;
  onViewAccessHistory: (recordId: number) => void;
}

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

// Record Card Component
const RecordCard: React.FC<RecordCardProps> = ({ 
  record, 
  onViewRecord, 
  onDownloadRecord,
  onViewAccessHistory 
}) => {
  const getTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'test result':
        return 'bg-purple-500/20 text-purple-400';
      case 'prescription':
        return 'bg-blue-500/20 text-blue-400';
      case 'diagnosis':
        return 'bg-green-500/20 text-green-400';
      case 'report':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getSensitivityBadge = (level: string) => {
    switch (level) {
      case 'Sensitive':
        return <div className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center"><Lock className="w-3 h-3 mr-1" />Sensitive</div>;
      case 'Restricted':
        return <div className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center"><Shield className="w-3 h-3 mr-1" />Restricted</div>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-4">
          <div className={`p-2 rounded-lg ${getTypeColor(record.type)}`}>
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-lg text-white/90">{record.title}</h3>
              {getSensitivityBadge(record.sensitivityLevel)}
            </div>
            <div className="flex items-center space-x-3 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(record.type)}`}>
                {record.type}
              </span>
              <span className="text-sm text-white/60">{record.department}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center text-white/60">
          <User className="w-4 h-4 mr-2" />
          Dr. {record.doctor}
        </div>
        <div className="flex items-center text-white/60">
          <CalendarDays className="w-4 h-4 mr-2" />
          {record.date}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
        <div className="flex space-x-2">
          <Button 
            variant="secondary" 
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => onViewRecord(record)}
          >
            View
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={() => onDownloadRecord(record.id)}
          >
            Download
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Activity className="w-4 h-4" />}
            onClick={() => onViewAccessHistory(record.id)}
          >
            Access Log
          </Button>
        </div>
        <span className="text-sm text-white/50">
          <Clock className="w-4 h-4 inline mr-1" />
          Updated {record.lastUpdated}
        </span>
      </div>
    </Card>
  );
};

// Consent Modal Component
const ConsentModal: React.FC<ConsentModalProps> = ({ 
  isOpen, 
  onClose, 
  onAccept, 
  onDecline 
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Medical Records Access Consent">
    <div className="space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-white/90">
        <h3 className="font-medium flex items-center">
          <Shield className="w-5 h-5 mr-2 text-blue-400" />
          Secure Access to Your Medical History
        </h3>
        <p className="mt-2 text-sm text-white/70">
          Your privacy and the security of your medical data are extremely important to us.
        </p>
      </div>

      <p className="text-white/80">
        By granting consent, you allow authorized healthcare providers to:
      </p>

      <ul className="space-y-2 text-white/70 text-sm">
        <li className="flex items-start">
          <Check className="w-4 h-4 mr-2 text-green-400 flex-shrink-0 mt-0.5" />
          <span>View and retrieve your past medical records</span>
        </li>
        <li className="flex items-start">
          <Check className="w-4 h-4 mr-2 text-green-400 flex-shrink-0 mt-0.5" />
          <span>Review your medical history for accurate treatment planning</span>
        </li>
        <li className="flex items-start">
          <Check className="w-4 h-4 mr-2 text-green-400 flex-shrink-0 mt-0.5" />
          <span>Access relevant information to provide better care</span>
        </li>
      </ul>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-white/90 space-y-2">
        <h4 className="font-medium flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
          Important Security Information
        </h4>
        <ul className="space-y-2 text-sm text-white/70">
          <li className="flex items-start">
            <Check className="w-4 h-4 mr-2 text-green-400 flex-shrink-0 mt-0.5" />
            <span>All data is encrypted at rest and in transit</span>
          </li>
          <li className="flex items-start">
            <Check className="w-4 h-4 mr-2 text-green-400 flex-shrink-0 mt-0.5" />
            <span>Every access to your records is logged and auditable</span>
          </li>
          <li className="flex items-start">
            <Check className="w-4 h-4 mr-2 text-green-400 flex-shrink-0 mt-0.5" />
            <span>You can revoke consent at any time</span>
          </li>
          <li className="flex items-start">
            <AlertTriangle className="w-4 h-4 mr-2 text-yellow-400 flex-shrink-0 mt-0.5" />
            <span>In life-threatening emergencies, doctors may access critical information even without explicit consent</span>
          </li>
        </ul>
      </div>

      <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
        <Button variant="secondary" onClick={onDecline}>
          Decline
        </Button>
        <Button variant="primary" onClick={onAccept}>
          Grant Consent
        </Button>
      </div>
    </div>
  </Modal>
);

// Record Details Modal
const RecordDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecord | null;
}> = ({ isOpen, onClose, record }) => {
  if (!record) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={record.title}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              record.type === 'Test Result' ? 'bg-purple-500/20 text-purple-400' :
              record.type === 'Prescription' ? 'bg-blue-500/20 text-blue-400' :
              record.type === 'Diagnosis' ? 'bg-green-500/20 text-green-400' :
              'bg-orange-500/20 text-orange-400'
            }`}>
              {record.type}
            </span>
            <span className="text-sm text-white/60">{record.department}</span>
          </div>
          {record.sensitivityLevel !== 'Normal' && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${
              record.sensitivityLevel === 'Restricted' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {record.sensitivityLevel === 'Restricted' ? (
                <><Shield className="w-3 h-3 mr-1" />Restricted</>
              ) : (
                <><Lock className="w-3 h-3 mr-1" />Sensitive</>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-white/60 text-sm">Doctor</p>
            <p className="text-white/90">Dr. {record.doctor}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm">Date</p>
            <p className="text-white/90">{record.date}</p>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <pre className="text-white/80 whitespace-pre-wrap text-sm">
            {record.content || "Content not available for preview. Please download the full record."}
          </pre>
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
          <Button 
            variant="secondary" 
            size="sm"
            icon={<Download className="w-4 h-4" />}
          >
            Download
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Access History Modal
const AccessHistoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  accessHistory: AccessLogEntry[];
  recordTitle: string;
}> = ({ isOpen, onClose, accessHistory, recordTitle }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Access Log: ${recordTitle}`}>
      <div className="space-y-4">
        <p className="text-white/70 text-sm">
          This log shows every time your record was accessed, by whom, and for what purpose.
        </p>

        {accessHistory.length === 0 ? (
          <div className="text-center py-4 text-white/60">
            No access history available for this record.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {accessHistory.map(entry => (
              <div 
                key={entry.id} 
                className={`p-3 rounded-lg border ${
                  entry.emergency 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-white/90">{entry.accessedBy}</p>
                    <p className="text-sm text-white/60">{entry.role}</p>
                  </div>
                  {entry.emergency && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                      Emergency Access
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm text-white/80">
                  <p>Reason: {entry.reason}</p>
                  <p className="text-white/60 mt-1">Accessed on: {entry.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <Button 
            variant="primary" 
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const PatientRecords: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [isAccessHistoryModalOpen, setIsAccessHistoryModalOpen] = useState<boolean>(false);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  // Sample mock data
  const records: MedicalRecord[] = [
    {
      id: 1,
      title: "Blood Test Results",
      type: "Test Result",
      department: "Laboratory",
      doctor: "Sarah Wilson",
      date: "Feb 20, 2025",
      lastUpdated: "2 days ago",
      status: "Normal",
      sensitivityLevel: "Normal",
      content: "CBC Results:\nWBC: 7.2 x10^9/L (Normal range: 4.5-11.0)\nRBC: 5.0 x10^12/L (Normal range: 4.5-5.9)\nHemoglobin: 14.2 g/dL (Normal range: 13.5-17.5)\nHematocrit: 42% (Normal range: 41-50%)\nPlatelets: 250 x10^9/L (Normal range: 150-450)\n\nAll values within normal range.",
      accessHistory: [
        { id: 1, accessedBy: "Dr. Sarah Wilson", role: "General Physician", timestamp: "Feb 20, 2025 - 2:30 PM", reason: "Review of lab results", emergency: false },
        { id: 2, accessedBy: "Lab Technician John", role: "Laboratory Staff", timestamp: "Feb 20, 2025 - 10:15 AM", reason: "Test processing", emergency: false }
      ]
    },
    {
      id: 2,
      title: "Annual Physical Examination",
      type: "Report",
      department: "General Medicine",
      doctor: "Michael Chen",
      date: "Feb 15, 2025",
      lastUpdated: "1 week ago",
      status: "Completed",
      sensitivityLevel: "Normal",
      content: "Annual physical examination findings:\nVital signs: BP 120/80, Pulse 72, Resp 16, Temp 98.6°F\nHeight: 5'10\", Weight: 170 lbs\nGeneral appearance: Well-developed, well-nourished male in no acute distress\nENT: Normal\nCardiovascular: Regular rate and rhythm, no murmurs\nRespiratory: Clear to auscultation bilaterally\nAbdomen: Soft, non-tender, no organomegaly\nExtremities: No edema, normal range of motion\nNeurological: Alert and oriented, cranial nerves intact\n\nAssessment: Healthy adult male with no significant findings.",
      accessHistory: [
        { id: 3, accessedBy: "Dr. Michael Chen", role: "General Physician", timestamp: "Feb 15, 2025 - 3:45 PM", reason: "Annual check-up", emergency: false },
        { id: 4, accessedBy: "Nurse Adams", role: "Nursing Staff", timestamp: "Feb 15, 2025 - 3:15 PM", reason: "Initial assessment", emergency: false }
      ]
    },
    {
      id: 3,
      title: "Antibiotic Prescription",
      type: "Prescription",
      department: "Internal Medicine",
      doctor: "Emily Rodriguez",
      date: "Feb 10, 2025",
      lastUpdated: "2 weeks ago",
      status: "Active",
      sensitivityLevel: "Normal",
      content: "Rx: Amoxicillin 500mg\nTake 1 capsule by mouth three times daily for 10 days\nQuantity: 30 capsules\nRefills: 0\n\nDiagnosis: Acute bacterial sinusitis\nAllergies: None known\nWeight: 170 lbs",
      accessHistory: [
        { id: 5, accessedBy: "Dr. Emily Rodriguez", role: "Internal Medicine", timestamp: "Feb 10, 2025 - 1:20 PM", reason: "Medication prescription", emergency: false },
        { id: 6, accessedBy: "Pharmacist Taylor", role: "Pharmacy Staff", timestamp: "Feb 10, 2025 - 4:45 PM", reason: "Prescription fill", emergency: false }
      ]
    },
    {
      id: 4,
      title: "Mental Health Assessment",
      type: "Diagnosis",
      department: "Psychiatry",
      doctor: "James Smith",
      date: "Feb 5, 2025",
      lastUpdated: "3 weeks ago",
      status: "Completed",
      sensitivityLevel: "Sensitive",
      content: "Patient presented with symptoms of anxiety and mild depression. Reports occasional difficulty sleeping and periods of overwhelming worry.\n\nMental Status Exam: Alert and oriented x3, appropriate affect, no suicidal ideation, no psychotic symptoms.\n\nAssessment: Generalized Anxiety Disorder (GAD), mild\n\nPlan: Cognitive Behavioral Therapy recommended, follow-up in 2 weeks, provided coping strategies and sleep hygiene education.",
      accessHistory: [
        { id: 7, accessedBy: "Dr. James Smith", role: "Psychiatrist", timestamp: "Feb 5, 2025 - 11:30 AM", reason: "Initial psychiatric evaluation", emergency: false },
        { id: 8, accessedBy: "Dr. Emma Thomas", role: "Therapist", timestamp: "Feb 12, 2025 - 2:15 PM", reason: "Therapy session planning", emergency: false }
      ]
    },
    {
      id: 5,
      title: "Substance Abuse Treatment Plan",
      type: "Report",
      department: "Addiction Medicine",
      doctor: "Amanda Lee",
      date: "Jan 28, 2025",
      lastUpdated: "1 month ago",
      status: "Active",
      sensitivityLevel: "Restricted",
      content: "Comprehensive assessment for alcohol use disorder. Patient reports daily consumption of 4-6 alcoholic beverages for past 3 years with recent escalation.\n\nPhysical findings: Mild hepatomegaly, otherwise normal physical exam.\n\nAssessment: Moderate Alcohol Use Disorder\n\nTreatment Plan:\n- Outpatient rehabilitation program\n- Weekly counseling sessions\n- Consider medication-assisted treatment\n- Daily support group attendance recommended\n- Liver function monitoring",
      accessHistory: [
        { id: 9, accessedBy: "Dr. Amanda Lee", role: "Addiction Specialist", timestamp: "Jan 28, 2025 - 10:00 AM", reason: "Treatment planning", emergency: false },
        { id: 10, accessedBy: "Dr. Robert Johnson", role: "Emergency Physician", timestamp: "Feb 2, 2025 - 11:45 PM", reason: "Emergency room evaluation after alcohol-related incident", emergency: true }
      ]
    }
  ];

  // Check for consent when component mounts
  useEffect(() => {
    // In a real app, this would check if consent has been previously given
    const storedConsent = localStorage.getItem('medicalRecordsConsent');
    if (storedConsent === null) {
      setIsConsentModalOpen(true);
    } else {
      setConsentGiven(storedConsent === 'true');
    }
  }, []);

  const handleAcceptConsent = () => {
    setConsentGiven(true);
    localStorage.setItem('medicalRecordsConsent', 'true');
    setIsConsentModalOpen(false);
  };

  const handleDeclineConsent = () => {
    setConsentGiven(false);
    localStorage.setItem('medicalRecordsConsent', 'false');
    setIsConsentModalOpen(false);
  };

  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setIsRecordModalOpen(true);
  };

  const handleDownloadRecord = (recordId: number) => {
    // In a real app, this would trigger a download
    console.log(`Downloading record ${recordId}`);
  };

  const handleViewAccessHistory = (recordId: number) => {
    setSelectedRecordId(recordId);
    setIsAccessHistoryModalOpen(true);
  };

  const filterOptions = [
    { id: 'all', label: 'All Records' },
    { id: 'test result', label: 'Test Results' },
    { id: 'prescription', label: 'Prescriptions' },
    { id: 'diagnosis', label: 'Diagnoses' },
    { id: 'report', label: 'Reports' }
  ];

  const filteredRecords = records.filter(record => {
    // Filter by type
    if (activeFilter !== 'all' && record.type.toLowerCase() !== activeFilter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        record.title.toLowerCase().includes(searchLower) ||
        record.doctor.toLowerCase().includes(searchLower) ||
        record.department.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // If consent is explicitly declined, show consent needed message
  if (consentGiven === false) {
    return (
      <div className="p-6">
        <PageHeader 
          title="Medical Records" 
          description="Your privacy and data protection are important to us"
        />

        <div className="mt-8 text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white/90 mb-2">Consent Required</h2>
          <p className="text-white/60 max-w-md mx-auto mb-6">
            You need to provide consent to access your medical records. This helps ensure 
            your data is only used with your permission.
          </p>
          <Button 
            variant="primary" 
            onClick={() => setIsConsentModalOpen(true)}
          >
            Provide Consent
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
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

      {/* Filters */}
      <FilterBar 
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        options={filterOptions}
        searchPlaceholder="Search records..."
        onSearchChange={setSearchQuery}
        searchValue={searchQuery}
      />

      {/* Security Information */}
      <Card>
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-white/90 mb-1">Secure Access to Your Medical History</h3>
            <p className="text-sm text-white/60">
              Your records are encrypted and every access is logged. You can revoke access at any time.
              In emergencies, doctors may access critical information to provide life-saving care.
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2"
              onClick={() => setIsConsentModalOpen(true)}
            >
              Review My Consent Settings
            </Button>
          </div>
        </div>
      </Card>

      {/* Records List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <RecordCard 
              key={record.id} 
              record={record} 
              onViewRecord={handleViewRecord}
              onDownloadRecord={handleDownloadRecord}
              onViewAccessHistory={handleViewAccessHistory}
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

      {/* Consent Modal */}
      <ConsentModal 
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        onAccept={handleAcceptConsent}
        onDecline={handleDeclineConsent}
      />

      {/* Record Details Modal */}
      <RecordDetailsModal 
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        record={selectedRecord}
      />

      {/* Access History Modal */}
      <AccessHistoryModal 
        isOpen={isAccessHistoryModalOpen}
        onClose={() => setIsAccessHistoryModalOpen(false)}
        accessHistory={records.find(r => r.id === selectedRecordId)?.accessHistory || []}
        recordTitle={records.find(r => r.id === selectedRecordId)?.title || 'Record'}
      />
    </div>
  );
};

export default PatientRecords;