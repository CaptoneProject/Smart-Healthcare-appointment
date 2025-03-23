import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Calendar,Download, Lock, User} from 'lucide-react';
import PasswordVerificationModal from '../../components/PasswordVerificationModal';

interface MedicalRecord {
  id: number;
  date: string;
  doctorName: string;
  recordType: string;
  description: string;
  fileName?: string;
}

const MedicalRecords: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(true);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');

  // Simulate fetching medical records from an API
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        const mockRecords: MedicalRecord[] = [
          {
            id: 1,
            date: '2023-11-15',
            doctorName: 'Dr. Sarah Johnson',
            recordType: 'Lab Results',
            description: 'Complete blood count and metabolic panel',
            fileName: 'lab_results_20231115.pdf'
          },
          {
            id: 2,
            date: '2023-10-03',
            doctorName: 'Dr. Michael Chen',
            recordType: 'Medical Image',
            description: 'Chest X-ray examination results',
            fileName: 'chest_xray_20231003.jpg'
          },
          {
            id: 3,
            date: '2023-08-22',
            doctorName: 'Dr. Sarah Johnson',
            recordType: 'Medical Notes',
            description: 'Follow-up appointment for hypertension management',
          },
          {
            id: 4,
            date: '2023-07-10',
            doctorName: 'Dr. Robert Williams',
            recordType: 'Prescription',
            description: 'Medication renewal for allergies',
            fileName: 'prescription_20230710.pdf'
          },
          {
            id: 5,
            date: '2023-05-18',
            doctorName: 'Dr. Michael Chen',
            recordType: 'Lab Results',
            description: 'Lipid panel and glucose test',
            fileName: 'lab_results_20230518.pdf'
          }
        ];
        
        setRecords(mockRecords);
        setFilteredRecords(mockRecords);
      } catch (err) {
        console.error('Error fetching medical records:', err);
        setError('Failed to load your medical records. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if the user is verified
    if (isVerified) {
      fetchRecords();
    }
  }, [isVerified]);

  useEffect(() => {
    if (!isVerified) return;
    
    let result = [...records];
    
    // Apply filter
    if (filter !== 'all') {
      result = result.filter(record => record.recordType === filter);
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(record => 
        record.doctorName.toLowerCase().includes(query) ||
        record.description.toLowerCase().includes(query) ||
        record.recordType.toLowerCase().includes(query)
      );
    }
    
    setFilteredRecords(result);
  }, [records, filter, searchQuery, isVerified]);

  const handlePasswordVerified = () => {
    setIsVerified(true);
    setIsPasswordModalOpen(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Lock access to records manually
  const handleLockRecords = () => {
    setIsVerified(false);
    setIsPasswordModalOpen(true);
  };

  if (!isVerified) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Medical Records" 
          description="Access your medical history and documentation"
        />
        
        <Card className="p-8 text-center">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-white/90 mb-2">
            Protected Medical Information
          </h3>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            Medical records are protected for your privacy. Please verify your identity to access this information.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsPasswordModalOpen(true)}
          >
            Verify Identity
          </Button>
        </Card>
        
        <PasswordVerificationModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          onVerified={handlePasswordVerified}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Medical Records" 
        description="Access your medical history and documentation"
        action={
          <Button
            variant="secondary"
            size="md"
            icon={<Lock className="w-4 h-4" />}
            onClick={handleLockRecords}
          >
            Lock Records
          </Button>
        }
      />
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-2 rounded-lg text-sm ${
              filter === 'all' 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange('Lab Results')}
            className={`px-3 py-2 rounded-lg text-sm ${
              filter === 'Lab Results' 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            Lab Results
          </button>
          <button
            onClick={() => handleFilterChange('Medical Image')}
            className={`px-3 py-2 rounded-lg text-sm ${
              filter === 'Medical Image' 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            Medical Images
          </button>
          <button
            onClick={() => handleFilterChange('Medical Notes')}
            className={`px-3 py-2 rounded-lg text-sm ${
              filter === 'Medical Notes' 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => handleFilterChange('Prescription')}
            className={`px-3 py-2 rounded-lg text-sm ${
              filter === 'Prescription' 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            Prescriptions
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-red-400">{error}</p>
        </Card>
      ) : filteredRecords.length > 0 ? (
        <div className="space-y-4">
          {filteredRecords.map(record => (
            <Card key={record.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-lg text-white/90">{record.recordType}</h3>
                  <p className="text-white/60">{record.description}</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm">
                  {record.recordType}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-white/60">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDate(record.date)}
                </div>
                <div className="flex items-center text-white/60">
                  <User className="w-4 h-4 mr-2" />
                  {record.doctorName}
                </div>
              </div>

              {record.fileName && (
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                    onClick={() => {
                      // Handle document download
                      console.log(`Downloading ${record.fileName}`);
                    }}
                  >
                    Download Document
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-white/60">No medical records found matching your criteria.</p>
        </Card>
      )}
      
      <PasswordVerificationModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onVerified={handlePasswordVerified}
      />
    </div>
  );
};

export default MedicalRecords;