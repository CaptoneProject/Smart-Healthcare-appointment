import { JSX, useEffect } from 'react';
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
import DoctorAppointments from './pages/doctor/Appointments';
import PendingApproval from './pages/doctor/PendingApproval';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import DoctorApprovals from './pages/admin/DoctorApprovals';
import ErrorBoundary from './components/ErrorBoundary';
import AccountRejected from './pages/doctor/AccountRejected';
import NotFound from './pages/NotFound'; // Import the new 404 page

// ProtectedRoute remains unchanged
const ProtectedRoute = ({ children, userType }: { children: JSX.Element, userType: string }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/', { replace: true });
      } else if (user.userType !== userType) {
        if (user.userType === 'patient') {
          navigate('/p/dashboard', { replace: true });
        } else if (user.userType === 'doctor') {
          navigate('/d/dashboard', { replace: true });
        } else if (user.userType === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else if (user.userType === 'doctor') {
        const isCredentialsRoute = location.pathname === '/d/credentials';
        const isPendingRoute = location.pathname === '/d/pending-approval';
        const isRejectedRoute = location.pathname === '/d/rejected';

        switch (user?.doctorStatus) {
          case 'rejected':
            if (!isRejectedRoute) {
              navigate('/d/rejected', { replace: true });
            }
            break;
          case 'pending':
            if (!isPendingRoute && !isCredentialsRoute) {
              navigate('/d/pending-approval', { replace: true });
            }
            break;
          case 'approved':
            break;
          default:
            if (!isCredentialsRoute) {
              navigate('/d/credentials', { replace: true });
            }
            break;
        }
      }
    }
  }, [user, loading, userType, navigate, location.pathname]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return user && user.userType === userType ? children : null;
};

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
        <Route path="appointments" element={<DoctorAppointments />} />
      </Route>
      
      {/* Standalone doctor routes */}
      <Route path="/d/pending-approval" element={
        <ProtectedRoute userType="doctor">
          <PendingApproval />
        </ProtectedRoute>
      } />
      <Route path="/d/rejected" element={
        <ProtectedRoute userType="doctor">
          <AccountRejected />
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
      </Route>
      
      {/* 404 Page */}
      <Route path="*" element={<NotFound />} /> {/* Replace Navigate with NotFound */}
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