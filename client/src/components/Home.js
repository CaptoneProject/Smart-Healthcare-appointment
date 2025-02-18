import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <h1>Your Health, Our Priority</h1>
        <p className="hero-text">Access world-class healthcare services from the comfort of your home</p>
        <div className="hero-buttons">
          <Link to="/find-doctor" className="primary-button">Find Doctors</Link>
          <Link to="/register" className="secondary-button">Join Now</Link>
        </div>
      </section>

      <section className="services-section">
        <h2>Our Services</h2>
        <div className="services-grid">
          <div className="service-card">
            <img src="/images/appointment.svg" alt="Book Appointments" />
            <h3>Book Appointments</h3>
            <p>Schedule appointments with best doctors at your convenience</p>
            <Link to="/appointments" className="service-link">Book Now</Link>
          </div>

          <div className="service-card">
            <img src="/images/prescription.svg" alt="View Prescriptions" />
            <h3>View Prescriptions</h3>
            <p>Access your prescriptions and medical records anytime</p>
            <Link to="/prescriptions" className="service-link">View Records</Link>
          </div>

          <div className="service-card">
            <img src="/images/doctor.svg" alt="Find Doctors" />
            <h3>Find Doctors</h3>
            <p>Search and connect with specialized healthcare professionals</p>
            <Link to="/find-doctor" className="service-link">Search Now</Link>
          </div>

          <div className="service-card">
            <img src="/images/history.svg" alt="Medical History" />
            <h3>Medical History</h3>
            <p>Track your complete medical history in one place</p>
            <Link to="/medical-history" className="service-link">View History</Link>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-grid">
          <div className="footer-section">
            <h3>About Us</h3>
            <p>Smart Healthcare Management System providing accessible and efficient healthcare services.</p>
            <div className="social-links">
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
              <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
              <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
            </div>
          </div>

          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/find-doctor">Find Doctors</Link></li>
              <li><Link to="/appointments">Appointments</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Services</h3>
            <ul>
              <li><Link to="/prescriptions">Prescriptions</Link></li>
              <li><Link to="/medical-history">Medical History</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Contact Info</h3>
            <div className="contact-info">
              <p><i className="fas fa-phone"></i> +1 234 567 890</p>
              <p><i className="fas fa-envelope"></i> support@healthcare.com</p>
              <p><i className="fas fa-map-marker-alt"></i> One Pace Plaza</p>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; 2025 Smart Healthcare Appointment & Prescription Management System. All rights reserved.</p>
            <div className="footer-bottom-links">
              <Link to="/privacy"></Link>
              <Link to="/terms"></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;