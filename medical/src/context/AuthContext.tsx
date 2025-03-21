import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';
// Add this import
import { doctorService } from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
  userType: 'patient' | 'doctor' | 'provider';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { email: string, password: string, name: string, userType: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: { name?: string, currentPassword?: string, newPassword?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Add this function to check for credentials status
  const checkDoctorCredentials = async (userId: number) => {
    try {
      const response = await doctorService.getCredentialsStatus(userId);
      return response.hasSubmittedCredentials;
    } catch (error) {
      console.error('Error checking doctor credentials:', error);
      return false;
    }
  };

  // Check for existing auth token and get user data on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setLoading(false);
          return;
        }

        const userData = await authService.getProfile();
        setUser(userData);
      } catch (err) {
        console.error('Failed to load user', err);
        
        // Try to refresh token if initial load fails
        try {
          await authService.refreshToken();
          const userData = await authService.getProfile();
          setUser(userData);
        } catch (refreshErr) {
          console.error('Token refresh failed', refreshErr);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      
      // Redirect based on user type
      if (response.user.userType === 'patient') {
        navigate('/p/dashboard');
      } else if (response.user.userType === 'doctor') {
        const hasCredentials = await checkDoctorCredentials(response.user.id);
        if (!hasCredentials) {
          navigate('/d/credentials');
          return;
        }
        navigate('/d/dashboard');
      } else if (response.user.userType === 'provider') {
        navigate('/provider/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: { email: string, password: string, name: string, userType: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(userData);
      setUser(response.user);
      
      // Redirect based on user type
      if (response.user.userType === 'patient') {
        navigate('/p/dashboard');
      } else if (response.user.userType === 'doctor') {
        const hasCredentials = await checkDoctorCredentials(response.user.id);
        if (!hasCredentials) {
          navigate('/d/credentials');
          return;
        }
        navigate('/d/dashboard');
      } else if (response.user.userType === 'provider') {
        navigate('/provider/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    
    try {
      await authService.logout();
      setUser(null);
      navigate('/');
    } catch (err) {
      console.error('Logout error', err);
      // Still clear user state even if API call fails
      setUser(null);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: { name?: string, currentPassword?: string, newPassword?: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      await authService.updateProfile(profileData);
      
      // Refresh user data if profile was updated
      const userData = await authService.getProfile();
      setUser(userData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
