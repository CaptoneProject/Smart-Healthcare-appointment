import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Check, 
  X, 
  AlertCircle, 
  Pill,
  Calendar,
  Search
} from 'lucide-react';
import prescriptionService, { RefillRequestResponse } from '../../services/prescriptionService';


const RefillHistoryCard: React.FC<{ refill: RefillRequestResponse }> = ({ refill }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
            <Check className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      default:
        return (
          <span className="flex items-center px-2 py-1 bg-gray-500/20 text-gray-400 text-xs font-medium rounded-full">
            {status}
          </span>
        );
    }
  };
  
  return (
    <div className="bg-white/10 rounded-lg p-4 hover:bg-white/15 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-blue-500/20">
            <Pill className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-white/90">{refill.medication}</h3>
            <p className="text-sm text-white/60">{refill.dosage}</p>
          </div>
        </div>
        {getStatusBadge(refill.status)}
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <p className="text-white/50">Pharmacy</p>
          <p className="text-white/90">{refill.pharmacy}</p>
        </div>
        <div>
          <p className="text-white/50">Requested</p>
          <p className="text-white/90">{refill.requestedDate}</p>
        </div>
        {refill.processed_by && (
          <>
            <div>
              <p className="text-white/50">Doctor</p>
              <p className="text-white/90">{refill.doctor_name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-white/50">Processed</p>
              <p className="text-white/90">{refill.processed_date || 'N/A'}</p>
            </div>
          </>
        )}
      </div>
      
      {refill.notes && refill.status === 'rejected' && (
        <div className="mt-2 p-3 bg-red-500/10 rounded-lg text-sm">
          <p className="text-white/60">Rejection Reason:</p>
          <p className="text-red-300">{refill.notes}</p>
        </div>
      )}
      
      {refill.notes && refill.status !== 'rejected' && (
        <div className="mt-2 p-3 bg-white/5 rounded-lg text-sm">
          <p className="text-white/60">Notes:</p>
          <p className="text-white/80">{refill.notes}</p>
        </div>
      )}
    </div>
  );
};

const RefillHistory: React.FC = () => {
  const [refillHistory, setRefillHistory] = useState<RefillRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const fetchRefillHistory = async () => {
      try {
        setLoading(true);
        const data = await prescriptionService.getPatientRefillHistory();
        setRefillHistory(data);
      } catch (err) {
        console.error('Error fetching refill history:', err);
        setError('Failed to fetch refill history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRefillHistory();
  }, []);
  
  const filteredRefills = refillHistory.filter(refill => 
    refill.medication.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (refill.doctor_name && refill.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Group refills by status for the summary
  const pendingCount = refillHistory.filter(r => r.status === 'pending').length;
  const approvedCount = refillHistory.filter(r => r.status === 'approved').length;
  const rejectedCount = refillHistory.filter(r => r.status === 'rejected').length;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Refill History</h1>
          <p className="text-white/60">History of your prescription refill requests</p>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-yellow-500/10">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-white/60">Pending</p>
              <p className="text-xl font-medium text-white/90">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-green-500/10">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-white/60">Approved</p>
              <p className="text-xl font-medium text-white/90">{approvedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-red-500/10">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-white/60">Rejected</p>
              <p className="text-xl font-medium text-white/90">{rejectedCount}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
        <input
          type="text"
          placeholder="Search by medication or doctor..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-lg pl-9 pr-4 py-2 text-white"
        />
      </div>
      
      {/* Refill List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-500/10 rounded-lg">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-1 bg-red-500/20 text-red-400 rounded-full"
          >
            Retry
          </button>
        </div>
      ) : filteredRefills.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-lg">
          <Calendar className="h-8 w-8 text-white/40 mx-auto mb-2" />
          <p className="text-white/60">No refill history found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRefills.map(refill => (
            <RefillHistoryCard key={refill.id} refill={refill} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RefillHistory;