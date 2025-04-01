import React from 'react';
import { Calendar, Eye, Download, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { MedicalRecord } from '../../types/medical';

interface RecordCardProps {
  record: MedicalRecord;
  onViewRecord: (record: MedicalRecord) => void;
  onViewAccessLogs?: () => void;
  showPatientInfo?: boolean;
  onEmergencyAccess?: () => void;
  onAccessControlChange?: (action: 'restrict' | 'unrestrict') => void;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export const RecordCard: React.FC<RecordCardProps> = ({
  record,
  onViewRecord,
  onViewAccessLogs,
  showPatientInfo,
  onEmergencyAccess,
  onAccessControlChange,
  isSelected,
  onSelect
}) => {
  const getSensitivityBadge = (level: string) => {
    const baseClasses = "px-2 py-1 text-xs rounded-full flex items-center";
    switch (level.toLowerCase()) {
      case "sensitive":
        return `${baseClasses} bg-yellow-500/20 text-yellow-400`;
      case "restricted":
        return `${baseClasses} bg-red-500/20 text-red-400`;
      default:
        return `${baseClasses} bg-blue-500/20 text-blue-400`;
    }
  };

  const handleAccessControl = () => {
    if (onAccessControlChange) {
      onAccessControlChange(
        record.sensitivity_level.toLowerCase() === "restricted"
          ? 'unrestrict' 
          : 'restrict'
      );
    }
  };

  return (
    <div className={`relative overflow-hidden backdrop-blur-2xl bg-white/10 rounded-xl border border-white/20 p-6
      shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-20 before:pointer-events-none
      after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/10 after:to-transparent after:opacity-10 after:pointer-events-none
      ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      {onSelect && (
        <div className="absolute top-2 right-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/5"
          />
        </div>
      )}
      <div className="relative space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className={getSensitivityBadge(record.sensitivity_level)}>
              <Shield className="w-3 h-3 mr-1" />
              {record.sensitivity_level}
            </div>
            <h3 className="text-lg font-medium text-white/90 mt-2">{record.title}</h3>
            <p className="text-white/60 text-sm">{record.type}</p>
            {showPatientInfo && (
              <p className="text-white/60 text-sm mt-1">
                Patient: {record.patient_name || 'Unknown'}
              </p>
            )}
          </div>
          <div className="flex items-center text-white/60 text-sm">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date(record.created_at).toLocaleDateString()}
          </div>
        </div>

        {record.content && (
          <p className="text-white/70 text-sm line-clamp-2">
            {record.content}
          </p>
        )}

        {record.sensitivity_level === 'restricted' && (
          <div className="mt-3 flex items-center p-2 bg-red-500/20 rounded-lg">
            <Shield className="w-4 h-4 mr-2 text-red-400" />
            <p className="text-xs text-red-400 font-medium">Restricted Access</p>
          </div>
        )}

        {record.has_emergency_access && (
          <div className="mt-2 p-2 bg-red-500/10 rounded-lg">
            <p className="text-xs flex items-center text-red-400">
              <AlertTriangle className="w-3 h-3 mr-1" />
              This record has been accessed via emergency procedures
            </p>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          <div className="text-sm text-white/60">
            Added by Dr. {record.doctor_name || 'Unknown'}
          </div>
          <div className="flex gap-2">
            {onViewAccessLogs && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAccessLogs}
              >
                <Eye className="w-4 h-4 mr-1" />
                Access Logs
              </Button>
            )}
            {onEmergencyAccess && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEmergencyAccess}
                className="text-red-400 hover:text-red-300"
              >
                <Shield className="w-4 h-4 mr-1" />
                Emergency Access
              </Button>
            )}
            {onAccessControlChange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAccessControl}
              >
                <Shield className="w-4 h-4 mr-1" />
                {record.sensitivity_level.toLowerCase() === "restricted" 
                  ? 'Unrestrict' 
                  : 'Restrict'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewRecord(record)}
              type="button"
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (record.file_url) {
                  console.log("Opening file URL:", record.file_url);
                  const link = document.createElement('a');
                  link.href = record.file_url;
                  link.target = '_blank';
                  link.rel = 'noopener noreferrer';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } else {
                  console.error("No file URL available");
                  alert("No file available for download");
                }
              }}
              type="button"
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};