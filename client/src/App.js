import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
import './styles/Patient.css';
import Home from './components/Home';
import Login from './components/Authentication/Login';
import Register from './components/Authentication/Register';
import AboutUs from './components/AboutUs';
import FindDoctor from './components/FindDoctor';
import Appointments from './components/Appointments';
import Prescriptions from './components/Prescriptions';
import MedicalHistory from './components/MedicalHistory';
import AdminLanding from './components/Dashboard/AdminLanding';
import DoctorLanding from './components/Dashboard/DoctorLanding';
import PatientLanding from './components/Dashboard/PatientLanding';

function App() {
  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-brand">
          <Link to="/">HealthCare</Link>
        </div>
        <div className="nav-links">
        <Link to="/appointments">Appointments</Link>
        <Link to="/find-doctor">Find Doctor</Link>
        <Link to="/prescriptions">Prescriptions</Link>
        <Link to="/medical-history">Medical History</Link>
        <Link to="/about">About Us</Link>
        
        </div>
        <div className="nav-auth">
          <Link to="/login" className="login-btn">Login</Link>
          <Link to="/register" className="register-btn">Register</Link>
        </div>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/find-doctor" element={<FindDoctor />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
          <Route path="/medical-history" element={<MedicalHistory />} />
          <Route path="/admin" element={<AdminLanding />} />
          <Route path="/doctor" element={<DoctorLanding />} />
          <Route path="/patient" element={<PatientLanding />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;