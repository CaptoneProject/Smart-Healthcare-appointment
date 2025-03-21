import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Award, 
  BookOpen, 
  Calendar, 
  Clipboard, 
  FileText,
  Upload
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { doctorService } from '../../services/api';
import { User } from '../../types/user';

interface CredentialsFormData {
  degree: string;
  licenseNumber: string;
  yearsOfExperience: string;
  specialization: string;
  subspecialization: string;
  workingHours: string;
  biography: string;
  educationHistory: string;
  certificates: string[];
}

const DoctorCredentialsForm: React.FC = () => {
  const [formData, setFormData] = useState<CredentialsFormData>({
    degree: '',
    licenseNumber: '',
    yearsOfExperience: '',
    specialization: '',
    subspecialization: '',
    workingHours: '',
    biography: '',
    educationHistory: '',
    certificates: []
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof CredentialsFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is changed
    if (errors[name as keyof CredentialsFormData]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const newErrors: Partial<Record<keyof CredentialsFormData, string>> = {};
    
    if (!formData.degree) newErrors.degree = 'Degree is required';
    if (!formData.licenseNumber) newErrors.licenseNumber = 'License number is required';
    if (!formData.specialization) newErrors.specialization = 'Specialization is required';
    if (!formData.yearsOfExperience) newErrors.yearsOfExperience = 'Years of experience is required';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      try {
        await doctorService.submitCredentials({
          doctorId: user?.id,
          ...formData
        });

        if (user) {
          const updatedUser: User = {
            ...user,
            doctorStatus: 'pending' as const 
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }

        setSubmitMessage('Credentials submitted successfully. Redirecting to pending approval page...');
        
        setTimeout(() => {
          navigate('/d/pending-approval', { replace: true });
        }, 1500);

      } catch (error) {
        console.error('Error submitting credentials:', error);
        setSubmitMessage('Failed to submit credentials. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  // Specialization options
  const specializations = [
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Radiology',
    'Surgery',
    'Ophthalmology',
    'Gynecology',
    'Urology',
    'Oncology',
    'Endocrinology',
    'Other'
  ];
  
  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title="Doctor Verification" 
        description="Complete your profile to verify your credentials"
      />
      
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white/90">Professional Verification</h2>
          <p className="text-white/60 mt-1">
            Please provide your medical credentials for verification. 
            Your profile will be reviewed by our administrators before activation.
          </p>
        </div>
        
        {submitMessage && (
          <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400">
            {submitMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">Medical Degree</label>
              <div className="relative">
                <Award className="w-5 h-5 text-white/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  name="degree"
                  value={formData.degree}
                  onChange={handleChange}
                  placeholder="e.g., MD, MBBS, DO"
                  className={`w-full bg-white/10 border ${
                    errors.degree ? 'border-red-500' : 'border-white/20'
                  } rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500`}
                />
              </div>
              {errors.degree && <p className="mt-1 text-sm text-red-400">{errors.degree}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">License Number</label>
              <div className="relative">
                <Clipboard className="w-5 h-5 text-white/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  placeholder="Enter your medical license number"
                  className={`w-full bg-white/10 border ${
                    errors.licenseNumber ? 'border-red-500' : 'border-white/20'
                  } rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500`}
                />
              </div>
              {errors.licenseNumber && <p className="mt-1 text-sm text-red-400">{errors.licenseNumber}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">Specialization</label>
              <div className="relative">
                <BookOpen className="w-5 h-5 text-white/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className={`w-full bg-white/10 border ${
                    errors.specialization ? 'border-red-500' : 'border-white/20'
                  } rounded-lg pl-10 pr-4 py-2 text-white appearance-none focus:outline-none focus:border-blue-500`}
                >
                  <option value="" disabled>Select your specialization</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
              {errors.specialization && <p className="mt-1 text-sm text-red-400">{errors.specialization}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">Years of Experience</label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-white/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  max="70"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  placeholder="e.g., 5"
                  className={`w-full bg-white/10 border ${
                    errors.yearsOfExperience ? 'border-red-500' : 'border-white/20'
                  } rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500`}
                />
              </div>
              {errors.yearsOfExperience && <p className="mt-1 text-sm text-red-400">{errors.yearsOfExperience}</p>}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Professional Biography</label>
            <div className="relative">
              <FileText className="w-5 h-5 text-white/40 absolute left-3 top-3" />
              <textarea
                name="biography"
                value={formData.biography}
                onChange={handleChange}
                rows={4}
                placeholder="Provide a brief professional biography for your profile"
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Education & Training History</label>
            <div className="relative">
              <FileText className="w-5 h-5 text-white/40 absolute left-3 top-3" />
              <textarea
                name="educationHistory"
                value={formData.educationHistory}
                onChange={handleChange}
                rows={4}
                placeholder="List your education and training background"
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/60 mb-4">Upload Supporting Documents</label>
            <div className="border border-dashed border-white/20 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-white/40 mx-auto mb-2" />
              <p className="text-white/60 mb-2">Drag and drop your documents here, or click to browse</p>
              <p className="text-white/40 text-sm mb-4">Upload degree certificates, license proof, and other relevant documents</p>
              <Button 
                type="button" 
                variant="secondary" 
                size="sm"
                onClick={() => {/* Open file browser */}}
              >
                Browse Files
              </Button>
              <input type="file" className="hidden" multiple />
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/10 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default DoctorCredentialsForm;