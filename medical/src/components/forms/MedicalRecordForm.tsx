import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { FileText, Upload } from 'lucide-react';

interface MedicalRecordFormProps {
  patientId: number;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

const MedicalRecordForm: React.FC<MedicalRecordFormProps> = ({
  patientId,
  onSubmit,
  onCancel
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Test Result');
  const [department, setDepartment] = useState('');
  const [sensitivityLevel, setSensitivityLevel] = useState('Normal');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !type || !department || !file || !sensitivityLevel) {
      setError('Please fill all fields and upload a file');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      const formData = new FormData();
      formData.append('patientId', patientId.toString());
      formData.append('title', title);
      formData.append('type', type);
      formData.append('department', department);
      formData.append('sensitivityLevel', sensitivityLevel);
      formData.append('file', file);
      
      await onSubmit(formData);
    } catch (err) {
      setError('Failed to upload record');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-white"
          placeholder="Enter record title"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-white appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em', backgroundRepeat: 'no-repeat' }}
        >
          <option value="Test Result">Test Result</option>
          <option value="Prescription">Prescription</option>
          <option value="Diagnosis">Diagnosis</option>
          <option value="Report">Report</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          Department
        </label>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-white appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em', backgroundRepeat: 'no-repeat' }}
        >
          <option value="">Select department</option>
          <option value="cardiology">Cardiology</option>
          <option value="neurology">Neurology</option>
          <option value="orthopedics">Orthopedics</option>
          <option value="pediatrics">Pediatrics</option>
          <option value="radiology">Radiology</option>
          <option value="general">General</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          Sensitivity Level
        </label>
        <select
          value={sensitivityLevel}
          onChange={(e) => setSensitivityLevel(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-white appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em', backgroundRepeat: 'no-repeat' }}
        >
          <option value="Normal">Normal</option>
          <option value="Sensitive">Sensitive</option>
          <option value="Restricted">Restricted</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          File Upload
        </label>
        <div className="border border-dashed border-white/30 rounded-lg p-4 bg-white/5">
          <div className="flex items-center justify-center flex-col p-4">
            <FileText className="w-8 h-8 text-white/40 mb-2" />
            <label className="flex items-center justify-center w-full">
              <div className="flex flex-col items-center justify-center">
                <span className="text-sm text-white/70 mb-2">
                  {file ? file.name : 'Upload a file'}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="relative overflow-hidden"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Browse Files
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </Button>
              </div>
            </label>
          </div>
          <p className="text-white/50 text-xs text-center mt-2">
            PDF, JPG, PNG up to 10MB
          </p>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Uploading...' : 'Upload Record'}
        </Button>
      </div>
    </form>
  );
};

export default MedicalRecordForm;