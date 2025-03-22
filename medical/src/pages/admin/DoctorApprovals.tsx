import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { 
  UserCheck, 
  UserX, 
  Eye,
  CheckCircle,
  XCircle,
  Award,
  FileText,
  Calendar
} from 'lucide-react';
import { adminService } from '../../services/api';

interface DoctorCredential {
  id: number;
  doctorId: number;
  doctorName: string;
  email: string;
  degree: string;
  licenseNumber: string;
  specialization: string;
  yearsOfExperience: number;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  biography: string;           // Add these fields
  educationHistory: string;    // to match what doctors submit
}

const DoctorApprovals: React.FC = () => {
  const [pendingCredentials, setPendingCredentials] = useState<DoctorCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorCredential | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isConfirmingApproval, setIsConfirmingApproval] = useState(false);
  
  // Fetch pending doctor credentials
  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        setLoading(true);
        console.log('Fetching doctor credentials with filter:', activeTab);
        const data = await adminService.getDoctorCredentials(activeTab);
        console.log('Received data:', data);
        setPendingCredentials(data);
      } catch (err: any) {
        console.error('Error fetching doctor credentials:', err);
        // Provide a more detailed error message
        setError(`Failed to load doctor credentials. ${err.message || 'Please try again.'}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCredentials();
  }, [activeTab]);
  
  const handleViewDetails = (doctor: DoctorCredential) => {
    setSelectedDoctor(doctor);
    setIsDetailsOpen(true);
  };
  
  // Add a function to refresh data
  const refreshData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDoctorCredentials(activeTab);
      setPendingCredentials(data);
      setError(null);
    } catch (err) {
      console.error('Error refreshing doctor credentials:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (doctorId: number) => {
    try {
      setIsApproving(true);
      await adminService.updateDoctorStatus(doctorId, 'approved');
      
      // Refresh data instead of manual filtering
      await refreshData();
      
      setIsDetailsOpen(false);
    } catch (err) {
      console.error('Error approving doctor:', err);
      setError('Failed to approve doctor. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };
  
  const openRejectionModal = (doctor: DoctorCredential) => {
    setSelectedDoctor(doctor);
    setRejectionReason('');
    setIsRejectionModalOpen(true);
  };

  // Update the openConfirmationModal function to also set the selected doctor
  const openConfirmationModal = (doctor: DoctorCredential) => {
    setSelectedDoctor(doctor);
    setIsConfirmingApproval(true);
  };
  
  const handleReject = async () => {
    if (!selectedDoctor) return;
    
    try {
      setLoading(true); // Show loading state
      setIsRejecting(true);
      await adminService.updateDoctorStatus(selectedDoctor.doctorId, 'rejected', rejectionReason);
      
      // Update the local state to reflect the change
      setPendingCredentials(prev => 
        prev.map(doc => 
          doc.doctorId === selectedDoctor.doctorId 
            ? { ...doc, status: 'rejected' } 
            : doc
        )
      );
      
      // Show success feedback
      setError(null);
      alert('Doctor application rejected');
      setIsRejectionModalOpen(false);
      setIsDetailsOpen(false);
    } catch (err) {
      console.error('Error rejecting doctor:', err);
      setError('Failed to reject doctor. Please try again.');
    } finally {
      setLoading(false);
      setIsRejecting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Doctor Credentials Verification" 
        description="Review and approve doctor credential submissions"
      />
      
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      <div className="flex space-x-2 mb-6">
        <Button
          variant={activeTab === 'pending' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals
        </Button>
        <Button
          variant={activeTab === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('all')}
        >
          All Submissions
        </Button>
      </div>
      
      {pendingCredentials.length === 0 ? (
        <Card className="p-6 text-center">
          <UserCheck className="w-12 h-12 text-blue-400/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/90 mb-2">
            No {activeTab === 'pending' ? 'pending' : ''} doctor credentials
          </h3>
          <p className="text-white/60 mb-4">
            {activeTab === 'pending' 
              ? 'All doctor credential submissions have been reviewed.' 
              : 'No doctor credential submissions found.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={refreshData}
          >
            Refresh Data
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingCredentials.map((doctor) => (
            <Card key={doctor.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg text-white/90">{doctor.doctorName}</h3>
                  <p className="text-white/60">{doctor.specialization}</p>
                  <div className="mt-2">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                      {doctor.degree}
                    </span>
                    <span className="ml-2 text-white/60 text-sm">
                      {doctor.yearsOfExperience} years experience
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {doctor.status === 'pending' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={() => handleViewDetails(doctor)}
                    >
                      Review Application
                    </Button>
                  ) : doctor.status === 'approved' ? (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Approved
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs flex items-center">
                      <XCircle className="w-3 h-3 mr-1" />
                      Rejected
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-3 text-sm text-white/60">
                <p>Submitted on {new Date(doctor.submittedAt).toLocaleDateString()}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Doctor Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Doctor Credential Details"
      >
        {selectedDoctor && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                <UserCheck className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white/90">{selectedDoctor.doctorName}</h3>
                <p className="text-white/60">{selectedDoctor.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-white/60 text-sm">Specialization</p>
                <p className="text-white/90 font-medium">{selectedDoctor.specialization}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-white/60 text-sm">Experience</p>
                <p className="text-white/90 font-medium">{selectedDoctor.yearsOfExperience} years</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-white/60 text-sm">Degree</p>
                <p className="text-white/90 font-medium">{selectedDoctor.degree}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-white/60 text-sm">License Number</p>
                <p className="text-white/90 font-medium">{selectedDoctor.licenseNumber}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border border-white/10 rounded-lg space-y-2">
                <div className="flex items-center">
                  <Award className="w-5 h-5 text-blue-400 mr-2" />
                  <h4 className="font-medium text-white/90">Professional Biography</h4>
                </div>
                <p className="text-white/70">
                  {selectedDoctor.biography || 'No biography provided'}
                </p>
              </div>
              
              <div className="p-4 border border-white/10 rounded-lg space-y-2">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-400 mr-2" />
                  <h4 className="font-medium text-white/90">Education & Training</h4>
                </div>
                <p className="text-white/70 whitespace-pre-line">
                  {selectedDoctor.educationHistory || 'No education history provided'}
                </p>
              </div>
              
              <div className="p-4 border border-white/10 rounded-lg space-y-2">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-blue-400 mr-2" />
                  <h4 className="font-medium text-white/90">Submission Information</h4>
                </div>
                <p className="text-white/70">
                  Submitted on {new Date(selectedDoctor.submittedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {selectedDoctor.status === 'pending' && (
              <div className="pt-6 border-t border-white/10">
                <div className="bg-slate-800/50 p-4 rounded-lg mb-4">
                  <h3 className="text-white/90 font-medium mb-2">Application Decision</h3>
                  <p className="text-white/60 text-sm mb-4">
                    Please review the application details carefully before making a decision.
                  </p>
                  
                  <div className="flex justify-end space-x-3">
                    <Button 
                      variant="secondary"
                      onClick={() => setIsDetailsOpen(false)}
                    >
                      Close
                    </Button>
                    
                    <Button 
                      variant="danger"
                      icon={<XCircle className="w-4 h-4" />}
                      onClick={() => {
                        setIsDetailsOpen(false);
                        openRejectionModal(selectedDoctor);
                      }}
                    >
                      Reject
                    </Button>
                    
                    <Button 
                      variant="primary"
                      icon={isApproving ? null : <CheckCircle className="w-4 h-4" />}
                      onClick={() => setIsConfirmingApproval(true)}
                      disabled={isApproving}
                    >
                      {isApproving ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Approving...
                        </>
                      ) : (
                        'Approve'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      {/* Rejection Reason Modal */}
      <Modal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        title="Provide Rejection Reason"
      >
        <div className="space-y-4">
          <p className="text-white/70">
            Please provide a reason for rejecting Dr. {selectedDoctor?.doctorName}'s credentials. 
            This will be sent to the doctor.
          </p>
          
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            rows={4}
            placeholder="Enter rejection reason..."
          />
          
          <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
            <Button 
              variant="secondary"
              onClick={() => setIsRejectionModalOpen(false)}
            >
              Cancel
            </Button>
            
            <Button 
              variant="danger"
              icon={isRejecting ? null : <XCircle className="w-4 h-4" />}
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
            >
              {isRejecting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Rejecting...
                </>
              ) : (
                'Confirm Rejection'
              )}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Approval Confirmation Modal */}
      <Modal
        isOpen={isConfirmingApproval}
        onClose={() => setIsConfirmingApproval(false)}
        title="Confirm Doctor Approval"
      >
        <div className="space-y-4">
          <p className="text-white/70">
            Are you sure you want to approve Dr. {selectedDoctor?.doctorName}'s credentials?
            This will grant them access to the system.
          </p>
          
          <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
            <Button 
              variant="secondary"
              onClick={() => setIsConfirmingApproval(false)}
            >
              Cancel
            </Button>
            
            <Button 
              variant="primary"
              icon={<CheckCircle className="w-4 h-4" />}
              onClick={() => {
                setIsConfirmingApproval(false);
                if (selectedDoctor) {
                  handleApprove(selectedDoctor.doctorId);
                } else {
                  console.error('No doctor selected for approval');
                }
              }}
            >
              Confirm Approval
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DoctorApprovals;