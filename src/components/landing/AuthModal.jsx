import React, { useEffect } from 'react';

// Shared look for the home page's account windows (Sign In, Sign Up, email
// verification, Forgot Password, Save Login Info) in Hero.jsx: a white card
// with the Safe Connect logo, a title and subtitle, then the content.

const STYLES = `
  .auth-overlay {
    position: fixed; inset: 0; z-index: 1060;
    background: rgba(17, 17, 17, 0.55);
    backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px; overflow-y: auto;
  }
  .auth-card {
    position: relative; width: 100%; max-width: 440px; margin: auto;
    background: #fff; border-radius: 20px; overflow: hidden;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
    animation: auth-rise 0.2s ease-out;
  }
  .auth-card.wide { max-width: 600px; }
  @keyframes auth-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  .auth-card::before {
    content: ''; display: block; height: 5px;
    background: linear-gradient(90deg, #6B2C3E, #a14462);
  }
  .auth-close {
    position: absolute; top: 16px; right: 16px;
    width: 36px; height: 36px; border-radius: 50%; border: none;
    background: #f3f4f6; color: #4b5563;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
  }
  .auth-close:hover { background: #e5e7eb; color: #111827; }
  .auth-close:focus-visible { outline: 2px solid #6B2C3E; outline-offset: 2px; }
  .auth-head { text-align: center; padding: 26px 30px 4px; }
  .auth-badge {
    width: 52px; height: 52px; margin: 0 auto 12px; border-radius: 50%;
    background: #fdf0f3; color: #6B2C3E;
    display: flex; align-items: center; justify-content: center; font-size: 22px; overflow: hidden;
  }
  .auth-badge img { width: 100%; height: 100%; display: block; }
  .auth-title { margin: 0; font-size: 1.4rem; font-weight: 800; color: #1f2937; letter-spacing: -0.01em; }
  .auth-subtitle { margin: 4px 0 0; font-size: 0.88rem; color: #6b7280; line-height: 1.45; }
  .auth-body { padding: 18px 30px 26px; }

  .auth-section { margin: 0 0 12px; font-size: 1rem; font-weight: 700; color: #1f2937; }
  .auth-section ~ .auth-section { margin-top: 6px; padding-top: 16px; border-top: 1px solid #f0eaec; }
  .auth-grid { display: grid; gap: 0 14px; }
  .auth-grid.cols-2 { grid-template-columns: 1fr 1fr; }
  .auth-grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }

  .auth-field { margin-bottom: 14px; }
  .auth-label { display: block; margin-bottom: 6px; font-size: 0.84rem; font-weight: 600; color: #374151; }
  .auth-label .optional { font-weight: 400; color: #9ca3af; }
  .auth-input-wrap { position: relative; display: flex; align-items: center; }
  .auth-input-icon { position: absolute; left: 14px; color: #9ca3af; font-size: 1rem; pointer-events: none; }
  .auth-prefix {
    position: absolute; left: 40px; color: #374151; font-weight: 600; font-size: 0.95rem; pointer-events: none;
  }
  .auth-input {
    width: 100%; height: 44px; padding: 0 14px 0 40px;
    border: 1.5px solid #e5e7eb; border-radius: 10px; background: #fafafa;
    font-size: 0.95rem; color: #111827; transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  }
  .auth-input.has-prefix { padding-left: 76px; }
  .auth-input.has-toggle { padding-right: 44px; }
  .auth-input::placeholder { color: #9ca3af; }
  /* Edge/IE add their own reveal/clear buttons next to ours */
  .auth-input::-ms-reveal, .auth-input::-ms-clear { display: none; }
  .auth-input:focus { outline: none; border-color: #6B2C3E; background: #fff; box-shadow: 0 0 0 4px rgba(107, 44, 62, 0.12); }
  .auth-input.ok { border-color: #16a34a; }
  .auth-input.bad { border-color: #dc2626; }
  .auth-toggle {
    position: absolute; right: 6px; width: 32px; height: 32px; border: none; border-radius: 8px;
    background: transparent; color: #6B2C3E; display: flex; align-items: center; justify-content: center; cursor: pointer;
  }
  .auth-toggle:hover { background: #f3eef0; }
  .auth-hint { margin-top: 4px; font-size: 0.78rem; font-weight: 600; }
  .auth-hint.ok { color: #16a34a; }
  .auth-hint.bad { color: #dc2626; }

  .auth-checklist { list-style: none; margin: -4px 0 14px; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; }
  .auth-checklist li { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #6b7280; }
  .auth-checklist li.met { color: #16a34a; }

  .auth-alert { display: flex; gap: 10px; align-items: flex-start; padding: 9px 12px; border-radius: 10px; margin-bottom: 12px; font-size: 0.86rem; line-height: 1.45; }
  .auth-alert i { margin-top: 1px; }
  .auth-alert.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
  .auth-alert.success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
  .auth-alert.notice { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }

  .auth-row { display: flex; justify-content: space-between; align-items: center; margin: -4px 0 12px; }
  .auth-link { border: none; background: none; padding: 0; color: #6B2C3E; font-weight: 700; font-size: 0.88rem; cursor: pointer; text-decoration: none; }
  .auth-link:hover { text-decoration: underline; }
  .auth-link.muted { color: #6b7280; font-weight: 600; }
  .auth-link:disabled { color: #9ca3af; cursor: default; text-decoration: none; }

  .auth-btn {
    width: 100%; height: 46px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, #6B2C3E, #8B3A52); color: #fff;
    font-weight: 700; font-size: 0.98rem; cursor: pointer; transition: filter 0.15s, transform 0.05s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .auth-btn:hover:not(:disabled) { filter: brightness(1.08); }
  .auth-btn:active:not(:disabled) { transform: translateY(1px); }
  .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .auth-btn.secondary { background: #fff; color: #374151; border: 1.5px solid #e5e7eb; }
  .auth-btn.secondary:hover:not(:disabled) { filter: none; background: #f9fafb; }
  .auth-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  .auth-switch { margin: 16px 0 0; text-align: center; font-size: 0.9rem; color: #6b7280; }
  .auth-check { display: flex; gap: 10px; align-items: flex-start; margin: 4px 0 16px; font-size: 0.86rem; color: #374151; }
  .auth-check input { width: 18px; height: 18px; margin-top: 1px; accent-color: #6B2C3E; flex-shrink: 0; cursor: pointer; }
  .auth-check a { color: #6B2C3E; font-weight: 700; text-decoration: none; }
  .auth-check a:hover { text-decoration: underline; }
  .auth-check-hint { margin: -12px 0 16px 28px; font-size: 0.78rem; color: #6b7280; }
  .auth-note { display: flex; gap: 10px; padding: 10px 12px; border-radius: 10px; background: #fffbeb; border: 1px solid #fde68a; color: #92400e; font-size: 0.85rem; line-height: 1.45; margin: 0 0 14px; }
  .auth-fineprint { margin: 14px 0 0; text-align: center; font-size: 0.8rem; color: #6b7280; }

  @media (max-width: 576px) {
    .auth-overlay { padding: 0; align-items: stretch; }
    .auth-card, .auth-card.wide { max-width: none; min-height: 100%; border-radius: 0; }
    .auth-head { padding: 24px 18px 4px; }
    .auth-body { padding: 16px 18px 24px; }
    .auth-grid.cols-2, .auth-grid.cols-3 { grid-template-columns: 1fr; }
    .auth-checklist { grid-template-columns: 1fr; }
  }
`;

export const AuthModal = ({ title, subtitle, icon, wide = false, onClose, closeLabel = 'Close', labelledBy = 'auth-title', children }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="auth-overlay">
      <style>{STYLES}</style>
      <div className={`auth-card${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        <button type="button" className="auth-close" onClick={onClose} aria-label={closeLabel}>
          <i className="bi bi-x-lg"></i>
        </button>
        <div className="auth-head">
          <div className="auth-badge" aria-hidden="true">
            {icon ? <i className={`bi ${icon}`}></i> : <img src="/images/safeconnect-logo.svg" alt="" />}
          </div>
          <h2 className="auth-title" id={labelledBy}>{title}</h2>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </div>
        <div className="auth-body">{children}</div>
      </div>
    </div>
  );
};

export const AuthAlert = ({ type = 'error', children }) => {
  if (!children) return null;
  const icon = { error: 'bi-exclamation-circle-fill', success: 'bi-check-circle-fill', notice: 'bi-info-circle-fill' }[type];
  return (
    <div className={`auth-alert ${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <i className={`bi ${icon}`} aria-hidden="true"></i>
      <span>{children}</span>
    </div>
  );
};

// Label + input with a leading icon. Pass the input itself as children with
// className "auth-input" (and the same id as htmlFor).
export const AuthField = ({ id, label, optional, icon, prefix, toggle, hint, hintTone, children }) => (
  <div className="auth-field">
    <label className="auth-label" htmlFor={id}>
      {label} {optional && <span className="optional">{optional}</span>}
    </label>
    <div className="auth-input-wrap">
      {icon && <i className={`bi ${icon} auth-input-icon`} aria-hidden="true"></i>}
      {prefix && <span className="auth-prefix" aria-hidden="true">{prefix}</span>}
      {children}
      {toggle}
    </div>
    {hint && <div className={`auth-hint ${hintTone || ''}`}>{hint}</div>}
  </div>
);

export default AuthModal;
