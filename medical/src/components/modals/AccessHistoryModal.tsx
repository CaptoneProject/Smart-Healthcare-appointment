import React from 'react';
import { Modal } from '../ui/Modal';
import { AlertTriangle, User, Clock } from 'lucide-react';

interface AccessHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: number; // Kept for API compatibility
  accessLogs: any[];
  isLoading?: boolean;
}

export const AccessHistoryModal: React.FC<AccessHistoryModalProps> = ({
  isOpen,
  onClose,
  // @ts-ignore - Parameter kept for API compatibility but not used directly
  recordId, 
  accessLogs,
  isLoading = false
}) => {
  // Format date for better display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Helper to format the accessor name with role
  const formatAccessor = (name: string, role: string) => {
    if (!name) return 'Unknown user';
    return `${name} (${role || 'Unknown role'})`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Access History">
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : accessLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <AlertTriangle className="w-8 h-8 mb-2 text-yellow-400/70" />
              <p className="text-white/60">No access records found for this document</p>
            </div>
          ) : (
            accessLogs.map((log, index) => (
              <div key={index} className="border border-white/10 rounded-lg p-4 bg-white/5">
                <div className="flex flex-col md:flex-row md:justify-between">
                  <div className="flex items-start">
                    <User className="w-5 h-5 mr-2 mt-0.5 text-blue-400" />
                    <div>
                      <p className="font-medium text-white/80">
                        Accessed by {formatAccessor(log.accessed_by_name || log.accessorName, log.accessor_role || log.accessorRole)}
                      </p>
                      {log.is_emergency && (
                        <div className="mt-1 inline-flex items-center px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded">
                          Emergency Access
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center mt-2 md:mt-0">
                    <Clock className="w-4 h-4 mr-1 text-gray-400" />
                    <span className="text-sm text-white/60">
                      {formatDate(log.access_time || log.timestamp)}
                    </span>
                  </div>
                </div>
                {log.reason && (
                  <div className="mt-2 pl-7">
                    <p className="text-sm text-white/70">
                      <span className="text-white/50">Reason:</span> {log.reason}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};