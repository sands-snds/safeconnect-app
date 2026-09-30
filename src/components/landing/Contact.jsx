import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

const HOTLINES = [
  { key: 'barangay', phone: '+63 992 947 4309', icon: 'bi-house-fill',       color: '#6B2C3E' },
  { key: 'dasma',     phone: '+63 46 242 0002',  icon: 'bi-shield-fill',      color: '#3b82f6' },
  { key: 'cdrmc',     phone: '+63 46 230 0345',  icon: 'bi-heart-pulse-fill', color: '#10b981' },
];

export default function Contact() {
  const { t } = useLanguage();
  return (
    <section id="contact" style={{ margin: 0, padding: 0 }}>
      <style>{`
        .ct-outer { position: relative; padding: 110px 0; background: #fff; overflow: hidden; }

        .ct-badge { display: inline-flex; align-items: center; gap: 6px; background: #fff0f3; color: #6B2C3E; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 14px; border-radius: 30px; border: 1.5px solid #f5c6d0; margin-bottom: 18px; }

        .ct-intro { max-width: 620px; margin: 0 auto 56px; text-align: center; }
        .ct-intro h2 { margin: 0 0 16px; font-size: clamp(1.9rem, 3.8vw, 2.8rem); font-weight: 900; color: #111; line-height: 1.18; letter-spacing: -0.02em; }
        .ct-intro p { margin: 0; color: #777; line-height: 1.75; font-size: 1rem; }

        .ct-split { display: grid; grid-template-columns: 300px 1fr; gap: 22px; max-width: 980px; margin: 0 auto; align-items: stretch; }
        @media (max-width: 820px) { .ct-split { grid-template-columns: 1fr; } }

        .ct-sos {
          position: relative;
          background: linear-gradient(160deg, #6B2C3E 0%, #401826 100%);
          border-radius: 28px;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          overflow: hidden;
        }
        .ct-sos-ring { position: absolute; border: 2px solid rgba(255, 255, 255, 0.25); border-radius: 50%; }
        .ct-sos-ring.r1 { width: 140px; height: 140px; animation: ct-pulse 2.6s ease-out infinite; }
        .ct-sos-ring.r2 { width: 200px; height: 200px; animation: ct-pulse 2.6s ease-out infinite 0.7s; }
        @keyframes ct-pulse {
          0% { transform: scale(0.65); opacity: 0.8; }
          100% { transform: scale(1.35); opacity: 0; }
        }

        .ct-sos-icon {
          position: relative;
          z-index: 1;
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: #dc2626;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          margin-bottom: 20px;
          box-shadow: 0 0 0 8px rgba(255, 255, 255, 0.08);
        }
        .ct-sos-eyebrow { position: relative; z-index: 1; color: #FFC107; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 6px; }
        .ct-sos-label { position: relative; z-index: 1; color: rgba(255, 255, 255, 0.8); font-size: 0.85rem; margin: 0 0 18px; line-height: 1.6; }
        .ct-sos-btn {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #dc2626;
          color: #fff;
          font-weight: 800;
          padding: 14px 26px;
          border-radius: 999px;
          text-decoration: none;
          font-size: 0.98rem;
          box-shadow: 0 10px 26px rgba(220, 38, 38, 0.45);
          transition: transform 0.2s ease;
        }
        .ct-sos-btn:hover { transform: scale(1.05); }

        .ct-list { display: flex; flex-direction: column; gap: 12px; }
        .ct-row {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #fff;
          border: 1.5px solid #f0eef0;
          border-radius: 18px;
          padding: 16px 20px;
          text-decoration: none;
          transition: all 0.2s ease;
          flex-wrap: wrap;
        }
        .ct-row:hover { border-color: #e0dde0; box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06); transform: translateX(4px); }

        .ct-row-icon { width: 46px; height: 46px; border-radius: 13px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .ct-row-text { flex: 1; min-width: 160px; }
        .ct-row-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .ct-row-top strong { font-size: 0.98rem; color: #111; font-weight: 800; }
        .ct-row-badge { font-size: 0.64rem; font-weight: 700; padding: 2px 9px; border-radius: 20px; }
        .ct-row-text p { margin: 3px 0 0; font-size: 0.78rem; color: #999; }
        .ct-row-phone { font-size: 0.85rem; font-weight: 800; white-space: nowrap; display: flex; align-items: center; gap: 6px; flex-shrink: 0; margin-left: auto; }

        .ct-banner {
          position: relative;
          border-radius: 28px;
          padding: 32px;
          background: linear-gradient(135deg, #6B2C3E 0%, #9a4a63 100%);
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
          max-width: 980px;
          margin: 26px auto 0;
          overflow: hidden;
        }
        .ct-banner-shape { position: absolute; width: 240px; height: 240px; border-radius: 50%; background: rgba(255, 255, 255, 0.08); top: -100px; right: -60px; }
        .ct-banner-shape-2 { position: absolute; width: 140px; height: 140px; border-radius: 50%; background: rgba(255, 193, 7, 0.14); bottom: -60px; left: 8%; }
      `}</style>
      <div className="ct-outer">
        <div className="container">

          <div className="ct-intro">
            <div className="ct-badge">
              <i className="bi bi-telephone-fill" /> {t('contact.badge')}
            </div>
            <h2>{t('contact.title')}</h2>
            <p>{t('contact.subtitle')}</p>
          </div>

          <div className="ct-split">
            <div className="ct-sos">
              <div className="ct-sos-ring r1" />
              <div className="ct-sos-ring r2" />
              <div className="ct-sos-icon">
                <i className="bi bi-telephone-fill" />
              </div>
              <p className="ct-sos-eyebrow">{t('contact.sosEyebrow')}</p>
              <p className="ct-sos-label">{t('contact.sosLabel')}</p>
              <a href="tel:911" className="ct-sos-btn">
                <i className="bi bi-telephone-outbound-fill" /> {t('contact.sosButton')}
              </a>
            </div>

            <div className="ct-list">
              {HOTLINES.map((h) => (
                <a key={h.key} href={`tel:${h.phone.replace(/\s/g, '')}`} className="ct-row">
                  <div className="ct-row-icon" style={{ background: `${h.color}15`, color: h.color }}>
                    <i className={`bi ${h.icon}`} />
                  </div>
                  <div className="ct-row-text">
                    <div className="ct-row-top">
                      <strong>{t(`contact.hotlines.${h.key}.title`)}</strong>
                      <span className="ct-row-badge" style={{ color: h.color, background: `${h.color}15` }}>{t(`contact.hotlines.${h.key}.sub`)}</span>
                    </div>
                    <p>{t(`contact.hotlines.${h.key}.note`)}</p>
                  </div>
                  <div className="ct-row-phone" style={{ color: h.color }}>
                    {h.phone} <i className="bi bi-arrow-up-right-circle-fill" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="ct-banner">
            <div className="ct-banner-shape" />
            <div className="ct-banner-shape-2" />
            <div style={{ position: 'relative', zIndex: 1, width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="bi bi-phone-fill" style={{ color: '#fff', fontSize: 22 }} />
            </div>
            <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 200 }}>
              <p style={{ margin: '0 0 4px', fontWeight: 800, color: '#fff', fontSize: '1rem' }}>{t('contact.bannerTitle')}</p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.72)', fontSize: '0.85rem', lineHeight: 1.65 }}>{t('contact.bannerDesc')}</p>
            </div>
            <a href="#home" style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: '#fff', color: '#6B2C3E', fontWeight: 800, fontSize: '0.87rem', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>
              {t('contact.bannerCta')} <i className="bi bi-arrow-right" />
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
