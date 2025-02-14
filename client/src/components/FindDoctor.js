import React from 'react';

const FindDoctor = () => {
  return (
    <div className="find-doctor-container">
      <h1>Find a Doctor</h1>
      <div className="search-section">
        <input type="text" placeholder="Search by name or specialty" />
        <button>Search</button>
      </div>
      <div className="doctors-grid">
        {/* Sample doctor card - to be replaced with actual data */}
        <div className="doctor-card">
          <h3>Dr. John Doe</h3>
          <p>Specialty: Cardiology</p>
          <p>Experience: 15 years</p>
          <button>Book Appointment</button>
        </div>
      </div>
    </div>
  );
};

export default FindDoctor;