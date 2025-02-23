import React, { useState } from 'react';
import { 
  CreditCard, 
  Download,
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Receipt,
  ChevronDown,
  X,
  ArrowRight
} from 'lucide-react';

interface PaymentItem {
  description: string;
  amount: number;
}

interface Payment {
  id: number;
  description: string;
  amount: number;
  status: string;
  serviceDate: string;
  dueDate: string;
  provider: string;
  insuranceCoverage: number;
  items?: PaymentItem[];
}

interface PaymentCardProps {
  payment: Payment;
}

const PaymentCard: React.FC<PaymentCardProps> = ({ payment }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'overdue':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-white/10 p-6">
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-4">
          <div className={`p-2 rounded-lg ${getStatusColor(payment.status)}`}>
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-medium text-lg">{payment.description}</h3>
            <div className="flex items-center space-x-3 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                {payment.status}
              </span>
              <span className="text-xl font-semibold">${payment.amount}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ChevronDown className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Service Date</p>
              <p className="text-sm">{payment.serviceDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Due Date</p>
              <p className="text-sm">{payment.dueDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Provider</p>
              <p className="text-sm">Dr. {payment.provider}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Insurance Coverage</p>
              <p className="text-sm">${payment.insuranceCoverage}</p>
            </div>
          </div>

          {payment.items && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Bill Details</p>
              <div className="space-y-2">
                {payment.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-400">{item.description}</span>
                    <span>${item.amount}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-medium">
                  <span>Total</span>
                  <span>${payment.amount}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
        <div className="flex space-x-2">
          <button className="flex items-center px-3 py-1.5 bg-white/5 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
            <FileText className="w-4 h-4 mr-2" />
            View Invoice
          </button>
          {payment.status.toLowerCase() !== 'paid' && (
            <button className="flex items-center px-3 py-1.5 bg-blue-500 rounded-lg text-sm text-white hover:bg-blue-600 transition-colors">
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Now
            </button>
          )}
        </div>
        {payment.status.toLowerCase() === 'paid' && (
          <button className="flex items-center text-sm text-gray-400 hover:text-white">
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </button>
        )}
      </div>
    </div>
  );
};

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddPaymentMethodModal: React.FC<AddPaymentMethodModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-slate-900 rounded-xl border border-white/10 p-6">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold mb-4">Add Payment Method</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Card Number</label>
            <input 
              type="text" 
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
              placeholder="1234 5678 9012 3456"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Expiry Date</label>
              <input 
                type="text" 
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
                placeholder="MM/YY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">CVV</label>
              <input 
                type="text" 
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
                placeholder="123"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Cardholder Name</label>
            <input 
              type="text" 
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
              placeholder="John Doe"
            />
          </div>

          <button className="w-full bg-blue-500 text-white rounded-lg py-2 px-4 text-sm font-medium hover:bg-blue-600 transition-colors">
            Add Card
          </button>
        </div>
      </div>
    </div>
  );
};

interface Stat {
  icon: React.ElementType;
  label: string;
  value: string;
}

const PatientPayments: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddPaymentMethodOpen, setIsAddPaymentMethodOpen] = useState<boolean>(false);

  const payments: Payment[] = [
    {
      id: 1,
      description: "General Consultation",
      amount: 150.0,
      status: "Pending",
      serviceDate: "Feb 20, 2025",
      dueDate: "Mar 5, 2025",
      provider: "Sarah Wilson",
      insuranceCoverage: 100.0,
      items: [
        { description: "Consultation Fee", amount: 200.0 },
        { description: "Lab Tests", amount: 50.0 },
        { description: "Insurance Coverage", amount: -100.0 }
      ]
    },
    {
      id: 2,
      description: "Cardiology Follow-up",
      amount: 250.0,
      status: "Paid",
      serviceDate: "Feb 15, 2025",
      dueDate: "Feb 28, 2025",
      provider: "Michael Chen",
      insuranceCoverage: 175.0,
      items: [
        { description: "Specialist Consultation", amount: 300.0 },
        { description: "ECG Test", amount: 125.0 },
        { description: "Insurance Coverage", amount: -175.0 }
      ]
    },
    {
      id: 3,
      description: "Prescription Refill",
      amount: 75.0,
      status: "Overdue",
      serviceDate: "Feb 1, 2025",
      dueDate: "Feb 15, 2025",
      provider: "Emily Rodriguez",
      insuranceCoverage: 50.0,
      items: [
        { description: "Medication", amount: 125.0 },
        { description: "Insurance Coverage", amount: -50.0 }
      ]
    }
  ];

  const filteredPayments = payments.filter(payment => {
    const matchesFilter =
      activeFilter === 'all' || payment.status.toLowerCase() === activeFilter;
    const matchesSearch =
      searchQuery === '' ||
      payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.provider.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats: Stat[] = [
    { icon: AlertCircle, label: 'Due This Month', value: '$225.00' },
    { icon: CheckCircle, label: 'Paid This Month', value: '$450.00' },
    { icon: Clock, label: 'Pending', value: '$150.00' },
    { icon: CreditCard, label: 'Payment Methods', value: '2' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Payments & Billing</h1>
          <p className="text-gray-400 mt-1">Manage your payments and view billing history</p>
        </div>
        <button
          onClick={() => setIsAddPaymentMethodOpen(true)}
          className="px-4 py-2 bg-blue-500 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Method
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-slate-900 rounded-xl border border-white/10 p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/5 rounded-lg">
                <stat.icon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-xl font-semibold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Methods */}
      <div className="bg-slate-900 rounded-xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold mb-4">Payment Methods</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-white/10 rounded-lg bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="font-medium">•••• •••• •••• 4242</p>
                  <p className="text-sm text-gray-400">Expires 12/25</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">Default</span>
            </div>
          </div>
          <button 
            onClick={() => setIsAddPaymentMethodOpen(true)}
            className="p-4 border border-dashed border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Card
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['all', 'pending', 'paid', 'overdue'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
            />
          </div>
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Payments List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPayments.map((payment) => (
          <PaymentCard key={payment.id} payment={payment} />
        ))}
      </div>

      {/* Insurance Information */}
      <div className="bg-slate-900 rounded-xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold mb-4">Insurance Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">Primary Insurance</p>
              <p className="font-medium">Blue Cross Blue Shield</p>
              <p className="text-sm text-gray-400">Policy #: BCBS-123456789</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Coverage Period</p>
              <p className="font-medium">Jan 2025 - Dec 2025</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">Deductible Status</p>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>$750 / $1,000</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
            </div>
            <button className="text-blue-400 hover:text-blue-300 text-sm flex items-center">
              View Coverage Details
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      <AddPaymentMethodModal
        isOpen={isAddPaymentMethodOpen}
        onClose={() => setIsAddPaymentMethodOpen(false)}
      />
    </div>
  );
};

export default PatientPayments;
