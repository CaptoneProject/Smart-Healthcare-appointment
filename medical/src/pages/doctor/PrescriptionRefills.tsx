import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, Clock, Search, FileText } from 'lucide-react';
import prescriptionService, { RefillRequestResponse } from '../../services/prescriptionService';
import { toast } from 'react-hot-toast';
import { PageHeader } from '../../components/PageHeader';

interface RefillRequestCardProps {
  request: RefillRequestResponse;
  onApprove: (id: number) => void;
  onReject: (id: number, reason: string) => void;
}

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const RefillRequestCard: React.FC<RefillRequestCardProps> = ({ request, onApprove, onReject }) => {
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-white/90">{request.medication}</h3>
            <p className="text-white/60">{request.dosage}</p>
          </div>
          <div className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
            Pending
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-white/60">Patient</p>
            <p className="text-white/90">{request.patientName}</p>
          </div>
          <div>
            <p className="text-sm text-white/60">Request Date</p>
            <p className="text-white/90">{request.requestedDate}</p>
          </div>
          <div>
            <p className="text-sm text-white/60">Pharmacy</p>
            <p className="text-white/90">{request.pharmacy}</p>
          </div>
        </div>
        
        {request.notes && (
          <div className="mt-4 p-3 bg-white/5 rounded-lg">
            <p className="text-sm text-white/60">Notes</p>
            <p className="text-white/90">{request.notes}</p>
          </div>
        )}
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => setIsRejectModalOpen(true)}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg flex items-center hover:bg-red-500/30 transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            Reject
          </button>
          <button
            onClick={() => onApprove(request.id)}
            className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg flex items-center hover:bg-green-500/30 transition-colors"
          >
            <Check className="w-4 h-4 mr-2" />
            Approve
          </button>
        </div>
      </div>

      {isRejectModalOpen && (
        <RejectModal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          onConfirm={(reason) => {
            onReject(request.id, reason);
            setIsRejectModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

const RejectModal: React.FC<RejectModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md relative z-10 border border-white/10">
        <h3 className="text-xl font-semibold mb-4 text-white">Reject Refill Request</h3>
        
        <div className="mb-4">
          <label className="block text-white/70 mb-1">Reason for rejection</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white"
            rows={4}
            placeholder="Provide a reason for rejecting this refill request"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 text-white/70 rounded-lg hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            disabled={!reason.trim()}
          >
            Reject Request
          </button>
        </div>
      </div>
    </div>
  );
};

const PrescriptionRefills: React.FC = () => {
  const [refillRequests, setRefillRequests] = useState<RefillRequestResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const refreshData = () => {
    setLoading(true);
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    const fetchRefillRequests = async () => {
      try {
        console.log("Fetching refill requests for doctor...");
        setLoading(true);
        const data = await prescriptionService.getDoctorRefillRequests();
        console.log("Refill requests received:", data);
        setRefillRequests(data);
      } catch (err) {
        console.error('Error fetching refill requests:', err);
        setError('Failed to fetch refill requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRefillRequests();
  }, [refreshKey]);

  useEffect(() => {
    const intervalId = setInterval(refreshData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleApproveRefill = async (refillId: number) => {
    try {
      await prescriptionService.approveRefill(refillId);
      setRefillRequests(prev => prev.filter(request => request.id !== refillId));
      toast.success('Refill request approved successfully');
    } catch (error) {
      console.error('Error approving refill:', error);
      toast.error('Failed to approve refill');
    }
  };

  const handleRejectRefill = async (refillId: number, reason: string) => {
    try {
      await prescriptionService.rejectRefill(refillId, reason);
      setRefillRequests(prev => prev.filter(request => request.id !== refillId));
      toast.success('Refill request rejected');
    } catch (error) {
      console.error('Error rejecting refill:', error);
      toast.error('Failed to reject refill');
    }
  };

  const filteredRequests = refillRequests.filter(request => 
    request.medication.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.patientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Prescription Refill Requests"
          description="Manage patient refill requests for medications"
        />
        <button
          onClick={refreshData}
          className="flex items-center px-3 py-2 bg-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="flex items-center bg-white/5 rounded-lg p-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by medication or patient name..."
            className="w-full bg-transparent border-0 pl-9 py-2 focus:ring-0 text-white placeholder-white/40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-4 flex items-center">
          <div className="p-3 rounded-full bg-yellow-500/10 mr-3">
            <Clock className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-white/60 text-sm">Pending Requests</p>
            <p className="text-2xl font-semibold text-white">{refillRequests.length}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center p-8 bg-red-500/10 rounded-lg border border-red-500/30">
          <AlertCircle className="mx-auto h-8 w-8 text-red-400 mb-2" />
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center p-12 bg-white/5 rounded-xl border border-white/10">
          <FileText className="mx-auto h-10 w-10 text-white/40 mb-3" />
          {searchQuery ? (
            <p className="text-white/60">No refill requests match your search</p>
          ) : (
            <p className="text-white/60">You don't have any pending refill requests</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRequests.map((request) => (
            <RefillRequestCard
              key={request.id}
              request={request}
              onApprove={handleApproveRefill}
              onReject={handleRejectRefill}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PrescriptionRefills;