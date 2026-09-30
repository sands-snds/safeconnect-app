import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import ResidentAssistanceModal from './ResidentAssistanceModal';
import ResidentPettyCrimeModal from './ResidentPettyCrimeModal';

// Also listed in the footer (ResidentPage passes it to DonationFooter).
export const EMERGENCY_CONTACTS = [
  { id: 'police',       label: '911 Emergency',     sublabelKey: 'police',   number: '911',           icon: 'bi-shield-fill-exclamation', color: '#dc2626' },
  { id: 'dasma-police', label: 'Dasmariñas Police',  sublabelKey: 'dasma',    number: '+63462420002',  icon: 'bi-shield-fill',             color: '#1d4ed8' },
  { id: 'cdrmc',        label: 'CDRMC',              sublabelKey: 'cdrmc',    number: '+63462300345',  icon: 'bi-heart-pulse-fill',        color: '#059669' },
  { id: 'dswd',         label: 'DSWD',               sublabelKey: 'dswd',     number: '+63464165393',  icon: 'bi-people-fill',             color: '#ea580c' },
  { id: 'barangay',     label: 'Barangay Sta. Fe',   sublabelKey: 'barangay', number: '+639929474309', icon: 'bi-house-fill',              color: '#7c3aed' },
];

function EmergencyCallButton() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleCall = (number) => {
    window.location.href = `tel:${number}`;
    setOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 1050,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Contact Panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            zIndex: 1051,
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            padding: '16px',
            width: '280px',
            animation: 'slideUpFade 0.22s ease',
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <p style={{
              margin: 0,
              fontWeight: 700,
              fontSize: '14px',
              color: '#111',
              letterSpacing: '0.01em',
            }}>
              {t('emergencyContacts.title')}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>
              {t('emergencyContacts.subtitle')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {EMERGENCY_CONTACTS.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleCall(contact.number)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: `1.5px solid ${contact.color}22`,
                  background: `${contact.color}0d`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                  width: '100%',
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${contact.color}22`}
                onMouseLeave={e => e.currentTarget.style.background = `${contact.color}0d`}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: contact.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <i className={`bi ${contact.icon}`} style={{ color: '#fff', fontSize: '16px' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: '#111' }}>
                    {contact.label}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>
                    {t(`emergencyContacts.sublabels.${contact.sublabelKey}`)}
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: contact.color,
                  color: '#fff',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  flexShrink: 0,
                }}>
                  <i className="bi bi-telephone-fill" style={{ fontSize: '10px' }} />
                  {t('emergencyContacts.call')}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Emergency Contacts"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1052,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: open
            ? 'linear-gradient(135deg, #7f1d1d, #dc2626)'
            : 'linear-gradient(135deg, #dc2626, #ef4444)',
          border: 'none',
          boxShadow: open
            ? '0 4px 24px rgba(220,38,38,0.5)'
            : '0 4px 20px rgba(220,38,38,0.45)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
          transform: open ? 'scale(1.08) rotate(15deg)' : 'scale(1)',
          animation: open ? 'none' : 'pulse-ring 2s infinite',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <i
          className={open ? 'bi bi-x-lg' : 'bi bi-telephone-fill'}
          style={{ color: '#fff', fontSize: open ? '20px' : '22px' }}
        />
      </button>

      <style>{`
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.55), 0 4px 20px rgba(220,38,38,0.45); }
          60%  { box-shadow: 0 0 0 14px rgba(220,38,38,0), 0 4px 20px rgba(220,38,38,0.45); }
          100% { box-shadow: 0 0 0 0 rgba(220,38,38,0), 0 4px 20px rgba(220,38,38,0.45); }
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

function EmergencyReportSection({ onReportClick, onAssistanceClick, onPettyCrimeClick }) {

  const { t } = useLanguage();
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [showPettyCrimeModal, setShowPettyCrimeModal] = useState(false);

  const emergencies = [
    {
      id: 'emergency',
      title: t('emergencyReportSection.cards.emergency.title'),
      image: '/images/emergency.jpg',
      gradientFrom: '#7f1d1d',
      gradientTo: '#dc2626',
      badge: t('emergencyReportSection.cards.emergency.badge'),
      badgeClass: 'critical',
      description: t('emergencyReportSection.cards.emergency.description')
    },
    {
      id: 'assistance',
      title: t('emergencyReportSection.cards.assistance.title'),
      image: '/images/assistance.jpg',
      gradientFrom: '#7c2d12',
      gradientTo: '#ea580c',
      badge: t('emergencyReportSection.cards.assistance.badge'),
      badgeClass: 'high',
      description: t('emergencyReportSection.cards.assistance.description')
    },
    {
      id: 'petty-crime',
      title: t('emergencyReportSection.cards.pettyCrime.title'),
      image: '/images/crime.jpg',
      gradientFrom: '#450a0a',
      gradientTo: '#b91c1c',
      badge: t('emergencyReportSection.cards.pettyCrime.badge'),
      badgeClass: 'medium',
      description: t('emergencyReportSection.cards.pettyCrime.description')
    },
  ];

  const handleCardClick = (emergency) => {
    if (emergency.id === 'assistance') {
      setShowAssistanceModal(true);
    } else if (emergency.id === 'petty-crime') {
      setShowPettyCrimeModal(true);
    } else if (onReportClick) {
      onReportClick(emergency.title);
    }
  };

  return (
    <section className="emergency-report-section">

      <div className="assist-header" style={{ marginTop: '60px' }}>
        <div className="assist-icon-top">
          <i className="bi bi-exclamation-octagon-fill"></i>
        </div>

        <h2>{t('emergencyReportSection.title')}</h2>

        <p>
          {t('emergencyReportSection.subtitle')}
        </p>
      </div>

      <div className="center-container">
        <div className="emergency-cards">
          {emergencies.map((emergency) => (
            <div key={emergency.id} className={`emergency-card ${emergency.id}`}>
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
                <p className="card-desc">{emergency.description}</p>
              </div>

              <div className="card-actions">
                <button
                  className="report-btn"
                  onClick={() => handleCardClick(emergency)}
                >
                  {t('emergencyReportSection.reportButton')}
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

      {/* Fixed Floating Emergency Call Button */}
      <EmergencyCallButton />

    </section>
  );
}

export default EmergencyReportSection;