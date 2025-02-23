import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import PatientDashboard from './pages/patient/Dashboard';
import PatientAppointments from './pages/patient/Appointments';
import PatientRecords from './pages/patient/Records';
import PatientLayout from './layouts/PatientLayout';
import PatientPrescriptions from './pages/patient/Prescriptions';
import PatientPayments from './pages/patient/Payments';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        <Route path="/p" element={<PatientLayout />}>
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="records" element={<PatientRecords />} />
          <Route path="prescriptions" element={<PatientPrescriptions />} />
          <Route path="payments" element={<PatientPayments />} />

        </Route>
      </Routes>
    </Router>
  );
}

export default App;