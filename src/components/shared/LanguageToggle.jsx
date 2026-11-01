import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import LanguageFlag from './LanguageFlag';




export default function LanguageToggle({ variant = 'light', className = '' }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`lang-toggle lang-toggle-${variant} ${className}`}>
      <style>{`
        .lang-toggle {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 3px;
          gap: 2px;
          flex-shrink: 0;
        }
        .lang-toggle-light { background: rgba(255, 255, 255, 0.15); }
        .lang-toggle-dark { background: #f4f0f1; }

        .lang-toggle button {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: none;
          background: transparent;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 10px 4px 5px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .lang-toggle-light button { color: rgba(255, 255, 255, 0.75); }
        .lang-toggle-light button.active { background: #fff; color: #6B2C3E; }

        .lang-toggle-dark button { color: #6b7280; }
        .lang-toggle-dark button.active { background: #6B2C3E; color: #fff; }
      `}</style>
      <button
        className={language === 'en' ? 'active' : ''}
        onClick={() => setLanguage('en')}
        aria-label="Switch to English"
      >
        <LanguageFlag language="en" size={16} />
        EN
      </button>
      <button
        className={language === 'tl' ? 'active' : ''}
        onClick={() => setLanguage('tl')}
        aria-label="Switch to Filipino"
      >
        <LanguageFlag language="tl" size={16} />
        FIL
      </button>
    </div>
  );
}
