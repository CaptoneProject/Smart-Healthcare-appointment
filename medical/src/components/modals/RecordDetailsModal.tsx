import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FileText, Clock } from 'lucide-react';
// Remove Shield from import since it's not used
import { RecordDetailsModalProps } from '../../types/medical';
// Remove the MedicalRecord import since it's not directly used

// Format date utility function 
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Function to get the appropriate badge color
const getSensitivityBadge = (level?: string) => {
  if (!level) return 'bg-gray-500/20 text-gray-400';
  
  switch (level.toLowerCase()) {
    case 'high':
      return 'bg-red-500/20 text-red-400';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400';
    case 'low':
      return 'bg-green-500/20 text-green-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

export const RecordDetailsModal: React.FC<RecordDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  record,
  onDownload,
  onViewHistory
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={record.title || 'Medical Record Details'}
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">{record.title || 'Untitled Record'}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">Type</label>
            <p className="text-white">{record.type || 'N/A'}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-400">Department</label>
            <p className="text-white">{record.department || 'N/A'}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-400">Sensitivity Level</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              getSensitivityBadge(record.sensitivity_level)
            }`}>
              {record.sensitivity_level || 'Unknown'}
            </span>
          </div>
          
          <div>
            <label className="text-sm text-gray-400">Added By</label>
            <p className="text-white">
              {record.doctor_name && !record.doctor_name.includes('Unknown')
                ? `Dr. ${record.doctor_name}`
                : 'Unknown Doctor'}
            </p>
          </div>
          
          <div>
            <label className="text-sm text-gray-400">Date Added</label>
            <p className="text-white">{formatDate(record.created_at)}</p>
          </div>
          
          <div className="flex justify-between pt-4">
            <Button 
              variant="secondary" 
              onClick={() => onDownload(record)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Download Record
            </Button>
            
            {onViewHistory && (
              <Button 
                variant="ghost" 
                onClick={() => onViewHistory(record.id)}
              >
                <Clock className="w-4 h-4 mr-2" />
                View Access History
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};