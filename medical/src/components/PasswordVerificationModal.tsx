import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/api';

interface PasswordVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

const PasswordVerificationModal: React.FC<PasswordVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Verify password by attempting a mini-auth with the stored email
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (!storedUser.email) {
        setError('User session error. Please try logging out and back in.');
        return;
      }
      
      await authService.login(storedUser.email, password);
      
      // If we get here, password was correct
      setLoading(false);
      onVerified();
      
      // Reset the form
      setPassword('');
      
    } catch (error: any) {
      setLoading(false);
      setError(error.message || 'Invalid password. Please try again.');
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Security Verification">
      <div className="p-1">
        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-medium text-white/90 mb-2">
            Medical Records Access
          </h3>
          <p className="text-white/60 text-sm">
            Please enter your password to view sensitive medical information
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Enter Your Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-white/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-10 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify & Access Records'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default PasswordVerificationModal;