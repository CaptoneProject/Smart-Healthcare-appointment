import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService, doctorService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
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

  const checkDoctorCredentials = async (userId: number) => {
    try {
      const response = await doctorService.getCredentialsStatus(userId);
      return response.hasSubmittedCredentials;
    } catch (error) {
      console.error('Error checking doctor credentials:', error);
      return false;
    }
  };

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
      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);

      if (response.user.userType === 'doctor') {
        if (response.user.doctorStatus === 'rejected') {
          setLoading(false);
          navigate('/d/rejected', { replace: true });
          return;
        } else if (response.user.doctorStatus === 'pending') {
          setLoading(false);
          navigate('/d/pending-approval', { replace: true });
          return;
        } else if (response.user.doctorStatus === 'approved') {
          setLoading(false);
          navigate('/d/dashboard', { replace: true });
          return;
        } else {
          setLoading(false);
          navigate('/d/credentials', { replace: true });
          return;
        }
      }

      setLoading(false);
      if (response.user.userType === 'patient') {
        navigate('/p/dashboard', { replace: true });
      } else if (response.user.userType === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      }

      return response;

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password');
      setLoading(false);
      throw err;
    }
  };

  const register = async (userData: { email: string, password: string, name: string, userType: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(userData);
      setUser(response.user);
      
      // Add admin case to the routing logic
      switch (response.user.userType) {
        case 'patient':
          navigate('/p/dashboard');
          break;
        case 'doctor':
          const hasCredentials = await checkDoctorCredentials(response.user.id);
          if (!hasCredentials) {
            navigate('/d/credentials');
            return;
          }
          navigate('/d/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard'); // Add this case
          break;
        case 'provider':
          navigate('/provider/dashboard');
          break;
        default:
          navigate('/');
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
        setUser,
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
