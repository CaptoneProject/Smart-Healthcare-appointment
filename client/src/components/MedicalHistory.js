import React from 'react';

const MedicalHistory = () => {
  return (
    <div className="medical-history-container">
      <h1>Medical History</h1>
      <div className="history-sections">
        <section className="medical-records">
          <h2>Past Visits</h2>
          {/* Sample record - to be replaced with actual data */}
          <div className="record-card">
            <h3>General Checkup</h3>
            <p>Date: January 5, 2024</p>
            <p>Doctor: Dr. Lisa Johnson</p>
            <button>View Details</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MedicalHistory;