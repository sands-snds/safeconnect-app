import React from 'react';

function ResidentHero() {
  return (
    <div
      className="hero-section position-relative text-center text-lg-start"
      style={{
        paddingTop: '2rem',
        backgroundImage: "url('/images/resident-background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',  
        minHeight: '100vh',
        width: '100%',
      }}
    >
      <div className="hero-content container">
        <h1 className="hero-title" style={{ marginTop: 0 }}>SAFE CONNECT</h1>
        <p className="hero-subtitle">
          Be part of our emergency response network and stand ready to save lives when it matters most.<br />
          Your action can bring hope in times of crisis.
        </p>
      </div>

      {/* Emergency Banner */}
      <div className="emergency-banner text-center text-lg-start">
        <div className="d-flex align-items-center justify-content-center justify-content-lg-start">
          <i className="bi bi-telephone-forward-fill me-2"></i>
          <span>Emergency Hotline: 911</span>
        </div>
        <div className="d-flex align-items-center justify-content-center justify-content-lg-start">
          <i className="bi bi-clock-fill me-2"></i>
          Available 24/7 for immediate emergencies
        </div>
      </div>
    </div>
  );
}

export default ResidentHero;
