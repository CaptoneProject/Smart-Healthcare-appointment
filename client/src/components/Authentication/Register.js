import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Register.css';

const Register = () => {
  return (
    <div className="register-container">
      <h2>Register</h2>
      <form className="register-form">
        <select name="role">
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="admin">Admin</option>
        </select>

        <input
          type="email"
          name="email"
          placeholder="Email"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          required
        />

        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          required
        />

        <input
          type="date"
          name="dateOfBirth"
          required
        />

        <select name="gender">
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <input
          type="tel"
          name="contactNumber"
          placeholder="Contact Number"
        />

        <button 
          type="submit" 
          className="register-button"
        >
          Register
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Already have an account? <Link to="/login">Click here to Login</Link>
      </p>
    </div>
  );
};

export default Register;