import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

// Terms and Conditions, opened from any page by a link to "#terms" (the
// footer and the sign-up form use one), so it can also be shared as
// <site>/#terms. Mounted once in App.js. The text lives in translations.js
// under `terms` (English and Tagalog).

const TERMS_HASH = '#terms';

// Icon per section id (translations.js terms.sections[].id).
const SECTION_ICONS = {
  acceptance: 'bi-check2-square',
  about: 'bi-info-circle-fill',
  emergencies: 'bi-telephone-fill',
  account: 'bi-person-badge-fill',
  reports: 'bi-send-fill',
  falseReports: 'bi-exclamation-octagon-fill',
  anonymous: 'bi-incognito',
  community: 'bi-chat-dots-fill',
  privacy: 'bi-shield-lock-fill',
  limitations: 'bi-cloud-slash-fill',
  suspension: 'bi-person-x-fill',
  changes: 'bi-arrow-repeat',
  contact: 'bi-envelope-fill'
};

const isTermsHash = () => typeof window !== 'undefined' && window.location.hash === TERMS_HASH;

export default function TermsModal() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(isTermsHash);
  const bodyRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const onHashChange = () => setOpen(isTermsHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Drop "#terms" from the address without jumping the page, so the same
  // link opens it again next time.
  const close = useCallback(() => {
    setOpen(false);
    if (isTermsHash()) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  if (!open) return null;

  const terms = t('terms');
  const sections = Array.isArray(terms.sections) ? terms.sections : [];
  const summary = Array.isArray(terms.summary) ? terms.summary : [];

  const scrollToSection = (id) => {
    const target = bodyRef.current?.querySelector(`#terms-${id}`);
    if (target) bodyRef.current.scrollTo({ top: target.offsetTop - 12, behavior: 'smooth' });
  };

  return (
    <div className="tc-overlay" onClick={close}>
      <style>{`
        .tc-overlay {
          position: fixed; inset: 0; z-index: 10050;
          background: rgba(17, 17, 17, 0.6);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: tc-fade 0.18s ease;
        }
        @keyframes tc-fade { from { opacity: 0; } to { opacity: 1; } }
        .tc-panel {
          background: #fff; width: 100%; max-width: 820px; max-height: 90vh;
          border-radius: 16px; overflow: hidden;
          display: flex; flex-direction: column;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.3);
          animation: tc-rise 0.22s ease;
        }
        @keyframes tc-rise { from { transform: translateY(14px); opacity: 0; } to { transform: none; opacity: 1; } }

        .tc-header {
          position: relative;
          background: linear-gradient(135deg, #6B2C3E 0%, #8B3A52 100%);
          color: #fff; padding: 26px 28px 22px;
        }
        .tc-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255, 255, 255, 0.16); color: #fff;
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          padding: 4px 12px; border-radius: 30px; border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .tc-header h2 { margin: 12px 0 4px; font-size: clamp(1.4rem, 3vw, 1.9rem); font-weight: 900; letter-spacing: -0.01em; color: #fff; }
        .tc-updated { margin: 0; font-size: 0.82rem; color: rgba(255, 255, 255, 0.78); }
        .tc-close {
          position: absolute; top: 16px; right: 16px;
          width: 36px; height: 36px; border-radius: 50%;
          border: none; background: rgba(255, 255, 255, 0.16); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; cursor: pointer; transition: background 0.2s;
        }
        .tc-close:hover { background: rgba(255, 255, 255, 0.28); }
        .tc-close:focus-visible { outline: 2px solid #FFC107; outline-offset: 2px; }

        .tc-body { overflow-y: auto; padding: 24px 28px 8px; position: relative; }

        .tc-summary {
          background: #fff6f0; border: 1.5px solid #f5c6d0; border-radius: 12px;
          padding: 16px 18px; margin-bottom: 22px;
        }
        .tc-summary h3 { font-size: 0.95rem; font-weight: 800; color: #6B2C3E; margin: 0 0 10px; display: flex; align-items: center; gap: 8px; }
        .tc-summary ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
        .tc-summary li { display: flex; gap: 10px; font-size: 0.9rem; color: #374151; line-height: 1.5; }
        .tc-summary li i { color: #0d9488; margin-top: 2px; flex-shrink: 0; }

        .tc-contents-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #6b7280; margin: 0 0 8px; }
        .tc-contents { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 26px; }
        .tc-chip {
          border: 1.5px solid #f5c6d0; background: #fff0f3; color: #6B2C3E;
          font-size: 0.78rem; font-weight: 600; padding: 5px 12px; border-radius: 30px;
          cursor: pointer; transition: background 0.2s, color 0.2s;
          max-width: 100%; text-align: left;
        }
        .tc-chip:hover, .tc-chip:focus-visible { background: #6B2C3E; color: #fff; outline: none; }

        .tc-section { display: flex; gap: 14px; padding: 18px 0; border-top: 1px solid #f1f1f1; }
        .tc-section:first-of-type { border-top: none; padding-top: 0; }
        .tc-num {
          flex-shrink: 0; width: 38px; height: 38px; border-radius: 10px;
          background: #fff0f3; color: #6B2C3E;
          display: flex; align-items: center; justify-content: center; font-size: 17px;
        }
        .tc-section h3 { font-size: 1rem; font-weight: 800; color: #111; margin: 6px 0 8px; }
        .tc-section h3 span { color: #6B2C3E; margin-right: 6px; }
        .tc-section ul { margin: 0; padding-left: 18px; display: grid; gap: 6px; }
        .tc-section li { font-size: 0.9rem; color: #4b5563; line-height: 1.6; }
        .tc-section li::marker { color: #6B2C3E; }

        .tc-footer { padding: 14px 28px 18px; border-top: 1px solid #f1f1f1; background: #fff; display: flex; justify-content: flex-end; }
        .tc-agree {
          background: #6B2C3E; color: #fff; border: none; border-radius: 30px;
          padding: 11px 26px; font-weight: 700; font-size: 0.9rem; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px; transition: background 0.2s;
        }
        .tc-agree:hover { background: #561f30; }

        @media (max-width: 576px) {
          .tc-overlay { padding: 0; align-items: stretch; }
          .tc-panel { max-height: none; height: 100%; border-radius: 0; }
          .tc-header { padding: 22px 18px 18px; }
          .tc-body { padding: 18px 18px 4px; }
          .tc-footer { padding: 12px 18px 16px; }
          .tc-agree { width: 100%; justify-content: center; }
          .tc-num { width: 32px; height: 32px; font-size: 15px; }
        }
      `}</style>

      <div
        className="tc-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tc-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tc-header">
          <span className="tc-badge"><i className="bi bi-file-earmark-text-fill"></i> {terms.badge}</span>
          <h2 id="tc-title">{terms.title}</h2>
          <p className="tc-updated">{terms.lastUpdated}</p>
          <button ref={closeRef} type="button" className="tc-close" onClick={close} aria-label={terms.close}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="tc-body" ref={bodyRef}>
          <div className="tc-summary">
            <h3><i className="bi bi-lightning-charge-fill"></i> {terms.summaryTitle}</h3>
            <ul>
              {summary.map((line) => (
                <li key={line}><i className="bi bi-check-circle-fill"></i><span>{line}</span></li>
              ))}
            </ul>
          </div>

          <p className="tc-contents-label">{terms.contents}</p>
          <nav className="tc-contents" aria-label={terms.contents}>
            {sections.map((section, i) => (
              <button key={section.id} type="button" className="tc-chip" onClick={() => scrollToSection(section.id)}>
                {i + 1}. {section.title}
              </button>
            ))}
          </nav>

          {sections.map((section, i) => (
            <section key={section.id} id={`terms-${section.id}`} className="tc-section">
              <div className="tc-num" aria-hidden="true">
                <i className={`bi ${SECTION_ICONS[section.id] || 'bi-dot'}`}></i>
              </div>
              <div>
                <h3><span>{i + 1}.</span>{section.title}</h3>
                <ul>
                  {section.points.map((point) => <li key={point}>{point}</li>)}
                </ul>
              </div>
            </section>
          ))}
        </div>

        <div className="tc-footer">
          <button type="button" className="tc-agree" onClick={close}>
            <i className="bi bi-check2"></i> {terms.understand}
          </button>
        </div>
      </div>
    </div>
  );
}
