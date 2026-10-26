import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { TERMS_HASH, markTermsViewed } from './termsConsent';

// Terms and Conditions, opened from any page by a link to "#terms" (the
// footer and the Sign Up form use one), so it can also be shared as
// <site>/#terms. Mounted once in App.js. The text lives in translations.js
// under `terms` (English and Tagalog). Opening it counts as having viewed
// the Terms, which the Sign Up checkbox requires (termsConsent.js).

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
    if (open) markTermsViewed();
  }, [open]);

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

  return (
    <div className="tc-overlay" onClick={close}>
      <style>{`
        .tc-overlay {
          position: fixed; inset: 0; z-index: 10050;
          background: rgba(17, 17, 17, 0.55);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .tc-panel {
          background: #fff; width: 100%; max-width: 760px; max-height: 90vh;
          border-radius: 8px; overflow: hidden;
          display: flex; flex-direction: column;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
        }
        .tc-header {
          position: relative;
          padding: 24px 64px 18px 32px;
          border-bottom: 1px solid #e5e7eb;
        }
        .tc-header h2 { margin: 0 0 4px; font-size: 1.5rem; font-weight: 700; color: #1f2937; }
        .tc-updated { margin: 0; font-size: 0.85rem; color: #6b7280; }
        .tc-close {
          position: absolute; top: 20px; right: 20px;
          width: 34px; height: 34px; border-radius: 6px;
          border: none; background: transparent; color: #6b7280;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; cursor: pointer;
        }
        .tc-close:hover { background: #f3f4f6; color: #1f2937; }
        .tc-close:focus-visible { outline: 2px solid #6B2C3E; outline-offset: 2px; }

        .tc-body { overflow-y: auto; padding: 24px 32px 12px; color: #374151; }
        .tc-intro { margin: 0 0 24px; font-size: 0.95rem; line-height: 1.7; }
        /* div, not <section>: styles/App.css zeroes every section's margin and padding with !important */
        .tc-section { margin-bottom: 24px; }
        .tc-section:last-child { margin-bottom: 12px; }
        .tc-section h3 { margin: 0 0 8px; font-size: 1rem; font-weight: 700; color: #6B2C3E; }
        .tc-section ol { list-style: none; margin: 0; padding: 0; }
        .tc-section li {
          display: grid; grid-template-columns: 2.5rem 1fr;
          font-size: 0.92rem; line-height: 1.7; margin-bottom: 6px;
        }
        .tc-clause { color: #6b7280; }

        .tc-footer {
          padding: 14px 32px; border-top: 1px solid #e5e7eb;
          display: flex; justify-content: flex-end;
        }
        .tc-agree {
          background: #6B2C3E; color: #fff; border: none; border-radius: 6px;
          padding: 9px 22px; font-weight: 600; font-size: 0.9rem; cursor: pointer;
        }
        .tc-agree:hover { background: #561f30; }

        @media (max-width: 576px) {
          .tc-overlay { padding: 0; align-items: stretch; }
          .tc-panel { max-height: none; height: 100%; border-radius: 0; }
          .tc-header { padding: 20px 56px 14px 18px; }
          .tc-close { top: 14px; right: 12px; }
          .tc-body { padding: 18px 18px 8px; }
          .tc-footer { padding: 12px 18px; }
          .tc-agree { width: 100%; }
          .tc-section li { grid-template-columns: 2.25rem 1fr; }
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
          <h2 id="tc-title">{terms.title}</h2>
          <p className="tc-updated">{terms.lastUpdated}</p>
          <button ref={closeRef} type="button" className="tc-close" onClick={close} aria-label={terms.close}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="tc-body" ref={bodyRef}>
          <p className="tc-intro">{terms.intro}</p>

          {sections.map((section, i) => (
            <div key={section.id} id={`terms-${section.id}`} className="tc-section">
              <h3>{i + 1}. {section.title}</h3>
              <ol>
                {section.points.map((point, j) => (
                  <li key={point}>
                    <span className="tc-clause">{i + 1}.{j + 1}</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <div className="tc-footer">
          <button type="button" className="tc-agree" onClick={close}>{terms.understand}</button>
        </div>
      </div>
    </div>
  );
}
