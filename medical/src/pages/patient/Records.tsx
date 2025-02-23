import React, { useState } from 'react';
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
  LucideIcon
} from 'lucide-react';

interface MedicalRecord {
  id: number;
  title: string;
  type: 'Test Result' | 'Prescription' | 'Diagnosis';
  department: string;
  doctor: string;
  date: string;
  lastUpdated: string;
  status: string;
}

interface RecordCardProps {
  record: MedicalRecord;
}

interface FilterButtonProps {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

interface FilterButton {
  id: string;
  label: string;
}

const RecordCard: React.FC<RecordCardProps> = ({ record }) => {
  const getStatusColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'test result':
        return 'bg-purple-500/20 text-purple-400';
      case 'prescription':
        return 'bg-blue-500/20 text-blue-400';
      case 'diagnosis':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-white/10 p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-4">
          <div className={`p-2 rounded-lg ${getStatusColor(record.type)}`}>
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-medium text-lg">{record.title}</h3>
            <div className="flex items-center space-x-3 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.type)}`}>
                {record.type}
              </span>
              <span className="text-sm text-gray-400">{record.department}</span>
            </div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors">
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center text-gray-400">
          <User className="w-4 h-4 mr-2" />
          Dr. {record.doctor}
        </div>
        <div className="flex items-center text-gray-400">
          <CalendarDays className="w-4 h-4 mr-2" />
          {record.date}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
        <div className="flex space-x-2">
          <button className="flex items-center px-3 py-1 bg-white/5 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
            <Eye className="w-4 h-4 mr-2" />
            View
          </button>
          <button className="flex items-center px-3 py-1 bg-white/5 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Download
          </button>
        </div>
        <span className="text-sm text-gray-500">
          <Clock className="w-4 h-4 inline mr-1" />
          Updated {record.lastUpdated}
        </span>
      </div>
    </div>
  );
};

const FilterButton: React.FC<FilterButtonProps> = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-blue-500 text-white'
        : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
    }`}
  >
    {children}
  </button>
);

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value }) => (
  <div className="bg-slate-900 rounded-xl border border-white/10 p-4">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-white/5 rounded-lg">
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  </div>
);

const PatientRecords: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const records: MedicalRecord[] = [
    {
      id: 1,
      title: "Blood Test Results",
      type: "Test Result",
      department: "Laboratory",
      doctor: "Sarah Wilson",
      date: "Feb 20, 2025",
      lastUpdated: "2 days ago",
      status: "Normal"
    },
    {
      id: 2,
      title: "Annual Physical Examination",
      type: "Diagnosis",
      department: "General Medicine",
      doctor: "Michael Chen",
      date: "Feb 15, 2025",
      lastUpdated: "1 week ago",
      status: "Completed"
    },
    {
      id: 3,
      title: "Antibiotic Prescription",
      type: "Prescription",
      department: "Internal Medicine",
      doctor: "Emily Rodriguez",
      date: "Feb 10, 2025",
      lastUpdated: "2 weeks ago",
      status: "Active"
    },
    {
      id: 4,
      title: "X-Ray Results",
      type: "Test Result",
      department: "Radiology",
      doctor: "James Smith",
      date: "Feb 5, 2025",
      lastUpdated: "3 weeks ago",
      status: "Normal"
    }
  ];

  const filteredRecords = records.filter(record => {
    const matchesFilter = activeFilter === 'all' || record.type.toLowerCase() === activeFilter;
    const matchesSearch = searchQuery === '' || 
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.doctor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterButtons: FilterButton[] = [
    { id: 'all', label: 'All Records' },
    { id: 'test result', label: 'Test Results' },
    { id: 'prescription', label: 'Prescriptions' },
    { id: 'diagnosis', label: 'Diagnoses' }
  ];

  const stats: StatCardProps[] = [
    { icon: FileText, label: 'Total Records', value: '12' },
    { icon: Activity, label: 'Test Results', value: '5' },
    { icon: Pill, label: 'Prescriptions', value: '3' },
    { icon: User, label: 'Doctors', value: '4' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Medical Records</h1>
          <p className="text-gray-400 mt-1">View and manage your medical history</p>
        </div>
        <button
          className="px-4 py-2 bg-blue-500 rounded-lg text-sm font-medium hover:bg-blue-600 
            transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Record
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {filterButtons.map(button => (
            <FilterButton
              key={button.id}
              active={activeFilter === button.id}
              onClick={() => setActiveFilter(button.id)}
            >
              {button.label}
            </FilterButton>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm 
                focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
            />
          </div>
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Records List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredRecords.map((record) => (
          <RecordCard key={record.id} record={record} />
        ))}
      </div>
    </div>
  );
};

export default PatientRecords;