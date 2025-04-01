export interface MedicalRecord {
  id: number;
  patient_id: number;
  patient_name?: string;
  doctor_id: number;
  doctor_name?: string;
  title: string;
  type: string;
  department: string;
  file_url: string;
  sensitivity_level: string;
  content?: string;
  created_at: string;
  updated_at: string;
  has_emergency_access?: boolean; // Add this property
}

export interface MedicalRecordUpload {
  patientId: number;
  title: string;
  type: string;
  department: string;
  sensitivityLevel: string;
  file: File | null;
}

export interface AccessLog {
  id: number;
  recordId: number;
  accessedBy: string;
  accessedByName: string;
  accessorRole: string;
  timestamp: string;
  reason?: string;
  isEmergency: boolean;
}

export interface AccessAnalytics {
  totalAccesses: number;
  emergencyAccesses: number;
  restrictedRecords: number;
  averageAccessTime: number;
}

export interface ConsentStatus {
  consentGiven: boolean;
  updatedAt: string;
}

export interface Patient {
  id: number;
  name: string;
  email: string;
  record_count: number;
  last_record_date: string | null;
  consent_given: boolean;
}

export interface RecordDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecord;
  onDownload: (record: MedicalRecord) => Promise<void> | void;
  onViewHistory?: (recordId: number) => void;
}