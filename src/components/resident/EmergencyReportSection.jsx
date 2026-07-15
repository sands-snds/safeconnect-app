import React, { useState } from 'react';
import ResidentAssistanceModal from './ResidentAssistanceModal';
import ResidentPettyCrimeModal from './ResidentPettyCrimeModal';

function EmergencyReportSection({ onReportClick }) {

  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [showPettyCrimeModal, setShowPettyCrimeModal] = useState(false);

  const emergencies = [
    {
      id: 'emergency',
      title: 'Report Emergency',
      image: '/images/emergency.jpg',
      gradientFrom: '#7f1d1d',
      gradientTo: '#dc2626',
      badge: 'Critical',
      badgeClass: 'critical',
      description: 'Fires, floods, earthquakes, or any life-threatening situation happening right now'
    },
    {
      id: 'assistance',
      title: 'Request Assistance',
      image: '/images/assistance.jpg',
      gradientFrom: '#7c2d12',
      gradientTo: '#ea580c',
      badge: 'High',
      badgeClass: 'high',
      description: 'Request help, rescue, or support for a non-critical situation'
    },
    {
      id: 'petty-crime',
      title: 'Report Petty Crimes',
      image: '/images/crime.jpg',
      gradientFrom: '#450a0a',
      gradientTo: '#b91c1c',
      badge: 'Medium',
      badgeClass: 'medium',
      description: 'Theft, vandalism, disturbances, or other minor offenses'
    },
  ];

  const handleCardClick = (emergency) => {

    if (emergency.id === 'assistance') {
      setShowAssistanceModal(true);
    }

    else if (emergency.id === 'petty-crime') {
      setShowPettyCrimeModal(true);
    }

    else if (onReportClick) {
      onReportClick(emergency.title);
    }
  };

  return (
    <section className="emergency-report-section">

      <div className="assist-header" style={{ marginTop: '60px' }}>
        <div className="assist-icon-top">
          <i className="bi bi-exclamation-octagon-fill"></i>
        </div>

        <h2>Report an Incident</h2>

        <p>
          Every second counts. Choose the type of incident below and reach our response team right away, 24/7.
        </p>

      </div>

      <div className="center-container">

        <div className="emergency-cards">

          {emergencies.map((emergency) => (

            <div
              key={emergency.id}
              className={`emergency-card ${emergency.id}`}
            >

              <div
                className="card-media"
                style={{
                  backgroundImage: emergency.image
                    ? `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%), url(${emergency.image})`
                    : `linear-gradient(135deg, ${emergency.gradientFrom} 0%, ${emergency.gradientTo} 100%)`
                }}
              >

                <span className={`badge ${emergency.badgeClass}`}>
                  {emergency.badge}
                </span>

              </div>

              <div className="card-body">

                <h3>{emergency.title}</h3>

                <p className="card-desc">
                  {emergency.description}
                </p>

              </div>

              <div className="card-actions">

                <button
                  className="report-btn"
                  onClick={() => handleCardClick(emergency)}
                >
                  Report
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

      <ResidentAssistanceModal
        show={showAssistanceModal}
        type="Assistance"
        onClose={() => setShowAssistanceModal(false)}
      />

      <ResidentPettyCrimeModal
        show={showPettyCrimeModal}
        type="Petty Crime"
        onClose={() => setShowPettyCrimeModal(false)}
      />

    </section>
  );
}

export default EmergencyReportSection;