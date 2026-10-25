import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  fetchUserProfile,
  updateFullName,
  updateUsername,
  updateContact,
  updateEmail,
  changePassword,
  uploadProfilePhoto
} from '../../Services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import PhotoCropModal from '../shared/PhotoCropModal';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // before cropping; the saved photo is a small 512px JPEG
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Same rules as Sign Up (Hero.jsx) and the server (backend/utils/validation.js).
const PASSWORD_RULES = [
  { key: 'length', test: (pw) => pw.length >= 8 },
  { key: 'uppercase', test: (pw) => /[A-Z]/.test(pw) },
  { key: 'number', test: (pw) => /[0-9]/.test(pw) },
  { key: 'symbol', test: (pw) => /[^A-Za-z0-9]/.test(pw) }
];
const NAME_PATTERN = /^\p{L}[\p{L}\s.'-]*$/u;
const normalizeName = (name) => name.trim().replace(/\s+/g, ' ');

const SECTIONS = [
  { key: 'profile', icon: 'bi-person-fill' },
  { key: 'contact', icon: 'bi-telephone-fill' },
  { key: 'security', icon: 'bi-shield-lock-fill' },
  { key: 'account', icon: 'bi-info-circle-fill' }
];

// Strips whatever prefix a stored number has (+63, 63, or a leading 0) and
// keeps the last 10 digits, so an existing "+639171234567" loads back into
// the same "9XXXXXXXXX" input the sign-up form uses.
const stripPhonePrefix = (raw) => {
  if (!raw) return '';
  return String(raw).replace(/\D/g, '').slice(-10);
};

const formatMemberSince = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const Message = ({ message }) => {
  if (!message) return null;
  return (
    <div className={`st-msg ${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>
      <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} aria-hidden="true" />
      <span>{message.text}</span>
    </div>
  );
};

const PasswordInput = ({ id, value, onChange, placeholder, autoComplete, t }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="st-input-wrap">
      <input id={id} type={visible ? 'text' : 'password'} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete} className="st-input has-toggle" />
      <button type="button" className="st-toggle" onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}>
        <i className={`bi ${visible ? 'bi-eye-slash' : 'bi-eye'}`} />
      </button>
    </div>
  );
};

function SettingsPage({ isOpen, onClose, user, onProfileUpdate }) {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [section, setSection] = useState('profile');
  const [profile, setProfile] = useState(user || null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Photo
  const [cropFile, setCropFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState(null);

  // Profile: full name + username
  const [nameInput, setNameInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  // Contact: email + phone
  const [emailInput, setEmailInput] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [contactInput, setContactInput] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [contactMessage, setContactMessage] = useState(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  useEffect(() => {
    if (isOpen && user?.id) loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.id]);

  const fillForms = (p) => {
    setNameInput(p?.fullName || '');
    setUsernameInput(p?.username || '');
    setEmailInput(p?.email || '');
    setEmailPassword('');
    setContactInput(stripPhonePrefix(p?.contact));
  };

  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      // GET /users/:id returns the raw registered_users row directly
      // (full_name, contact_number, email_address, photo_url, ...).
      const result = await fetchUserProfile(user.id);
      const mapped = (result && result.id) ? {
        id: result.id,
        fullName: result.full_name,
        username: result.username,
        contact: result.contact_number,
        email: result.email_address,
        role: result.role,
        status: result.status,
        photoUrl: result.photoUrl || null,
        createdAt: result.created_at
      } : (user || null);

      setProfile(mapped);
      fillForms(mapped);
      // Keep the navbar (and the stored signed-in user) in sync with the server.
      if (mapped?.id) {
        onProfileUpdate?.({
          fullName: mapped.fullName, username: mapped.username, email: mapped.email,
          contact: mapped.contact, photoUrl: mapped.photoUrl
        });
      }
    } catch {
      // keep what we have; the forms still work
    } finally {
      setLoadingProfile(false);
    }
  };

  // ── Photo ──
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoMessage({ type: 'error', text: t('settings.photoTypeError') });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoMessage({ type: 'error', text: t('settings.photoSizeError') });
      return;
    }
    setPhotoMessage(null);
    setCropFile(file); // opens the editor
  };

  const handleSaveCroppedPhoto = async (croppedFile) => {
    setUploadingPhoto(true);
    try {
      const result = await uploadProfilePhoto(user.id, croppedFile);
      if (result.success) {
        setProfile((p) => ({ ...p, photoUrl: result.photoUrl }));
        onProfileUpdate?.({ photoUrl: result.photoUrl });
        setPhotoMessage({ type: 'success', text: t('settings.photoSuccess') });
        setCropFile(null);
      } else {
        setPhotoMessage({ type: 'error', text: result.message || t('settings.photoUploadError') });
        setCropFile(null);
      }
    } catch {
      setPhotoMessage({ type: 'error', text: t('settings.serverError') });
      setCropFile(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ── Profile (full name + username) ──
  const nameChanged = normalizeName(nameInput) !== (profile?.fullName || '');
  const usernameChanged = usernameInput.trim() !== (profile?.username || '');
  const profileDirty = nameChanged || usernameChanged;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMessage(null);
    const name = normalizeName(nameInput);
    const username = usernameInput.trim();
    if (nameChanged) {
      if (name.length < 2) { setProfileMessage({ type: 'error', text: t('settings.nameEmptyError') }); return; }
      if (name.length > 100 || !NAME_PATTERN.test(name)) { setProfileMessage({ type: 'error', text: t('settings.nameInvalidError') }); return; }
    }
    if (usernameChanged && !username) { setProfileMessage({ type: 'error', text: t('settings.usernameEmptyError') }); return; }

    setSavingProfile(true);
    try {
      const updates = {};
      if (nameChanged) {
        const result = await updateFullName(user.id, name);
        if (!result.success) { setProfileMessage({ type: 'error', text: result.message || t('settings.nameUpdateError') }); return; }
        updates.fullName = result.fullName || name;
      }
      if (usernameChanged) {
        const result = await updateUsername(user.id, username);
        if (!result.success) {
          if (Object.keys(updates).length) {
            setProfile((p) => ({ ...p, ...updates }));
            onProfileUpdate?.(updates);
          }
          setProfileMessage({ type: 'error', text: result.message || t('settings.usernameUpdateError') });
          return;
        }
        updates.username = result.username || username;
      }
      setProfile((p) => ({ ...p, ...updates }));
      setNameInput(updates.fullName ?? nameInput);
      onProfileUpdate?.(updates);
      setProfileMessage({ type: 'success', text: t('settings.profileUpdated') });
    } catch {
      setProfileMessage({ type: 'error', text: t('settings.serverError') });
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Contact (email + phone) ──
  const emailChanged = emailInput.trim() !== (profile?.email || '');
  const fullContact = contactInput ? `+63${contactInput}` : '';
  const contactChanged = fullContact !== (profile?.contact || '') && stripPhonePrefix(profile?.contact) !== contactInput;
  const contactDirty = emailChanged || contactChanged;

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setContactMessage(null);
    const email = emailInput.trim();
    if (emailChanged) {
      if (!email) { setContactMessage({ type: 'error', text: t('settings.emailEmptyError') }); return; }
      if (!EMAIL_REGEX.test(email)) { setContactMessage({ type: 'error', text: t('settings.emailInvalidError') }); return; }
      if (!emailPassword) { setContactMessage({ type: 'error', text: t('settings.emailPasswordRequired') }); return; }
    }
    if (contactChanged && contactInput.length !== 10) {
      setContactMessage({ type: 'error', text: t('settings.contactInvalidError') }); return;
    }

    setSavingContact(true);
    try {
      const updates = {};
      if (contactChanged) {
        const result = await updateContact(user.id, fullContact);
        if (!result.success) { setContactMessage({ type: 'error', text: result.message || t('settings.contactUpdateError') }); return; }
        updates.contact = fullContact;
      }
      if (emailChanged) {
        const result = await updateEmail(user.id, email, emailPassword);
        if (!result.success) {
          if (Object.keys(updates).length) {
            setProfile((p) => ({ ...p, ...updates }));
            onProfileUpdate?.(updates);
          }
          setContactMessage({ type: 'error', text: result.message || t('settings.emailUpdateError') });
          return;
        }
        updates.email = email;
        setEmailPassword('');
      }
      setProfile((p) => ({ ...p, ...updates }));
      onProfileUpdate?.(updates);
      setContactMessage({ type: 'success', text: t('settings.contactDetailsUpdated') });
    } catch {
      setContactMessage({ type: 'error', text: t('settings.serverError') });
    } finally {
      setSavingContact(false);
    }
  };

  // ── Password ──
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: t('settings.passwordFillAll') }); return;
    }
    if (!PASSWORD_RULES.every((r) => r.test(newPassword))) {
      setPasswordMessage({ type: 'error', text: t('settings.passwordRulesError') }); return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: t('settings.passwordMismatch') }); return;
    }
    if (newPassword === currentPassword) {
      setPasswordMessage({ type: 'error', text: t('settings.passwordSameAsCurrent') }); return;
    }

    setSavingPassword(true);
    try {
      const result = await changePassword(user.id, currentPassword, newPassword);
      if (result.success) {
        setPasswordMessage({ type: 'success', text: t('settings.passwordUpdated') });
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: result.message || t('settings.passwordUpdateError') });
      }
    } catch {
      setPasswordMessage({ type: 'error', text: t('settings.serverError') });
    } finally {
      setSavingPassword(false);
    }
  };

  const goTo = (key) => {
    setSection(key);
    setProfileMessage(null); setContactMessage(null); setPasswordMessage(null);
  };

  const initials = (profile?.fullName || profile?.username || 'U')
    .trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  const roleText = profile?.role ? profile.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';

  return (
    <div className={`settings-fullscreen ${isOpen ? 'show' : ''}`}>
      <style>{`
        .settings-fullscreen {
          /* Sits below the always-visible navbar instead of covering it. */
          position: fixed; top: var(--resident-navbar-height, 76px); left: 0; right: 0; bottom: 0;
          background: #f7f5f6;
          z-index: 900; display: flex; flex-direction: column;
          opacity: 0; visibility: hidden; transform: translateY(20px);
          transition: all 0.3s ease;
        }
        .settings-fullscreen.show { opacity: 1; visibility: visible; transform: translateY(0); }
        .settings-header {
          background: #fff; padding: 1.1rem clamp(1.5rem, 5vw, 4rem);
          display: flex; align-items: center; gap: 0.9rem; border-bottom: 1px solid #f0e8ea; flex-shrink: 0;
        }
        .settings-header-icon {
          width: 44px; height: 44px; border-radius: 13px;
          background: linear-gradient(135deg, #6B2C3E 0%, #8B3A52 100%);
          box-shadow: 0 4px 12px rgba(107, 44, 62, 0.22);
          display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #FFC107; flex-shrink: 0;
        }
        .settings-header h2 { color: #1a1416; font-size: clamp(1.15rem,2.5vw,1.45rem); font-weight: 800; margin: 0; line-height: 1.25; }
        .settings-header-sub { color: #6b7280; font-size: 0.82rem; font-weight: 500; margin: 0.15rem 0 0; }
        .settings-body { flex: 1; overflow-y: auto; padding: clamp(1.25rem,3vw,2.5rem) clamp(1rem,4vw,3rem) 4rem; }
        .st-wrap { max-width: 980px; margin: 0 auto; }

        /* Profile summary */
        .st-summary {
          background: #fff; border-radius: 18px; padding: 1.4rem 1.6rem; margin-bottom: 1.5rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06); display: flex; align-items: center; gap: 1.25rem;
        }
        .st-avatar-wrap { position: relative; flex-shrink: 0; }
        .st-avatar {
          width: 88px; height: 88px; border-radius: 50%; background: #6B2C3E; color: #fff; overflow: hidden;
          display: flex; align-items: center; justify-content: center; font-size: 1.7rem; font-weight: 800;
          box-shadow: 0 0 0 4px #fff, 0 0 0 6px #f0e3e7;
        }
        .st-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .st-camera {
          position: absolute; right: -2px; bottom: -2px; width: 34px; height: 34px; border-radius: 50%;
          border: 3px solid #fff; background: #6B2C3E; color: #fff; display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .st-camera:hover:not(:disabled) { background: #561f30; }
        .st-camera:disabled { opacity: 0.6; cursor: not-allowed; }
        .st-summary-text { min-width: 0; flex: 1; }
        .st-summary-name { margin: 0; font-size: 1.25rem; font-weight: 800; color: #1f2937; overflow-wrap: anywhere; }
        .st-summary-meta { margin: 4px 0 0; font-size: 0.88rem; color: #4b5563; display: flex; flex-wrap: wrap; gap: 4px 14px; }
        .st-summary-meta span { display: inline-flex; align-items: center; gap: 5px; overflow-wrap: anywhere; }
        .st-photo-link { margin-top: 10px; border: none; background: none; padding: 0; color: #6B2C3E; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
        .st-photo-link:hover { text-decoration: underline; }
        .st-photo-hint { display: block; margin-top: 2px; font-size: 0.75rem; color: #6b7280; }

        /* Layout */
        .st-layout { display: grid; grid-template-columns: 230px 1fr; gap: 1.5rem; align-items: start; }
        .st-nav { background: #fff; border-radius: 16px; padding: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); position: sticky; top: 0; }
        .st-nav button {
          width: 100%; display: flex; align-items: center; gap: 10px; border: none; background: none;
          padding: 11px 14px; border-radius: 10px; font-size: 0.92rem; font-weight: 600; color: #4b5563; text-align: left; cursor: pointer;
        }
        .st-nav button i { font-size: 1rem; color: #9ca3af; }
        .st-nav button:hover { background: #f7f3f4; color: #1f2937; }
        .st-nav button[aria-current="page"] { background: #fdf0f3; color: #6B2C3E; }
        .st-nav button[aria-current="page"] i { color: #6B2C3E; }
        .st-nav button:focus-visible { outline: 2px solid #6B2C3E; outline-offset: -2px; }

        .st-panel { background: #fff; border-radius: 16px; padding: clamp(1.25rem,3vw,2rem); box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .st-panel h3 { margin: 0; font-size: 1.15rem; font-weight: 800; color: #1f2937; }
        .st-panel-sub { margin: 4px 0 1.5rem; font-size: 0.88rem; color: #6b7280; line-height: 1.5; }
        .st-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
        .st-field { margin-bottom: 1.1rem; }
        .st-field label { display: block; margin-bottom: 6px; font-size: 0.85rem; font-weight: 600; color: #374151; }
        .st-field .st-hint { display: block; margin-top: 6px; font-size: 0.78rem; color: #6b7280; }
        .st-input-wrap { position: relative; display: flex; align-items: center; }
        .st-input {
          width: 100%; height: 44px; padding: 0 14px; border: 1.5px solid #e5e7eb; border-radius: 11px; background: #fafafa;
          font-size: 0.94rem; color: #111827; transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .st-input:focus { outline: none; border-color: #6B2C3E; background: #fff; box-shadow: 0 0 0 4px rgba(107,44,62,0.12); }
        .st-input:disabled { background: #f3f4f6; color: #6b7280; }
        .st-input.has-prefix { padding-left: 56px; }
        .st-input.has-toggle { padding-right: 44px; }
        .st-input::-ms-reveal, .st-input::-ms-clear { display: none; }
        .st-prefix { position: absolute; left: 14px; font-weight: 700; color: #374151; font-size: 0.94rem; pointer-events: none; }
        .st-toggle { position: absolute; right: 6px; width: 34px; height: 34px; border: none; border-radius: 8px; background: transparent; color: #6B2C3E; }
        .st-toggle:hover { background: #f3eef0; }
        .st-reveal { padding: 14px; border-radius: 12px; background: #fffbeb; border: 1px solid #fde68a; margin-bottom: 1.1rem; }
        .st-reveal .st-field { margin-bottom: 0; }
        .st-reveal label { color: #92400e; }

        .st-checklist { list-style: none; margin: -4px 0 1.1rem; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; }
        .st-checklist li { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #6b7280; }
        .st-checklist li.met { color: #16a34a; }
        .st-note { display: flex; gap: 8px; font-size: 0.82rem; color: #4b5563; background: #f9fafb; border-radius: 10px; padding: 10px 12px; margin-bottom: 1.25rem; }

        .st-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 0.5rem; padding-top: 1.1rem; border-top: 1px solid #f3f4f6; }
        .st-btn { border: none; border-radius: 11px; padding: 10px 20px; font-weight: 700; font-size: 0.9rem; cursor: pointer; }
        .st-btn.primary { background: linear-gradient(135deg, #6B2C3E, #8B3A52); color: #fff; }
        .st-btn.primary:hover:not(:disabled) { filter: brightness(1.08); }
        .st-btn.secondary { background: #fff; color: #374151; border: 1.5px solid #e5e7eb; }
        .st-btn.secondary:hover:not(:disabled) { background: #f9fafb; }
        .st-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .st-msg { display: flex; gap: 8px; align-items: flex-start; padding: 10px 13px; border-radius: 11px; margin-bottom: 1.1rem; font-size: 0.88rem; }
        .st-msg.success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .st-msg.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .st-summary .st-msg { margin: 10px 0 0; }

        .st-row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.85rem 0; border-bottom: 1px solid #f3f4f6; font-size: 0.92rem; }
        .st-row:last-child { border-bottom: none; }
        .st-row span:first-child { color: #4b5563; }
        .st-row span:last-child { color: #1f2937; font-weight: 600; text-align: right; }
        .st-badge { display: inline-flex; padding: 2px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; background: #dcfce7; color: #166534; }

        @media (max-width: 760px) {
          .st-layout { grid-template-columns: 1fr; gap: 1rem; }
          .st-nav { position: static; display: flex; overflow-x: auto; gap: 4px; padding: 6px; }
          .st-nav button { width: auto; flex-shrink: 0; white-space: nowrap; padding: 9px 13px; font-size: 0.86rem; }
          .st-summary { flex-direction: column; text-align: center; }
          .st-summary-meta { justify-content: center; }
        }
        @media (max-width: 540px) {
          .st-grid { grid-template-columns: 1fr; }
          .st-checklist { grid-template-columns: 1fr; }
          .st-actions .st-btn { flex: 1; }
        }
      `}</style>

      <div className="settings-header">
        <div className="settings-header-icon">
          <i className="bi bi-gear-fill" />
        </div>
        <div>
          <h2>{t('settings.title')}</h2>
          <p className="settings-header-sub">{t('settings.subtitle')}</p>
        </div>
      </div>

      <div className="settings-body">
        <div className="st-wrap">

          {/* ── Profile summary + photo ── */}
          {/* div, not <section>: styles/App.css zeroes every section's margin and padding with !important */}
          <div className="st-summary" role="region" aria-label={t('settings.profilePhoto')}>
            <div className="st-avatar-wrap">
              <div className="st-avatar">
                {profile?.photoUrl ? <img src={profile.photoUrl} alt={t('settings.profilePhoto')} /> : initials}
              </div>
              <button type="button" className="st-camera" onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto || loadingProfile} aria-label={t('settings.changePhoto')}>
                <i className="bi bi-camera-fill" />
              </button>
            </div>
            <div className="st-summary-text">
              <p className="st-summary-name">{profile?.fullName || '—'}</p>
              <div className="st-summary-meta">
                {profile?.username && <span><i className="bi bi-at" />{profile.username}</span>}
                {profile?.email && <span><i className="bi bi-envelope" />{profile.email}</span>}
                <span><i className="bi bi-calendar3" />{t('settings.memberSince')} {formatMemberSince(profile?.createdAt)}</span>
              </div>
              <button type="button" className="st-photo-link" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto || loadingProfile}>
                {profile?.photoUrl ? t('settings.changePhoto') : t('settings.addPhoto')}
              </button>
              <span className="st-photo-hint">{t('settings.photoHint')}</span>
              <Message message={photoMessage} />
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelect} style={{ display: 'none' }} data-testid="photo-input" />
          </div>

          <div className="st-layout">
            <nav className="st-nav" aria-label={t('settings.title')}>
              {SECTIONS.map((s) => (
                <button key={s.key} type="button" aria-current={section === s.key ? 'page' : undefined} onClick={() => goTo(s.key)}>
                  <i className={`bi ${s.icon}`} aria-hidden="true" /> {t(`settings.nav.${s.key}`)}
                </button>
              ))}
            </nav>

            <div>
              {section === 'profile' && (
                <form className="st-panel" onSubmit={handleSaveProfile} noValidate>
                  <h3>{t('settings.nav.profile')}</h3>
                  <p className="st-panel-sub">{t('settings.profileSub')}</p>
                  <Message message={profileMessage} />
                  <div className="st-field">
                    <label htmlFor="settings-fullname">{t('settings.fullName')}</label>
                    <input id="settings-fullname" className="st-input" type="text" autoComplete="name" maxLength={100}
                      value={nameInput} onChange={(e) => setNameInput(e.target.value)} disabled={loadingProfile}
                      placeholder={t('settings.fullNamePlaceholder')} />
                    <span className="st-hint">{t('settings.fullNameHint')}</span>
                  </div>
                  <div className="st-field">
                    <label htmlFor="settings-username">{t('settings.username')}</label>
                    <input id="settings-username" className="st-input" type="text" autoComplete="username" maxLength={50}
                      value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} disabled={loadingProfile}
                      placeholder={t('settings.usernamePlaceholder')} />
                    <span className="st-hint">{t('settings.usernameSub')}</span>
                  </div>
                  <div className="st-actions">
                    <button type="button" className="st-btn secondary" onClick={() => { fillForms(profile); setProfileMessage(null); }} disabled={!profileDirty || savingProfile}>
                      {t('settings.cancel')}
                    </button>
                    <button type="submit" className="st-btn primary" disabled={!profileDirty || savingProfile || loadingProfile}>
                      {savingProfile ? t('settings.saving') : t('settings.saveChanges')}
                    </button>
                  </div>
                </form>
              )}

              {section === 'contact' && (
                <form className="st-panel" onSubmit={handleSaveContact} noValidate>
                  <h3>{t('settings.nav.contact')}</h3>
                  <p className="st-panel-sub">{t('settings.contactInfoSub')}</p>
                  <Message message={contactMessage} />
                  <div className="st-grid">
                    <div className="st-field">
                      <label htmlFor="settings-email">{t('settings.emailAddress')}</label>
                      <input id="settings-email" className="st-input" type="email" autoComplete="email"
                        value={emailInput} onChange={(e) => setEmailInput(e.target.value)} disabled={loadingProfile} placeholder="you@example.com" />
                    </div>
                    <div className="st-field">
                      <label htmlFor="settings-contact">{t('settings.phoneNumber')}</label>
                      <div className="st-input-wrap">
                        <span className="st-prefix" aria-hidden="true">+63</span>
                        <input id="settings-contact" className="st-input has-prefix" type="tel" inputMode="numeric" autoComplete="tel-national"
                          value={contactInput} onChange={(e) => setContactInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="9XXXXXXXXX" maxLength={10} disabled={loadingProfile} />
                      </div>
                    </div>
                  </div>
                  {emailChanged && (
                    <div className="st-reveal">
                      <div className="st-field">
                        <label htmlFor="settings-email-password">{t('settings.confirmWithPassword')}</label>
                        <PasswordInput id="settings-email-password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)}
                          placeholder={t('settings.currentPasswordPlaceholder')} autoComplete="current-password" t={t} />
                      </div>
                    </div>
                  )}
                  <div className="st-actions">
                    <button type="button" className="st-btn secondary" onClick={() => { fillForms(profile); setContactMessage(null); }} disabled={!contactDirty || savingContact}>
                      {t('settings.cancel')}
                    </button>
                    <button type="submit" className="st-btn primary" disabled={!contactDirty || savingContact || loadingProfile}>
                      {savingContact ? t('settings.saving') : t('settings.saveChanges')}
                    </button>
                  </div>
                </form>
              )}

              {section === 'security' && (
                <form className="st-panel" onSubmit={handleSavePassword} noValidate>
                  <h3>{t('settings.nav.security')}</h3>
                  <p className="st-panel-sub">{t('settings.passwordSub')}</p>
                  <Message message={passwordMessage} />
                  <div className="st-field">
                    <label htmlFor="settings-current-password">{t('settings.currentPassword')}</label>
                    <PasswordInput id="settings-current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t('settings.currentPasswordPlaceholder')} autoComplete="current-password" t={t} />
                  </div>
                  <div className="st-grid">
                    <div className="st-field">
                      <label htmlFor="settings-new-password">{t('settings.newPassword')}</label>
                      <PasswordInput id="settings-new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('settings.newPasswordPlaceholder')} autoComplete="new-password" t={t} />
                    </div>
                    <div className="st-field">
                      <label htmlFor="settings-confirm-password">{t('settings.confirmNewPassword')}</label>
                      <PasswordInput id="settings-confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('settings.confirmNewPasswordPlaceholder')} autoComplete="new-password" t={t} />
                      {confirmPassword && (
                        <span className="st-hint" style={{ color: newPassword === confirmPassword ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                          {newPassword === confirmPassword ? t('signUp.passwordsMatch') : t('signUp.passwordsNoMatch')}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Requirements appear once a new password is being typed. */}
                  {newPassword && (
                    <ul className="st-checklist" aria-label={t('signUp.passwordRules')}>
                      {PASSWORD_RULES.map((r) => {
                        const met = r.test(newPassword);
                        return (
                          <li key={r.key} className={met ? 'met' : ''}>
                            <i className={`bi ${met ? 'bi-check-circle-fill' : 'bi-circle'}`} aria-hidden="true" /> {t(`pwReq.${r.key}`)}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="st-note">
                    <i className="bi bi-info-circle" aria-hidden="true" />
                    <span>{t('settings.passwordDevicesNote')}</span>
                  </div>
                  <div className="st-actions">
                    <button type="submit" className="st-btn primary" disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}>
                      {savingPassword ? t('settings.saving') : t('settings.updatePassword')}
                    </button>
                  </div>
                </form>
              )}

              {section === 'account' && (
                <div className="st-panel">
                  <h3>{t('settings.accountInfo')}</h3>
                  <p className="st-panel-sub">{t('settings.accountInfoSub')}</p>
                  <div className="st-row"><span>{t('settings.accountType')}</span><span>{roleText}</span></div>
                  <div className="st-row">
                    <span>{t('settings.accountStatus')}</span>
                    <span>{profile?.status ? <span className="st-badge">{profile.status}</span> : '—'}</span>
                  </div>
                  <div className="st-row"><span>{t('settings.memberSince')}</span><span>{formatMemberSince(profile?.createdAt)}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rendered into <body>: .settings-fullscreen has a transform (its
          slide-in), which would otherwise trap position:fixed children. */}
      {cropFile && createPortal(
        <PhotoCropModal
          file={cropFile}
          t={t}
          saving={uploadingPhoto}
          onCancel={() => { if (!uploadingPhoto) setCropFile(null); }}
          onSave={handleSaveCroppedPhoto}
        />,
        document.body
      )}
    </div>
  );
}

export default SettingsPage;
