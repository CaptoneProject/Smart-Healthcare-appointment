import React, { JSX, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import PatientDashboard from './pages/patient/Dashboard';
import PatientAppointments from './pages/patient/Appointments';
import PatientRecords from './pages/patient/Records';
import PatientLayout from './layouts/PatientLayout';
import PatientPrescriptions from './pages/patient/Prescriptions';
import PatientPayments from './pages/patient/Payments';
import { AuthProvider, useAuth } from './context/AuthContext';
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorLayout from './layouts/DoctorLayout';
import DoctorSchedule from './pages/doctor/Schedule';
import DoctorCredentialsForm from './pages/doctor/CredentialsForm';
import { doctorService } from './services/api';
import PendingApproval from './pages/doctor/PendingApproval';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import DoctorApprovals from './pages/admin/DoctorApprovals';
import ErrorBoundary from './components/ErrorBoundary';

// Complete the ProtectedRoute implementation
const ProtectedRoute = ({ children, userType }: { children: JSX.Element, userType: string }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [checkingCredentials, setCheckingCredentials] = useState(false);
  
  useEffect(() => {
    const checkCredentials = async () => {
      if (user && user.userType === 'doctor' && location.pathname !== '/d/credentials') {
        setCheckingCredentials(true);
        try {
          const status = await doctorService.getCredentialsStatus(user.id);
          if (!status.hasSubmittedCredentials) {
            navigate('/d/credentials');
          } else if (!status.isApproved && location.pathname !== '/d/pending-approval') {
            navigate('/d/pending-approval');
          }
        } catch (error) {
          console.error('Error checking credentials:', error);
        } finally {
          setCheckingCredentials(false);
        }
      }
    };
    
    if (!loading) {
      if (!user) {
        // If no user is logged in, redirect to home
        navigate('/', { replace: true });
      } else if (user.userType !== userType) {
        // If user type doesn't match the required type for this route
        console.log(`Access denied: User type ${user.userType} trying to access ${userType} route`);
        
        // Redirect to their appropriate dashboard
        const dashboardRoutes = {
          'patient': '/p/dashboard',
          'doctor': '/d/dashboard',
          'admin': '/admin/dashboard'
        };
        
        const redirectPath = dashboardRoutes[user.userType as keyof typeof dashboardRoutes] || '/';
        navigate(redirectPath, { replace: true });
      } else if (user.userType === 'doctor') {
        // Special checks for doctors only
        checkCredentials();
      }
    }
  }, [user, loading, userType, navigate, location.pathname]);

  if (loading || checkingCredentials) {
    return <div>Loading...</div>;
  }

  // Only render children if user exists and type matches
  return user && user.userType === userType ? children : null;
};

// Wrapper to apply AuthProvider only to the inner components
const AppWithAuth = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      
      {/* Patient Routes */}
      <Route path="/p" element={
        <ProtectedRoute userType="patient">
          <PatientLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="records" element={<PatientRecords />} />
        <Route path="prescriptions" element={<PatientPrescriptions />} />
        <Route path="payments" element={<PatientPayments />} />
      </Route>
      
      {/* Doctor Routes */}
      <Route path="/d" element={
        <ProtectedRoute userType="doctor">
          <DoctorLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="schedule" element={<DoctorSchedule />} />
        <Route path="credentials" element={<DoctorCredentialsForm />} />
        {/* Other doctor routes */}
      </Route>
      
      {/* Standalone doctor routes */}
      <Route path="/d/pending-approval" element={
        <ProtectedRoute userType="doctor">
          <PendingApproval />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute userType="admin">
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="doctor-approvals" element={
          <ErrorBoundary>
            <DoctorApprovals />
          </ErrorBoundary>
        } />
        {/* Other admin routes */}
      </Route>
      
      {/* Catch-all redirect to homepage */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppWithAuth />
      </AuthProvider>
    </Router>
  );
}

export default App;