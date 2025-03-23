import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Hospital, Mail, Lock, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

interface FormData {
  email: string;
  password: string;
  name: string;
  userType: 'patient' | 'doctor' | 'provider' | 'admin';  // Added 'admin'
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  confirmPassword?: string;
}

const initialFormData: FormData = {
  email: '',
  password: '',
  name: '',
  userType: 'patient',
  confirmPassword: ''
};

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const navigate = useNavigate();
  const { login, register, loading, error: authError } = useAuth();
  const [isSignIn, setIsSignIn] = useState<boolean>(initialMode === 'signin');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setIsSignIn(initialMode === 'signin');
    setFormData(initialFormData);
    setErrors({});
    setFormError(null);
  }, [initialMode]);

  useEffect(() => {
    // Update form error when auth error changes
    if (authError) {
      setFormError(authError);
    }
  }, [authError]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Password validation for registration
    if (!isSignIn) {
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
      
      if (!passwordRegex.test(formData.password)) {
        setFormError('Password must be at least 8 characters long and include a number and special character');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setFormError('Passwords do not match');
        return;
      }
    }
    
    try {
      if (isSignIn) {
        await login(formData.email, formData.password);
        // Successful login will navigate automatically
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          userType: formData.userType
        });
      }
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      // Stay on form and display error
      setFormError(err.message || 'Authentication failed');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear any errors for this field
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const toggleMode = (): void => {
    setIsSignIn(!isSignIn);
    setErrors({});
    setFormData(initialFormData);
    setFormError(null);
  };

  // Quick navigation function for development
  const handleQuickNavigation = async (userType: 'patient' | 'doctor' | 'admin') => {
    try {
      console.log(`Attempting quick navigation for ${userType}...`);
      
      let loginResponse;
      if (userType === 'admin') {
        console.log('Logging in as admin...');
        // Updated password to meet requirements (8+ chars, number, special char)
        loginResponse = await login('admin1@gmail.com', 'admin@@1');
        console.log('Admin login response:', loginResponse);
        
        window.location.href = '/admin/dashboard';
        return;
      } else if (userType === 'doctor') {
        loginResponse = await login('doctor1@gmail.com', 'Doctor@1');
      } else {
        loginResponse = await login('patient1@gmail.com', 'patient@1');
      }

      // Check localStorage for token
      const token = localStorage.getItem('accessToken');
      console.log('Token after login:', token ? 'Token exists' : 'No token');
      const user = localStorage.getItem('user');
      console.log('User from localStorage:', user);

      // Normal navigation via React Router
      const route = userType === 'patient' ? '/p/dashboard' : 
                    userType === 'doctor' ? '/d/dashboard' : 
                    '/admin/dashboard';
      console.log(`Navigating to ${route}`);
      navigate(route);
      onClose();
    } catch (error) {
      console.error('Quick navigation error:', error);
      setFormError('Failed to authenticate. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop - increased blur and opacity */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Modal - increased opacity and blur */}
      <div className="relative w-full max-w-md mx-4 bg-white/15 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {/* Logo and Header */}
          <div className="flex items-center justify-center mb-6">
            <Hospital className="w-8 h-8 text-blue-500" />
            <span className="ml-2 text-xl font-semibold text-white">SmartCare</span>
          </div>

          <h2 className="text-2xl font-bold mb-2 text-white text-center">
            {isSignIn ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-gray-300 mb-6 text-center">
            {isSignIn 
              ? 'Sign in to access your account' 
              : 'Join SmartCare for better healthcare management'}
          </p>

          {/* Form Error Message */}
          {formError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{formError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isSignIn && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Full Name</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full bg-white/10 border ${errors.name ? 'border-red-500' : 'border-white/20'} 
                        rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-blue-500 transition-colors text-white placeholder-gray-400`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">I am a</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['patient', 'doctor', 'admin'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, userType: type }))}
                        className={`p-3 rounded-lg border ${
                          formData.userType === type 
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                            : 'border-white/20 bg-white/10 hover:bg-white/20 text-white'
                        } transition-all capitalize text-sm`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-white">Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full bg-white/10 border ${errors.email ? 'border-red-500' : 'border-white/20'} 
                    rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-blue-500 transition-colors text-white placeholder-gray-400`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full bg-white/10 border ${errors.password ? 'border-red-500' : 'border-white/20'} 
                    rounded-lg py-2 pl-10 pr-12 focus:outline-none focus:border-blue-500 transition-colors text-white placeholder-gray-400`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
            </div>

            {!isSignIn && (
              <p className="text-xs text-white/60 mt-1">
                Password must be at least 8 characters long and include a number and special character
              </p>
            )}

            {!isSignIn && (
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full bg-white/10 border ${errors.confirmPassword ? 'border-red-500' : 'border-white/20'} 
                      rounded-lg py-2 pl-10 pr-12 focus:outline-none focus:border-blue-500 transition-colors text-white placeholder-gray-400`}
                    placeholder="Confirm your password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {isSignIn && (
              <div className="flex justify-end">
                <button type="button" className="text-sm text-blue-400 hover:text-blue-300">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-500 text-white rounded-lg py-2 px-4 hover:bg-blue-600 
                transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                focus:ring-offset-slate-900 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading 
                ? 'Processing...' 
                : isSignIn ? 'Sign In' : 'Create Account'}
            </button>

            {/* Development Quick Access Section */}
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Development Quick Access</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickNavigation('patient')}
                  className="bg-green-600/70 hover:bg-green-500 text-white text-xs py-1 px-2 rounded"
                >
                  Patient Portal
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickNavigation('doctor')}
                  className="bg-purple-600/70 hover:bg-purple-500 text-white text-xs py-1 px-2 rounded"
                >
                  Doctor Portal
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickNavigation('admin')}
                  className="bg-blue-600/70 hover:bg-blue-500 text-white text-xs py-1 px-2 rounded"
                >
                  Admin Portal
                </button>
              </div>
            </div>
          </form>

          {/* Toggle Sign In/Sign Up */}
          <p className="mt-6 text-center text-gray-300">
            {isSignIn ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggleMode}
              className="text-blue-400 hover:text-blue-300"
            >
              {isSignIn ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;