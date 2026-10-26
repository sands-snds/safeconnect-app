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
//
// Confirmation (in place of window.confirm(); see confirmPopup() in
// ./popup.js): pass cancelLabel and onCancel too. Then there are two
// buttons, the main one calls onClose (= confirmed), and Esc / clicking
// outside call onCancel. type "danger" shows a red trash icon.

const ICONS = {
  success: { icon: 'bi-check-lg', color: '#16a34a' },
  warning: { icon: 'bi-exclamation-lg', color: '#d97706' },
  error: { icon: 'bi-exclamation-lg', color: '#dc2626' },
  danger: { icon: 'bi-trash3-fill', color: '#dc2626' }
};

const defaultAccent = () =>
  typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
    ? '#6B2C3E'
    : '#dc3545';

const ResultPopup = ({ type = 'success', title, message, buttonLabel, accent, onClose, cancelLabel, onCancel }) => {
  const isConfirm = typeof onCancel === 'function';
  const dismiss = isConfirm ? onCancel : onClose;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') dismiss(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dismiss]);

  const { icon, color } = ICONS[type] || ICONS.success;

  return (
    <div
      onClick={dismiss}
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
        <div style={{ display: 'flex', gap: '10px' }}>
          {isConfirm && (
            <button
              type="button"
              autoFocus
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: '24px',
                border: '1px solid #d1d5db',
                background: 'white',
                color: '#374151',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {cancelLabel || 'Cancel'}
            </button>
          )}
          <button
            type="button"
            autoFocus={!isConfirm}
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: '24px',
              border: 'none',
              background: accent || (type === 'danger' ? '#dc2626' : defaultAccent()),
              color: 'white',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {buttonLabel || (type === 'success' ? 'Done' : 'OK')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultPopup;
