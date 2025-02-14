import React from 'react';

const Prescriptions = () => {
  return (
    <div className="prescriptions-container">
      <h1>My Prescriptions</h1>
      <div className="prescriptions-list">
        {/* Sample prescription - to be replaced with actual data */}
        <div className="prescription-card">
          <h3>Prescription #12345</h3>
          <p>Doctor: Dr. Michael Brown</p>
          <p>Date: February 10, 2024</p>
          <button>View Details</button>
          <button>Download PDF</button>
        </div>
      </div>
    </div>
  );
};

export default Prescriptions;