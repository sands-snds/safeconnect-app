import React from "react";

export default function DonationHero() {
  const slide = {
    title: "DONATION NEWS",
    subtitle: "Join our emergency response network and help save lives during critical situations.",
    description: "Your donation makes the difference between hope and despair.",
    background: "url('/images/donation-background.jpg')"
  };

  return (
    <section 
      className="hero-section" 
      style={{
        background: slide.background,
        backgroundBlendMode: 'multiply',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Hero Content */}
      <div className="hero-content">
        <h1 className="hero-title">{slide.title}</h1>
        <p className="hero-subtitle">{slide.subtitle}</p>
        <p className="hero-subtitle">{slide.description}</p>
      </div>

      {/* Emergency Banner */}
      <div className="emergency-banner">
        <div>
          <i className="bi bi-telephone-fill me-2"></i>
          Emergency Hotline: 911
        </div>
        <div>Available 24/7 for immediate emergencies</div>
      </div>
    </section>
  );
}
