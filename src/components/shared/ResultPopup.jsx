import React, { useEffect } from 'react';

// Success / warning / error popup used across the app in place of the
// browser's alert(). Same look as the resident "Report Submitted" popup.
// Render it directly, or call showPopup() (./popup.js) from anywhere.
//
// Props:
//   type        - "success" (green check), "warning" (amber !) or "error" (red !)
//   title       - e.g. "Announcement Posted"
//   message     - one or two sentences under the title
//   buttonLabel - defaults to "Done" for success, "OK" otherwise
//   accent      - button color; defaults to the admin maroon on /admin and
//                 the resident red elsewhere
//   onClose     - called by the button, Esc or clicking outside

const ICONS = {
  success: { icon: 'bi-check-lg', color: '#16a34a' },
  warning: { icon: 'bi-exclamation-lg', color: '#d97706' },
  error: { icon: 'bi-exclamation-lg', color: '#dc2626' }
};

const defaultAccent = () =>
  typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
    ? '#6B2C3E'
    : '#dc3545';

const ResultPopup = ({ type = 'success', title, message, buttonLabel, accent, onClose }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const { icon, color } = ICONS[type] || ICONS.success;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        // Above the report modals and the success popups (10001).
        zIndex: 10050,
        padding: '20px'
      }}
    >
      <div
        role="alertdialog"
        aria-labelledby="result-popup-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '400px',
          width: '100%',
          padding: '28px 24px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'resultPopupIn 0.18s ease-out'
        }}
      >
        <style>{`
          @keyframes resultPopupIn {
            from { opacity: 0; transform: translateY(8px) scale(0.97); }
            to { opacity: 1; transform: none; }
          }
        `}</style>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          margin: '0 auto 16px'
        }}>
          <i className={`bi ${icon}`}></i>
        </div>
        <h3 id="result-popup-title" style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#1f2937' }}>
          {title}
        </h3>
        {message && (
          <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#4b5563', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
            {message}
          </p>
        )}
        <button
          type="button"
          autoFocus
          onClick={onClose}
          style={{
            padding: '12px 20px',
            borderRadius: '24px',
            border: 'none',
            background: accent || defaultAccent(),
            color: 'white',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          {buttonLabel || (type === 'success' ? 'Done' : 'OK')}
        </button>
      </div>
    </div>
  );
};

export default ResultPopup;
