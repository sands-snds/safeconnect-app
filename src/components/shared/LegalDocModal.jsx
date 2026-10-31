import React, { useCallback, useEffect, useRef, useState } from 'react';










export default function LegalDocModal({ hash, doc, idPrefix, onOpen, renderAfterSection }) {
  const isOpenHash = useCallback(() => typeof window !== 'undefined' && window.location.hash === hash, [hash]);
  const [open, setOpen] = useState(isOpenHash);
  const bodyRef = useRef(null);
  const closeRef = useRef(null);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  useEffect(() => {
    const onHashChange = () => setOpen(isOpenHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [isOpenHash]);

  
  
  const close = useCallback(() => {
    setOpen(false);
    if (isOpenHash()) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [isOpenHash]);

  useEffect(() => {
    if (open && onOpenRef.current) onOpenRef.current();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    
    
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      close();
    };
    window.addEventListener('keydown', onKey, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  if (!open) return null;

  const sections = Array.isArray(doc.sections) ? doc.sections : [];
  const titleId = `${idPrefix}-title`;

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
        .tc-extra { margin: 8px 0 0 2.5rem; font-size: 0.92rem; line-height: 1.7; }
        .tc-extra a { color: #6B2C3E; font-weight: 600; overflow-wrap: anywhere; }

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
          .tc-extra { margin-left: 2.25rem; }
        }
      `}</style>

      <div
        className="tc-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tc-header">
          <h2 id={titleId}>{doc.title}</h2>
          <p className="tc-updated">{doc.lastUpdated}</p>
          <button ref={closeRef} type="button" className="tc-close" onClick={close} aria-label={doc.close}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="tc-body" ref={bodyRef}>
          <p className="tc-intro">{doc.intro}</p>

          {sections.map((section, i) => (
            <div key={section.id} id={`${idPrefix}-${section.id}`} className="tc-section">
              <h3>{i + 1}. {section.title}</h3>
              <ol>
                {section.points.map((point, j) => (
                  <li key={point}>
                    <span className="tc-clause">{i + 1}.{j + 1}</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ol>
              {renderAfterSection && renderAfterSection(section)}
            </div>
          ))}
        </div>

        <div className="tc-footer">
          <button type="button" className="tc-agree" onClick={close}>{doc.understand}</button>
        </div>
      </div>
    </div>
  );
}
