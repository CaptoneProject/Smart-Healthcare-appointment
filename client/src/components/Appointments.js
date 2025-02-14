import React from 'react';

const Appointments = () => {
  return (
    <div className="appointments-container">
      <h1>My Appointments</h1>
      <button className="new-appointment-btn">Book New Appointment</button>
      <div className="appointments-list">
        {/* Sample appointment - to be replaced with actual data */}
        <div className="appointment-card">
          <h3>Dr. Sarah Smith</h3>
          <p>Date: February 15, 2024</p>
          <p>Time: 10:00 AM</p>
          <p>Status: Upcoming</p>
          <div className="appointment-actions">
            <button>Reschedule</button>
            <button>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;