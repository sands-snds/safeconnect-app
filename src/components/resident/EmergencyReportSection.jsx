import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import useSiteContent from '../shared/useSiteContent';
import EmergencyContactList from '../shared/EmergencyContactList';
import ResidentAssistanceModal from './ResidentAssistanceModal';
import ResidentPettyCrimeModal from './ResidentPettyCrimeModal';

function EmergencyCallButton() {
  const { t } = useLanguage();
  // Editable by Admins under Content > Site Contacts; also the footer's hotlines.
  const { emergencyContacts } = useSiteContent();
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
            width: '290px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
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

          <EmergencyContactList contacts={emergencyContacts} onCall={handleCall} />
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

  const cardTheme = {
    emergency: { key: 'emergency', icon: 'bi-exclamation-triangle-fill', color: '#dc2626' },
    assistance: { key: 'assistance', icon: 'bi-life-preserver', color: '#ea580c' },
    'petty-crime': { key: 'pettyCrime', icon: 'bi-shield-fill-exclamation', color: '#7c3aed' }
  };

  return (
    <section className="emergency-report-section">
      <style>{`
        /* Padding is on .ir-outer: styles/App.css zeroes every <section>'s padding. */
        .ir-outer { position: relative; padding: 96px 0 88px; background: linear-gradient(180deg, #ffffff 0%, #fbf7f8 100%); overflow: hidden; }
        .ir-blob { position: absolute; border-radius: 50%; filter: blur(70px); pointer-events: none; z-index: 0; }
        .ir-blob-1 { width: 340px; height: 340px; background: #dc2626; opacity: 0.08; top: -120px; left: -100px; }
        .ir-blob-2 { width: 300px; height: 300px; background: #6B2C3E; opacity: 0.1; bottom: -120px; right: -90px; }
        .ir-inner { position: relative; z-index: 1; max-width: 1080px; margin: 0 auto; padding: 0 16px; }

        .ir-intro { max-width: 640px; margin: 0 auto 48px; text-align: center; }
        .ir-badge { display: inline-flex; align-items: center; gap: 6px; background: #fff0f3; color: #6B2C3E; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 14px; border-radius: 30px; border: 1.5px solid #f5c6d0; margin-bottom: 18px; }
        .ir-intro h2 { margin: 0 0 14px; font-size: clamp(1.9rem, 3.8vw, 2.8rem); font-weight: 900; color: #111; line-height: 1.18; letter-spacing: -0.02em; }
        .ir-intro p { margin: 0; color: #5b6170; line-height: 1.75; font-size: 1rem; }
        .ir-intro .ir-priority-note { display: inline-flex; align-items: flex-start; gap: 7px; margin-top: 14px; padding: 8px 14px; border-radius: 12px; background: #fff; border: 1px solid #f0eaec; color: #4b5563; font-size: 0.86rem; line-height: 1.5; text-align: left; }
        .ir-priority-note i { color: #6B2C3E; margin-top: 2px; }

        .ir-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
        .ir-card { display: flex; flex-direction: column; background: #fff; border: 1.5px solid #f0eaec; border-radius: 22px; overflow: hidden; box-shadow: 0 10px 30px rgba(107, 44, 62, 0.07); transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .ir-card:hover { transform: translateY(-5px); box-shadow: 0 18px 40px rgba(107, 44, 62, 0.13); }
        .ir-media { position: relative; aspect-ratio: 16 / 10; background-size: cover; background-position: center; }
        .ir-priority { position: absolute; top: 14px; left: 14px; display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.94); border-radius: 999px; padding: 4px 11px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
        .ir-priority::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
        .ir-icon { position: absolute; left: 22px; bottom: -24px; width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.35rem; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18); border: 3px solid #fff; }
        .ir-body { display: flex; flex-direction: column; flex: 1; padding: 38px 22px 22px; }
        .ir-body h3 { margin: 0 0 8px; font-size: 1.15rem; font-weight: 800; color: #111; }
        .ir-desc { margin: 0 0 20px; color: #4b5563; font-size: 0.92rem; line-height: 1.6; }
        /* Same size on every card, lined up along the bottom. */
        .ir-cta { margin-top: auto; flex: none; width: 100%; height: 48px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; border-radius: 12px; padding: 0 16px; color: #fff; font-weight: 700; font-size: 0.95rem; white-space: nowrap; cursor: pointer; transition: filter 0.15s, transform 0.05s; }
        .ir-cta:hover { filter: brightness(1.07); }
        .ir-cta:active { transform: translateY(1px); }
        .ir-cta:focus-visible { outline: 3px solid #6B2C3E; outline-offset: 2px; }
        .ir-cta i { transition: transform 0.2s; }
        .ir-cta:hover i { transform: translateX(3px); }

        .ir-trust { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 36px 0 0; padding: 0; list-style: none; }
        .ir-trust li { display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid #f0eaec; border-radius: 14px; padding: 12px 14px; color: #374151; font-size: 0.86rem; font-weight: 600; }
        .ir-trust i { color: #6B2C3E; font-size: 1.1rem; flex-shrink: 0; }
        .ir-danger { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 18px 0 0; text-align: center; color: #991b1b; font-size: 0.88rem; font-weight: 600; }

        @media (max-width: 900px) {
          .ir-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .ir-trust { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .ir-outer { padding: 72px 0 64px; }
          .ir-intro { margin-bottom: 32px; }
          .ir-cards { grid-template-columns: 1fr; gap: 18px; }
          .ir-danger { align-items: flex-start; text-align: left; }
        }
      `}</style>

      <div className="ir-outer">
        <div className="ir-blob ir-blob-1" />
        <div className="ir-blob ir-blob-2" />
        <div className="ir-inner">
          <div className="ir-intro">
            <div className="ir-badge"><i className="bi bi-lightning-charge-fill" /> {t('emergencyReportSection.badge')}</div>
            <h2>{t('emergencyReportSection.title')}</h2>
            <p>{t('emergencyReportSection.subtitle')}</p>
            <p className="ir-priority-note"><i className="bi bi-info-circle-fill" aria-hidden="true" />{t('emergencyReportSection.priorityNote')}</p>
          </div>

          <div className="ir-cards">
            {emergencies.map((emergency) => {
              const theme = cardTheme[emergency.id];
              return (
                <article key={emergency.id} className={`ir-card ${emergency.id}`}>
                  <div
                    className="ir-media"
                    style={{ backgroundImage: `linear-gradient(180deg, rgba(20,8,12,0.05) 0%, rgba(20,8,12,0.45) 100%), url(${emergency.image})` }}
                  >
                    <span className="ir-priority" style={{ color: theme.color }}>{emergency.badge}</span>
                    <span className="ir-icon" style={{ background: theme.color }} aria-hidden="true"><i className={`bi ${theme.icon}`} /></span>
                  </div>
                  <div className="ir-body">
                    <h3>{emergency.title}</h3>
                    <p className="ir-desc">{emergency.description}</p>
                    <button
                      type="button"
                      className="ir-cta"
                      style={{ background: theme.color }}
                      onClick={() => handleCardClick(emergency)}
                    >
                      {t(`emergencyReportSection.cards.${theme.key}.cta`)} <i className="bi bi-arrow-right" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <ul className="ir-trust">
            <li><i className="bi bi-clock-history" aria-hidden="true" />{t('emergencyReportSection.trust.alwaysOn')}</li>
            <li><i className="bi bi-geo-alt-fill" aria-hidden="true" />{t('emergencyReportSection.trust.located')}</li>
            <li><i className="bi bi-bell-fill" aria-hidden="true" />{t('emergencyReportSection.trust.tracked')}</li>
          </ul>
          <p className="ir-danger"><i className="bi bi-telephone-fill" aria-hidden="true" />{t('emergencyReportSection.dangerNote')}</p>
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