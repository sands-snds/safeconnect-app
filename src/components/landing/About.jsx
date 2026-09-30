import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

const STEPS = [
  { key: 'submit',      icon: 'bi-send-fill',          color: '#dc2626', bg: '#fef2f2' },
  { key: 'respond',     icon: 'bi-bell-fill',           color: '#d97706', bg: '#fffbeb' },
  { key: 'stayUpdated', icon: 'bi-check-circle-fill',   color: '#0d9488', bg: '#f0fdfa' },
];

const STATS = [
  { key: 'alwaysOn',    icon: 'bi-clock-history',            value: '24/7' },
  { key: 'gpsTagged',   icon: 'bi-geo-alt-fill',              value: 'GPS' },
  { key: 'liveUpdates', icon: 'bi-lightning-charge-fill',     value: 'Live' },
];

export default function About() {
  const { t } = useLanguage();
  return (
    <section id="about" style={{ margin: 0, padding: 0, position: 'relative' }}>
      <style>{`
        .ab-outer {
          position: relative;
          padding: 110px 0 120px;
          background: linear-gradient(180deg, #fff6f0 0%, #ffffff 55%);
          overflow: hidden;
        }

        .ab-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          z-index: 0;
          pointer-events: none;
        }
        .ab-blob-1 { width: 420px; height: 420px; background: #6B2C3E; opacity: 0.16; top: -180px; right: -120px; animation: ab-float 9s ease-in-out infinite; }
        .ab-blob-2 { width: 320px; height: 320px; background: #FFC107; opacity: 0.22; bottom: -140px; left: -100px; animation: ab-float 11s ease-in-out infinite reverse; }
        .ab-blob-3 { width: 220px; height: 220px; background: #0d9488; opacity: 0.14; top: 38%; right: 6%; animation: ab-float 7s ease-in-out infinite; }

        @keyframes ab-float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-26px) translateX(10px); }
        }

        .ab-dots {
          position: absolute;
          width: 130px;
          height: 130px;
          top: 70px;
          left: 6%;
          background-image: radial-gradient(#6B2C3E 2px, transparent 2px);
          background-size: 18px 18px;
          opacity: 0.15;
          z-index: 0;
        }
        @media (max-width: 900px) { .ab-dots { display: none; } }

        .ab-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fff0f3;
          color: #6B2C3E;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 30px;
          border: 1.5px solid #f5c6d0;
        }

        .ab-intro { position: relative; z-index: 2; max-width: 680px; margin: 0 auto 30px; text-align: center; }
        .ab-intro h2 {
          margin: 18px 0 16px;
          font-size: clamp(1.9rem, 3.8vw, 2.8rem);
          font-weight: 900;
          color: #111;
          line-height: 1.18;
          letter-spacing: -0.02em;
        }
        .ab-highlight {
          background: linear-gradient(to top, rgba(255, 193, 7, 0.45) 38%, transparent 38%);
          padding: 0 2px;
        }
        .ab-intro p { margin: 0 auto; max-width: 540px; color: #777; line-height: 1.75; font-size: 1rem; }

        .ab-stats {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 34px;
        }
        .ab-stat-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          border-radius: 16px;
          padding: 12px 20px;
          box-shadow: 0 10px 28px rgba(107, 44, 62, 0.1);
          border: 1px solid #f5eef0;
        }
        .ab-stat-chip i { font-size: 1.25rem; color: #6B2C3E; }
        .ab-stat-chip strong { display: block; font-size: 1rem; font-weight: 900; color: #111; line-height: 1.1; }
        .ab-stat-chip span { display: block; font-size: 0.66rem; color: #999; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 2px; }

        .ab-steps-wrap {
          position: relative;
          z-index: 2;
          max-width: 940px;
          margin: 100px auto 0;
          display: flex;
          flex-direction: column;
          gap: 60px;
        }

        .ab-step-row { display: flex; align-items: center; gap: 50px; }
        .ab-step-row.reverse { flex-direction: row-reverse; }
        @media (max-width: 760px) {
          .ab-step-row, .ab-step-row.reverse { flex-direction: column; gap: 26px; text-align: center; }
        }

        .ab-step-visual {
          flex: 0 0 260px;
          height: 190px;
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        @media (max-width: 760px) { .ab-step-visual { width: 100%; flex-basis: auto; } }

        .ab-step-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.16);
          position: relative;
          z-index: 1;
        }
        .ab-step-num {
          position: absolute;
          right: 16px;
          bottom: -14px;
          font-size: 5.5rem;
          font-weight: 900;
          line-height: 1;
        }

        .ab-step-text { flex: 1; }
        .ab-step-text h3 { margin: 0 0 10px; font-size: 1.35rem; font-weight: 900; color: #111; }
        .ab-step-text p { margin: 0 auto; max-width: 420px; color: #777; line-height: 1.75; font-size: 0.95rem; }
        .ab-step-row:not(.reverse) .ab-step-text p { margin-left: 0; }
        .ab-step-row.reverse .ab-step-text p { margin-right: 0; }
        @media (max-width: 760px) {
          .ab-step-text p { margin: 0 auto; }
        }
      `}</style>

      <div className="ab-outer">
        <div className="ab-blob ab-blob-1" />
        <div className="ab-blob ab-blob-2" />
        <div className="ab-blob ab-blob-3" />
        <div className="ab-dots" />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>

          <div className="ab-intro">
            <div className="ab-badge">
              <i className="bi bi-info-circle-fill" /> {t('about.badge')}
            </div>
            <h2>{t('about.titlePrefix')} <span className="ab-highlight">{t('about.titleHighlight')}</span> {t('about.titleSuffix')}</h2>
            <p>{t('about.intro')}</p>

            <div className="ab-stats">
              {STATS.map((s) => (
                <div className="ab-stat-chip" key={s.key}>
                  <i className={`bi ${s.icon}`} />
                  <div>
                    <strong>{s.value}</strong>
                    <span>{t(`about.stats.${s.key}`)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ab-steps-wrap">
            {STEPS.map((step, i) => (
              <div className={`ab-step-row ${i % 2 === 1 ? 'reverse' : ''}`} key={step.key}>
                <div className="ab-step-visual" style={{ background: step.bg }}>
                  <span className="ab-step-num" style={{ color: `${step.color}25` }}>0{i + 1}</span>
                  <div className="ab-step-icon" style={{ background: step.color }}>
                    <i className={`bi ${step.icon}`} />
                  </div>
                </div>
                <div className="ab-step-text">
                  <h3>{t(`about.steps.${step.key}.title`)}</h3>
                  <p>{t(`about.steps.${step.key}.body`)}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
