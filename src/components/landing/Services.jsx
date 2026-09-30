import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

const FEATURES = [
  { key: 'emergencyReports',  icon: 'bi-exclamation-octagon-fill',      color: '#ef4444', gradient: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)', size: 'featured' },
  { key: 'assistanceRequests',icon: 'bi-hand-heart-fill',               color: '#f97316', size: 'small' },
  { key: 'crimeReports',      icon: 'bi-eye-slash-fill',                color: '#8b5cf6', size: 'small' },
  { key: 'announcements',     icon: 'bi-megaphone-fill',                color: '#0ea5e9', size: 'small' },
  { key: 'liveWeather',       icon: 'bi-cloud-lightning-rain-fill',     color: '#14b8a6', size: 'small' },
  { key: 'yourProfile',       icon: 'bi-person-badge-fill',             color: '#6366f1', size: 'wide' },
];

export default function Services() {
  const { t } = useLanguage();
  return (
    <section id="services" style={{ margin: 0, padding: 0 }}>
      <style>{`
        .svc-outer { position: relative; padding: 110px 0; background: #faf8f9; overflow: hidden; }

        .svc-blob { position: absolute; border-radius: 50%; filter: blur(70px); z-index: 0; pointer-events: none; }
        .svc-blob-1 { width: 360px; height: 360px; background: #6366f1; opacity: 0.12; top: -110px; left: -110px; }
        .svc-blob-2 { width: 300px; height: 300px; background: #14b8a6; opacity: 0.14; bottom: -120px; right: -80px; }

        .svc-badge { display: inline-flex; align-items: center; gap: 6px; background: #fff0f3; color: #6B2C3E; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 14px; border-radius: 30px; border: 1.5px solid #f5c6d0; margin-bottom: 18px; }

        .svc-intro { position: relative; z-index: 2; max-width: 620px; margin: 0 auto 56px; text-align: center; }
        .svc-intro h2 { margin: 0 0 16px; font-size: clamp(1.9rem, 3.8vw, 2.8rem); font-weight: 900; color: #111; line-height: 1.18; letter-spacing: -0.02em; }
        .svc-intro p { margin: 0; color: #777; line-height: 1.75; font-size: 1rem; }

        .svc-bento {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-auto-rows: 175px;
          gap: 20px;
          max-width: 980px;
          margin: 0 auto;
        }

        .svc-tile {
          border-radius: 24px;
          padding: 26px;
          position: relative;
          overflow: hidden;
          background: #fff;
          border: 1.5px solid #f0eef0;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .svc-tile:hover { transform: translateY(-5px); box-shadow: 0 16px 36px rgba(0, 0, 0, 0.09); }

        .svc-tile.featured {
          grid-column: span 2;
          grid-row: span 2;
          color: #fff;
          border: none;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        .svc-tile.small { grid-column: span 1; grid-row: span 1; display: flex; flex-direction: column; justify-content: center; }
        .svc-tile.wide { grid-column: span 4; grid-row: span 1; }

        .svc-tile-watermark { position: absolute; top: -18px; right: -14px; font-size: 9rem; opacity: 0.15; }

        .svc-tile-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 14px; flex-shrink: 0; }
        .svc-tile-icon.light { background: rgba(255, 255, 255, 0.22); color: #fff; }

        .svc-tile h3 { margin: 0 0 6px; font-weight: 800; font-size: 1rem; color: #111; }
        .svc-tile p { margin: 0; font-size: 0.85rem; line-height: 1.6; color: #888; }
        .svc-tile.featured h3 { font-size: 1.35rem; color: #fff; }
        .svc-tile.featured p { color: rgba(255, 255, 255, 0.88); font-size: 0.88rem; }

        .svc-wide-inner { display: flex; align-items: center; gap: 20px; height: 100%; }
        .svc-wide-inner .svc-tile-icon { margin-bottom: 0; }

        @media (max-width: 900px) {
          .svc-bento { grid-template-columns: repeat(2, 1fr); grid-auto-rows: auto; }
          .svc-tile.featured { grid-column: span 2; grid-row: span 1; min-height: 220px; }
          .svc-tile.small { min-height: 180px; }
          .svc-tile.wide { grid-column: span 2; }
        }
        @media (max-width: 560px) {
          .svc-bento { grid-template-columns: 1fr; }
          .svc-tile.featured, .svc-tile.small, .svc-tile.wide { grid-column: span 1; }
          .svc-wide-inner { flex-direction: column; align-items: flex-start; text-align: left; }
        }
      `}</style>
      <div className="svc-outer">
        <div className="svc-blob svc-blob-1" />
        <div className="svc-blob svc-blob-2" />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>

          <div className="svc-intro">
            <div className="svc-badge">
              <i className="bi bi-stars" /> {t('services.badge')}
            </div>
            <h2>{t('services.title')}</h2>
            <p>{t('services.subtitle')}</p>
          </div>

          <div className="svc-bento">
            {FEATURES.map((item) => {
              if (item.size === 'featured') {
                return (
                  <div key={item.key} className="svc-tile featured" style={{ background: item.gradient }}>
                    <i className={`bi ${item.icon} svc-tile-watermark`} />
                    <div className="svc-tile-icon light"><i className={`bi ${item.icon}`} /></div>
                    <h3>{t(`services.features.${item.key}.label`)}</h3>
                    <p>{t(`services.features.${item.key}.desc`)}</p>
                  </div>
                );
              }
              if (item.size === 'wide') {
                return (
                  <div key={item.key} className="svc-tile wide">
                    <div className="svc-wide-inner">
                      <div className="svc-tile-icon" style={{ background: `${item.color}18`, color: item.color }}>
                        <i className={`bi ${item.icon}`} />
                      </div>
                      <div>
                        <h3>{t(`services.features.${item.key}.label`)}</h3>
                        <p>{t(`services.features.${item.key}.desc`)}</p>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={item.key} className="svc-tile small">
                  <div className="svc-tile-icon" style={{ background: `${item.color}18`, color: item.color }}>
                    <i className={`bi ${item.icon}`} />
                  </div>
                  <h3>{t(`services.features.${item.key}.label`)}</h3>
                  <p>{t(`services.features.${item.key}.desc`)}</p>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
