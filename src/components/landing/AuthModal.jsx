import React, { useEffect } from 'react';
import { MAIN_LOGO } from '../shared/logos';





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
  .auth-badge img { width: 100%; height: 100%; display: block; object-fit: contain; }
  /* The logo is white, so its badge is maroon. */
  .auth-badge.logo { background: linear-gradient(135deg, #6B2C3E, #8B3A52); padding: 9px; }
  .auth-title { margin: 0; font-size: 1.4rem; font-weight: 800; color: #1f2937; letter-spacing: -0.01em; }
  .auth-subtitle { margin: 4px 0 0; font-size: 0.88rem; color: #6b7280; line-height: 1.45; }
  .auth-body { padding: 18px 30px 26px; }

  .auth-section { margin: 0 0 12px; font-size: 1rem; font-weight: 700; color: #6B2C3E; }
  .auth-section ~ .auth-section { margin-top: 6px; padding-top: 16px; border-top: 1px solid #f0eaec; }
  .auth-grid { display: grid; gap: 0 14px; }
  .auth-grid.cols-2 { grid-template-columns: 1fr 1fr; }
  /* align-items: end keeps a wrapped label (e.g. "Gitnang Pangalan (opsyonal)") from pushing its box out of line. */
  /* Label, box and message share rows across the three name fields, so the
     boxes stay in line when one label wraps or one field shows an error. */
  .auth-grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; align-items: start; }
  @supports (grid-template-rows: subgrid) {
    .auth-grid.cols-3 > .auth-field { display: grid; grid-row: span 3; grid-template-rows: subgrid; align-content: start; }
    .auth-grid.cols-3 > .auth-field > .auth-label { align-self: end; }
  }

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
  /* A field the form couldn't accept: red outline and why, under it. */
  .auth-field.has-error .auth-input { border-color: #dc2626; background: #fffafa; }
  .auth-field.has-error .auth-input:focus { border-color: #dc2626; box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.14); }
  .auth-field.has-error .auth-input-icon, .auth-field.has-error .auth-prefix { color: #dc2626; }
  .auth-field-error { margin-top: 5px; display: flex; align-items: flex-start; gap: 6px; font-size: 0.78rem; font-weight: 600; line-height: 1.4; color: #dc2626; }
  .auth-field-error i { margin-top: 1px; flex-shrink: 0; }
  .auth-check-error { margin: -10px 0 16px 28px; }
  .auth-check.has-error input { outline: 2px solid #dc2626; outline-offset: 2px; }

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

  /* Sign Up in steps: numbered circles joined by a line, then Back / Next. */
  .auth-steps { list-style: none; margin: 4px auto 8px; padding: 0; display: flex; align-items: center; justify-content: center; max-width: 280px; }
  .auth-step { display: flex; align-items: center; flex: 1; }
  .auth-step:first-child { flex: 0 0 auto; }
  /* the line leading to each circle after the first */
  .auth-step + .auth-step::before { content: ""; flex: 1; height: 3px; margin: 0 8px; border-radius: 3px; background: #ece4e7; }
  .auth-step.done + .auth-step::before, .auth-step.done + .auth-step.current::before { background: #6B2C3E; }
  .auth-step button { width: 40px; height: 40px; flex-shrink: 0; padding: 0; border: 2px solid #e5dadf; border-radius: 50%; background: #fff; font: inherit; color: #9ca3af; cursor: default; display: flex; align-items: center; justify-content: center; transition: background 0.15s, border-color 0.15s, color 0.15s; }
  .auth-step-n { font-size: 1rem; font-weight: 800; line-height: 1; }
  .auth-step.current button { border-color: #6B2C3E; background: #6B2C3E; color: #fff; box-shadow: 0 0 0 4px rgba(107, 44, 62, 0.15); }
  .auth-step.done button { border-color: #6B2C3E; background: #fff; color: #6B2C3E; cursor: pointer; }
  .auth-step.done button:hover { background: #fdf2f5; }
  .auth-step button:focus-visible { outline: 3px solid #6B2C3E; outline-offset: 3px; }
  .auth-step-count { margin: 0 0 16px; text-align: center; font-size: 0.82rem; color: #6b7280; }
  .auth-step-count b { color: #374151; }
  .auth-part-actions { display: grid; gap: 10px; margin-top: 6px; }
  .auth-part-actions.two { grid-template-columns: 1fr 2fr; }

  /* Sign Up: proof of residency (valid ID upload). */
  .auth-id-intro { margin: -4px 0 10px; font-size: 0.85rem; color: #4b5563; line-height: 1.5; }
  .auth-id-info { margin: 0 0 14px; padding: 12px 14px; border-radius: 10px; background: #fdf7f9; border: 1px solid #f0e2e7; }
  .auth-id-info-title { margin: 0 0 6px; display: flex; align-items: center; gap: 6px; font-size: 0.84rem; font-weight: 700; color: #6B2C3E; }
  .auth-id-list { margin: 0 0 8px; padding-left: 1.15rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2px 16px; font-size: 0.8rem; color: #374151; line-height: 1.45; }
  .auth-id-info-hint { margin: 0; font-size: 0.78rem; color: #6b7280; line-height: 1.5; }
  .auth-select {
    -webkit-appearance: none; appearance: none; cursor: pointer; text-overflow: ellipsis;
    padding-right: 44px;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%236B2C3E' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e");
    background-repeat: no-repeat; background-position: right 16px center; background-size: 14px 10px;
  }
  .auth-upload-input { position: absolute; width: 1px; height: 1px; opacity: 0; overflow: hidden; pointer-events: none; }
  .auth-upload {
    display: flex; align-items: center; gap: 12px; width: 100%; min-height: 72px; margin: 0; padding: 12px 14px;
    border: 1.5px dashed #d8c3ca; border-radius: 10px; background: #fafafa; cursor: pointer;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }
  .auth-upload:hover { border-color: #6B2C3E; background: #fff; }
  .auth-upload > .bi { font-size: 1.7rem; color: #6B2C3E; flex-shrink: 0; }
  .auth-upload-input:focus-visible + .auth-upload { border-color: #6B2C3E; box-shadow: 0 0 0 4px rgba(107, 44, 62, 0.12); }
  .auth-upload.has-file { border-style: solid; border-color: #16a34a; background: #f6fef9; cursor: default; }
  .auth-upload-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; font-size: 0.8rem; color: #6b7280; }
  .auth-upload-text strong { font-size: 0.9rem; color: #1f2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .auth-upload-formats { font-size: 0.75rem; color: #9ca3af; }
  .auth-upload-thumb { width: 56px; height: 56px; flex-shrink: 0; border-radius: 8px; object-fit: cover; background: #fff; border: 1px solid #e5e7eb; }
  .auth-upload-thumb.pdf { display: flex; align-items: center; justify-content: center; font-size: 1.6rem; color: #dc2626; }
  .auth-upload-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
  .auth-upload-actions .auth-link { font-size: 0.82rem; cursor: pointer; }
  .auth-field.has-error .auth-upload { border-color: #dc2626; background: #fffafa; }
  .auth-upload-privacy { margin: 6px 0 0; display: flex; gap: 6px; align-items: flex-start; font-size: 0.76rem; color: #6b7280; line-height: 1.45; }
  .auth-upload-privacy i { color: #16a34a; margin-top: 1px; }

  /* Phones: still a floating card with the page dimmed around it (not a
     full-screen sheet); taller windows like Sign Up scroll inside the overlay. */
  @media (max-width: 576px) {
    .auth-overlay { padding: 24px 14px; }
    .auth-card, .auth-card.wide { max-width: 420px; border-radius: 18px; }
    .auth-close { top: 12px; right: 12px; width: 34px; height: 34px; }
    .auth-head { padding: 22px 18px 4px; }
    .auth-badge { width: 46px; height: 46px; margin-bottom: 10px; }
    .auth-title { font-size: 1.25rem; }
    .auth-body { padding: 14px 18px 20px; }
    .auth-grid.cols-2, .auth-grid.cols-3 { grid-template-columns: 1fr; }
    .auth-checklist { grid-template-columns: 1fr; }
    .auth-id-list { grid-template-columns: 1fr; }
    .auth-steps { max-width: 240px; }
    .auth-step button { width: 36px; height: 36px; }
    .auth-upload.has-file { flex-wrap: wrap; }
    .auth-upload.has-file .auth-upload-actions { flex-direction: row; gap: 16px; width: 100%; justify-content: flex-end; }
    /* 16px stops iOS from zooming in when the ID type list is tapped */
    .auth-select { font-size: 16px; }
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
          <div className={`auth-badge${icon ? '' : ' logo'}`} aria-hidden="true">
            {icon ? <i className={`bi ${icon}`}></i> : <img src={MAIN_LOGO} alt="" />}
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






export const AuthField = ({ id, label, optional, icon, prefix, toggle, hint, hintTone, error, children }) => (
  <div className={`auth-field${error ? ' has-error' : ''}`}>
    <label className="auth-label" htmlFor={id}>
      {label} {optional && <span className="optional">{optional}</span>}
    </label>
    <div className="auth-input-wrap">
      {icon && <i className={`bi ${icon} auth-input-icon`} aria-hidden="true"></i>}
      {prefix && <span className="auth-prefix" aria-hidden="true">{prefix}</span>}
      {children}
      {toggle}
    </div>
    {error
      ? <AuthFieldError id={id}>{error}</AuthFieldError>
      : hint && <div className={`auth-hint ${hintTone || ''}`}>{hint}</div>}
  </div>
);

export const AuthFieldError = ({ id, className = '', children }) => (
  <div className={`auth-field-error ${className}`} id={`${id}-error`}>
    <i className="bi bi-exclamation-circle-fill" aria-hidden="true"></i>
    <span>{children}</span>
  </div>
);

export default AuthModal;
