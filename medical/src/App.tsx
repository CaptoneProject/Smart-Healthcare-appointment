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
import UserManagement from './pages/admin/UserManagement';
import AppointmentsManagement from './pages/admin/AppointmentsManagement';
import ActivityLog from './pages/admin/ActivityLog'; // Import the new ActivityLog component
import MedicalRecords from './pages/doctor/MedicalRecords'; // Import the new MedicalRecords component
import MedicalRecordsManagement from './pages/admin/MedicalRecordsManagement'; // Import the new MedicalRecordsManagement component
import AdminInvoices from './pages/admin/Invoices'; // Import the new AdminInvoices component
import DoctorInvoices from './pages/doctor/Invoices'; // Import the new DoctorInvoices component
import InsuranceClaims from './pages/patient/InsuranceClaims'; // Add this import
import PatientMessages from './pages/patient/Messages';
import DoctorMessages from './pages/doctor/Messages';
import PrescriptionRefills from './pages/doctor/PrescriptionRefills'; // Add this import
import CreatePrescription from './pages/doctor/CreatePrescription'; // Add this import
import RefillHistory from './pages/patient/RefillHistory'; // Add this import
import ToasterProvider from './providers/ToasterProvider'; // Import the ToasterProvider
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Update the ProtectedRoute to handle admin routes with better logging
interface ProtectedRouteProps {
  children: JSX.Element;
  userType?: string;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, userType, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/', { replace: true });
      } else if (userType && user.userType !== userType) {
        // Redirect to appropriate dashboard
        if (user.userType === 'patient') {
          navigate('/p/dashboard', { replace: true });
        } else if (user.userType === 'doctor') {
          navigate('/d/dashboard', { replace: true });
        } else if (user.userType === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else if (allowedRoles && !allowedRoles.includes(user.userType)) {
        // Redirect if user role is not in allowed roles
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
        // Handle doctor routes based on status
        const isCredentialsRoute = location.pathname === '/d/credentials';
        const isPendingRoute = location.pathname === '/d/pending-approval';
        const isRejectedRoute = location.pathname === '/d/rejected';

        // Use optional chaining to safely access doctorStatus
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
            // Allow access to doctor dashboard and related routes
            break;
          default:
            // If no status (new doctor), redirect to credentials form
            if (!isCredentialsRoute) {
              navigate('/d/credentials', { replace: true });
            }
            break;
        }
      }
    }
  }, [user, loading, userType, allowedRoles, navigate, location.pathname]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Check if user exists and meets either userType OR allowedRoles criteria
  const hasAccess = user && (
    (userType && user.userType === userType) || 
    (allowedRoles && allowedRoles.includes(user.userType))
  );

  return hasAccess ? children : null;
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
        <Route path="insurance" element={<InsuranceClaims />} />
        <Route path="messages" element={<PatientMessages />} />
        <Route path="prescriptions/refills" element={<PrescriptionRefills />} /> {/* New route */}
        <Route path="prescriptions/refill-history" element={<RefillHistory />} /> {/* New route */}
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
        <Route path="records" element={<MedicalRecords />} /> {/* New route */}
        <Route path="invoices" element={<DoctorInvoices />} /> {/* New route */}
        <Route path="messages" element={<DoctorMessages />} />
        {/* Add this new route */}
        <Route path="prescriptions" element={<PrescriptionRefills />} /> 
        <Route path="prescriptions/create" element={<CreatePrescription />} />
        <Route path="prescriptions/refill" element={<PrescriptionRefills />} />
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
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="doctor-approvals" element={
          <ErrorBoundary>
            <DoctorApprovals />
          </ErrorBoundary>
        } />
        <Route path="users" element={<UserManagement />} />
        <Route path="appointments" element={<AppointmentsManagement />} />
        <Route path="activity-log" element={<ActivityLog />} /> {/* New route */}
        <Route path="medical-records" element={
          <ErrorBoundary>
            <MedicalRecordsManagement />
          </ErrorBoundary>
        } />
        <Route path="invoices" element={<AdminInvoices />} /> {/* New route */}
        {/* Other admin routes */}
      </Route>
      
      {/* Catch-all redirect to homepage */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <>
      <ToasterProvider />
      <Router>
        <AuthProvider>
          <AppWithAuth />
        </AuthProvider>
      </Router>
      <ToastContainer position="top-right" autoClose={5000} />
    </>
  );
}

export default App;