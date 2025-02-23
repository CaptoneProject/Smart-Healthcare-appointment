import React, { useState } from 'react';
import { 
  Pill,
  RefreshCw,
  Search,
  Filter,
  Clock,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Plus,
  FileText,
  ChevronDown,
  X,
  LucideIcon
} from 'lucide-react';

interface Prescription {
  id: number;
  medication: string;
  dosage: string;
  status: 'Active' | 'Expired' | 'Refill Requested';
  refillsRemaining: number;
  doctor: string;
  prescribedDate: string;
  expiryDate: string;
  pharmacy: string;
  instructions: string;
  lastFilled: string;
  warnings?: string;
}

interface PrescriptionCardProps {
  prescription: Prescription;
}

interface RequestRefillModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: Prescription | null;
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ prescription }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'expired':
        return 'bg-red-500/20 text-red-400';
      case 'refill requested':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="relative overflow-hidden backdrop-blur-2xl bg-white/10 rounded-xl border border-white/20 p-6
      shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:rounded-xl before:opacity-20
      after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/10 after:to-transparent after:rounded-xl after:opacity-10">
      <div className="relative">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-4">
            <div className={`p-2 rounded-lg ${getStatusColor(prescription.status)}`}>
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium text-lg text-white/90">{prescription.medication}</h3>
              <p className="text-white/60 text-sm">{prescription.dosage}</p>
              <div className="flex items-center space-x-3 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                  {prescription.status}
                </span>
                <span className="text-sm text-white/60">Refills: {prescription.refillsRemaining}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white/60 hover:text-white/90 transition-colors"
          >
            <ChevronDown className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-white/60">Prescribed By</p>
                <p className="text-sm text-white/90">Dr. {prescription.doctor}</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Prescribed Date</p>
                <p className="text-sm text-white/90">{prescription.prescribedDate}</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Expiry Date</p>
                <p className="text-sm text-white/90">{prescription.expiryDate}</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Pharmacy</p>
                <p className="text-sm text-white/90">{prescription.pharmacy}</p>
              </div>
            </div>
            
            <div className="mt-2">
              <p className="text-sm text-white/60">Instructions</p>
              <p className="text-sm text-white/90 mt-1">{prescription.instructions}</p>
            </div>

            {prescription.warnings && (
              <div className="flex items-start space-x-2 p-3 bg-red-500/10 rounded-lg mt-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{prescription.warnings}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
          <div className="flex space-x-2">
            <button className="flex items-center px-3 py-1.5 bg-white/5 rounded-lg text-sm text-white/60 hover:text-white/90 transition-colors">
              <FileText className="w-4 h-4 mr-2" />
              View Details
            </button>
            {prescription.status === 'Active' && prescription.refillsRemaining > 0 && (
              <button className="flex items-center px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors">
                <RefreshCw className="w-4 h-4 mr-2" />
                Request Refill
              </button>
            )}
          </div>
          <span className="text-sm text-white/50">
            <Clock className="w-4 h-4 inline mr-1" />
            Last filled {prescription.lastFilled}
          </span>
        </div>
      </div>
    </div>
  );
};

const RequestRefillModal: React.FC<RequestRefillModalProps> = ({ isOpen, onClose, prescription }) => {
  if (!isOpen || !prescription) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 backdrop-blur-2xl bg-white/15 rounded-xl 
        border border-white/20 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
        before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:rounded-xl before:opacity-20
        after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/10 after:to-transparent after:rounded-xl after:opacity-10">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white/90"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold mb-4 text-white/90">Request Prescription Refill</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Pharmacy</label>
            <select className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white/90">
              <option>Select Pharmacy</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Notes for Pharmacist</label>
            <textarea 
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white/90"
              rows={3}
              placeholder="Add any special instructions or notes..."
            />
          </div>

          <button className="w-full bg-blue-500 text-white rounded-lg py-2 px-4 text-sm font-medium 
            hover:bg-blue-600 transition-colors">
            Submit Refill Request
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value }) => (
  <div className="relative overflow-hidden backdrop-blur-2xl bg-white/10 rounded-xl border border-white/20 p-4
    shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
    before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:rounded-xl before:opacity-20
    after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/10 after:to-transparent after:rounded-xl after:opacity-10">
    <div className="relative flex items-center space-x-3">
      <div className="p-2 bg-white/5 rounded-lg">
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      <div>
        <p className="text-sm text-white/60">{label}</p>
        <p className="text-xl font-semibold text-white/90">{value}</p>
      </div>
    </div>
  </div>
);

const PatientPrescriptions: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefillModalOpen, setIsRefillModalOpen] = useState<boolean>(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  const prescriptions: Prescription[] = [
    {
      id: 1,
      medication: "Amoxicillin",
      dosage: "500mg, 3 times daily",
      status: "Active",
      refillsRemaining: 2,
      doctor: "Sarah Wilson",
      prescribedDate: "Feb 15, 2025",
      expiryDate: "Mar 15, 2025",
      pharmacy: "HealthCare Pharmacy",
      instructions: "Take with food. Complete the full course of antibiotics.",
      lastFilled: "1 week ago",
      warnings: "May cause drowsiness. Do not drive or operate heavy machinery."
    },
    {
      id: 2,
      medication: "Lisinopril",
      dosage: "10mg, once daily",
      status: "Active",
      refillsRemaining: 3,
      doctor: "Michael Chen",
      prescribedDate: "Feb 1, 2025",
      expiryDate: "Aug 1, 2025",
      pharmacy: "MedPlus Pharmacy",
      instructions: "Take in the morning with or without food.",
      lastFilled: "2 weeks ago"
    },
    {
      id: 3,
      medication: "Ventolin Inhaler",
      dosage: "2 puffs as needed",
      status: "Refill Requested",
      refillsRemaining: 0,
      doctor: "Emily Rodriguez",
      prescribedDate: "Jan 15, 2025",
      expiryDate: "Jul 15, 2025",
      pharmacy: "HealthCare Pharmacy",
      instructions: "Use as needed for shortness of breath.",
      lastFilled: "3 weeks ago"
    },
    {
      id: 4,
      medication: "Ibuprofen",
      dosage: "400mg, twice daily",
      status: "Expired",
      refillsRemaining: 0,
      doctor: "James Smith",
      prescribedDate: "Dec 1, 2024",
      expiryDate: "Jan 1, 2025",
      pharmacy: "MedPlus Pharmacy",
      instructions: "Take with food. Do not exceed 6 tablets in 24 hours.",
      lastFilled: "2 months ago"
    }
  ];

  const stats: StatCardProps[] = [
    { icon: Pill, label: 'Active Prescriptions', value: '2' },
    { icon: RefreshCw, label: 'Pending Refills', value: '1' },
    { icon: CheckCircle, label: 'Filled This Month', value: '3' },
    { icon: AlertCircle, label: 'Expiring Soon', value: '1' }
  ];

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesFilter = activeFilter === 'all' || prescription.status.toLowerCase() === activeFilter;
    const matchesSearch = searchQuery === '' || 
      prescription.medication.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.doctor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Prescriptions</h1>
          <p className="text-white/60 mt-1">View and manage your prescriptions</p>
        </div>
        <button
          onClick={() => {}}
          className="px-4 py-2 bg-blue-500/80 backdrop-blur-sm rounded-lg text-sm font-medium 
            hover:bg-blue-600/80 transition-all duration-300 flex items-center shadow-lg 
            border border-blue-400/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Prescription
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Filters and Search */}
      <div className="relative overflow-hidden backdrop-blur-2xl bg-white/10 rounded-xl border border-white/20 p-4
        shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
        before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:rounded-xl before:opacity-20
        after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/10 after:to-transparent after:rounded-xl after:opacity-10">
        <div className="relative flex items-center justify-between">
          <div className="flex gap-2">
            {['all', 'active', 'refill requested', 'expired'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeFilter === filter
                    ? 'bg-blue-500/80 text-white shadow-lg border border-blue-400/20'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search prescriptions..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm 
                  focus:outline-none focus:border-blue-500/50 text-white placeholder-white/40
                  backdrop-blur-2xl shadow-[0_4px_16px_0_rgba(31,38,135,0.27)]"
              />
            </div>
            <button className="p-2 text-white/60 hover:text-white/90 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPrescriptions.map((prescription) => (
          <PrescriptionCard 
            key={prescription.id} 
            prescription={prescription}
          />
        ))}
      </div>

      {/* Refill Request Modal */}
      <RequestRefillModal
        isOpen={isRefillModalOpen}
        onClose={() => setIsRefillModalOpen(false)}
        prescription={selectedPrescription}
      />
    </div>
  );
};

export default PatientPrescriptions;