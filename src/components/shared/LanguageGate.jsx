import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function LanguageGate() {
  const { hasChosenLanguage, setLanguage, t } = useLanguage();

  if (hasChosenLanguage) return null;

  return (
    <div className="lg-overlay">
      <style>{`
        .lg-overlay {
          position: fixed;
          inset: 0;
          z-index: 5000;
          background: linear-gradient(160deg, #6B2C3E 0%, #401826 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow: hidden;
        }

        .lg-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          opacity: 0.25;
        }
        .lg-blob-1 { width: 380px; height: 380px; background: #FFC107; top: -120px; left: -100px; }
        .lg-blob-2 { width: 320px; height: 320px; background: #14b8a6; bottom: -140px; right: -80px; }

        .lg-card {
          position: relative;
          z-index: 1;
          background: #fff;
          border-radius: 28px;
          width: 100%;
          max-width: 460px;
          padding: clamp(28px, 5vw, 44px);
          text-align: center;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
        }

        .lg-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #fff0f3;
          color: #6B2C3E;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin: 0 auto 18px;
        }

        .lg-eyebrow {
          margin: 0 0 6px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6B2C3E;
        }

        .lg-title { margin: 0 0 4px; font-size: 1.5rem; font-weight: 900; color: #111; }
        .lg-subtitle { margin: 0 0 28px; font-size: 0.9rem; color: #888; }

        .lg-options { display: flex; flex-direction: column; gap: 12px; }

        .lg-option {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          border: 2px solid #eee;
          background: #fff;
          border-radius: 16px;
          padding: 16px 18px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
        }

        .lg-option:hover { border-color: #6B2C3E; background: #fff8f9; transform: translateY(-2px); }

        .lg-option-flag {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 0.95rem;
          flex-shrink: 0;
          color: #fff;
        }

        .lg-option-text strong { display: block; font-size: 1rem; font-weight: 800; color: #111; }
        .lg-option-text span { display: block; font-size: 0.78rem; color: #999; margin-top: 2px; }

        .lg-option-arrow { margin-left: auto; color: #ccc; font-size: 1.1rem; flex-shrink: 0; }
        .lg-option:hover .lg-option-arrow { color: #6B2C3E; }

        .lg-footnote { margin: 22px 0 0; font-size: 0.75rem; color: #bbb; }
      `}</style>

      <div className="lg-blob lg-blob-1" />
      <div className="lg-blob lg-blob-2" />

      <div className="lg-card">
        <div className="lg-icon">
          <i className="bi bi-translate" />
        </div>
        <p className="lg-eyebrow">{t('languageGate.eyebrow')}</p>
        <h2 className="lg-title">{t('languageGate.title')}</h2>
        <p className="lg-subtitle">{t('languageGate.subtitle')}</p>

        <div className="lg-options">
          <button className="lg-option" onClick={() => setLanguage('en')}>
            <span className="lg-option-flag" style={{ background: '#6B2C3E' }}>EN</span>
            <span className="lg-option-text">
              <strong>{t('languageGate.english')}</strong>
              <span>{t('languageGate.englishNote')}</span>
            </span>
            <i className="bi bi-arrow-right lg-option-arrow" />
          </button>

          <button className="lg-option" onClick={() => setLanguage('tl')}>
            <span className="lg-option-flag" style={{ background: '#0d9488' }}>TL</span>
            <span className="lg-option-text">
              <strong>{t('languageGate.tagalog')}</strong>
              <span>{t('languageGate.tagalogNote')}</span>
            </span>
            <i className="bi bi-arrow-right lg-option-arrow" />
          </button>
        </div>

        <p className="lg-footnote">{t('languageGate.change')}</p>
      </div>
    </div>
  );
}
