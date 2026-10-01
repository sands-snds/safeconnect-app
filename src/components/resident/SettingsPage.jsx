import React, { useState, useRef, useEffect } from 'react';
import {
  fetchUserProfile,
  updateUsername,
  updateContact,
  updateEmail,
  changePassword,
  uploadProfilePhoto
} from '../../Services/api';
import { useLanguage } from '../../i18n/LanguageContext';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Strips whatever prefix a stored number has (+63, 63, or a leading 0) and
// keeps the last 10 digits, so an existing "+639171234567" loads back into
// the same "9XXXXXXXXX" input the sign-up form uses.
const stripPhonePrefix = (raw) => {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  return digits.slice(-10);
};

const formatMemberSince = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

function SettingsPage({ isOpen, onClose, user, onProfileUpdate }) {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(user || null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Photo
  const [pendingFile, setPendingFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState(null);

  // Email
  const [emailInput, setEmailInput] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState(null);

  // Contact number
  const [contactInput, setContactInput] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [contactMessage, setContactMessage] = useState(null);

  // Username
  const [usernameInput, setUsernameInput] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState(null);

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

  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      // GET /users/:id returns the raw registered_users row directly
      // (full_name, contact_number, email_address, photo_url, ...), not
      // wrapped in { success, user } — map it into the camelCase shape
      // the rest of this component uses.
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
      setUsernameInput(mapped?.username || '');
      setEmailInput(mapped?.email || '');
      setContactInput(stripPhonePrefix(mapped?.contact));

      // Keep the navbar avatar in sync with whatever the backend returns.
      if (mapped?.photoUrl) {
        onProfileUpdate?.({ photoUrl: mapped.photoUrl });
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  // — just preview, don't upload yet
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoMessage({ type: 'error', text: t('settings.photoTypeError') });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoMessage({ type: 'error', text: t('settings.photoSizeError') });
      return;
    }

    setPendingFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoMessage(null);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // — upload only when Save Photo is clicked
  const handleSavePhoto = async () => {
    if (!pendingFile) return;

    setUploadingPhoto(true);
    setPhotoMessage(null);
    try {
      const result = await uploadProfilePhoto(user.id, pendingFile);
      if (result.success) {
        // result.photoUrl is already fully resolved by api.js
        const savedUrl = result.photoUrl;
        setProfile(p => ({ ...p, photoUrl: savedUrl }));
        setPhotoPreview(savedUrl);   // keep showing the new photo permanently
        setPendingFile(null);
        setPhotoMessage({ type: 'success', text: t('settings.photoSuccess') });
        onProfileUpdate?.({ photoUrl: savedUrl });
      } else {
        setPhotoMessage({ type: 'error', text: result.message || t('settings.photoUploadError') });
      }
    } catch {
      setPhotoMessage({ type: 'error', text: t('settings.serverError') });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCancelPhoto = () => {
    setPendingFile(null);
    setPhotoPreview(null);
    setPhotoMessage(null);
  };

  const handleSaveEmail = async () => {
    setEmailMessage(null);
    const trimmed = emailInput.trim();

    if (!trimmed) { setEmailMessage({ type: 'error', text: t('settings.emailEmptyError') }); return; }
    if (!EMAIL_REGEX.test(trimmed)) { setEmailMessage({ type: 'error', text: t('settings.emailInvalidError') }); return; }
    if (trimmed === profile?.email) { setEmailMessage(null); return; }
    if (!emailPassword) {
      setEmailMessage({ type: 'error', text: t('settings.emailPasswordRequired') });
      return;
    }

    setSavingEmail(true);
    try {
      const result = await updateEmail(user.id, trimmed, emailPassword);
      if (result.success) {
        setProfile(p => ({ ...p, email: trimmed }));
        setEmailMessage({ type: 'success', text: t('settings.emailUpdated') });
        setEmailPassword('');
        onProfileUpdate?.({ email: trimmed });
      } else {
        setEmailMessage({ type: 'error', text: result.message || t('settings.emailUpdateError') });
      }
    } catch {
      setEmailMessage({ type: 'error', text: t('settings.serverError') });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSaveContact = async () => {
    setContactMessage(null);

    if (contactInput.length !== 10) {
      setContactMessage({ type: 'error', text: t('settings.contactInvalidError') });
      return;
    }
    const fullContact = `+63${contactInput}`;
    if (fullContact === profile?.contact) { setContactMessage(null); return; }

    setSavingContact(true);
    try {
      const result = await updateContact(user.id, fullContact);
      if (result.success) {
        setProfile(p => ({ ...p, contact: fullContact }));
        setContactMessage({ type: 'success', text: t('settings.contactUpdated') });
        onProfileUpdate?.({ contact: fullContact });
      } else {
        setContactMessage({ type: 'error', text: result.message || t('settings.contactUpdateError') });
      }
    } catch {
      setContactMessage({ type: 'error', text: t('settings.serverError') });
    } finally {
      setSavingContact(false);
    }
  };

  const handleSaveUsername = async () => {
    const trimmed = usernameInput.trim();
    if (!trimmed) { setUsernameMessage({ type: 'error', text: t('settings.usernameEmptyError') }); return; }
    if (trimmed === profile?.username) { setUsernameMessage(null); return; }

    setSavingUsername(true);
    setUsernameMessage(null);
    try {
      const result = await updateUsername(user.id, trimmed);
      if (result.success) {
        setProfile(p => ({ ...p, username: result.username || trimmed }));
        setUsernameMessage({ type: 'success', text: t('settings.usernameUpdated') });
        onProfileUpdate?.({ username: result.username || trimmed });
      } else {
        setUsernameMessage({ type: 'error', text: result.message || t('settings.usernameUpdateError') });
      }
    } catch {
      setUsernameMessage({ type: 'error', text: t('settings.serverError') });
    } finally {
      setSavingUsername(false);
    }
  };

  const handleSavePassword = async () => {
    setPasswordMessage(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: t('settings.passwordFillAll') }); return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: t('settings.passwordTooShort') }); return;
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

  const initials = (profile?.fullName || profile?.username || 'U')
    .trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();

  const displayPhoto = photoPreview || profile?.photoUrl || null;

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
          background: linear-gradient(135deg, #6B2C3E 0%, #8B3A52 100%);
          padding: 1.25rem clamp(1.5rem, 5vw, 4rem);
          display: flex; align-items: center; justify-content: space-between;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15); flex-shrink: 0;
        }
        .settings-header h2 { color: white; font-size: clamp(1.2rem,2.5vw,1.6rem); font-weight: 700; margin: 0; display: flex; align-items: center; gap: 0.6rem; }
        .settings-header-sub { color: rgba(255,255,255,0.75); font-size: 0.8rem; margin: 0.2rem 0 0 2.2rem; }
        .settings-close-btn { background: rgba(255,255,255,0.15); border: none; color: white; width: 42px; height: 42px; border-radius: 50%; font-size: 1.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s; flex-shrink: 0; }
        .settings-close-btn:hover { background: rgba(255,255,255,0.28); }
        .settings-body { flex: 1; overflow-y: auto; padding: clamp(1.5rem,4vw,3rem) clamp(1.5rem,5vw,4rem) 4rem; }
        .settings-container { max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.75rem; }
        .settings-card { background: white; border-radius: 16px; padding: clamp(1.5rem,3vw,2rem); box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .settings-card h3 { font-size: 1.05rem; font-weight: 700; color: #1f2937; margin: 0 0 0.35rem; display: flex; align-items: center; gap: 0.5rem; }
        .settings-card h3 i { color: #6B2C3E; }
        .settings-card-sub { font-size: 0.85rem; color: #9ca3af; margin: 0 0 1.25rem; }
        .settings-photo-row { display: flex; align-items: center; gap: 1.25rem; }
        .settings-avatar { width: 80px; height: 80px; border-radius: 50%; background: #6B2C3E; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; flex-shrink: 0; overflow: hidden; }
        .settings-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .settings-photo-actions { display: flex; flex-direction: column; gap: 0.5rem; }
        .settings-photo-btn-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .settings-btn-secondary { border: 1px solid #e5d9dc; background: white; color: #6B2C3E; font-size: 0.85rem; font-weight: 600; padding: 0.55rem 1.1rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .settings-btn-secondary:hover { background: rgba(107,44,62,0.06); }
        .settings-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
        .settings-btn-save-photo { border: none; background: #6B2C3E; color: white; font-size: 0.85rem; font-weight: 700; padding: 0.55rem 1.1rem; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
        .settings-btn-save-photo:hover { background: #58202f; }
        .settings-btn-save-photo:disabled { opacity: 0.6; cursor: not-allowed; }
        .settings-btn-cancel-photo { border: 1px solid #ddd; background: white; color: #888; font-size: 0.85rem; font-weight: 600; padding: 0.55rem 1.1rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .settings-btn-cancel-photo:hover { background: #f5f5f5; }
        .settings-photo-hint { font-size: 0.75rem; color: #9ca3af; }
        .settings-field { margin-bottom: 1rem; }
        .settings-field label { display: block; font-size: 0.82rem; font-weight: 600; color: #374151; margin-bottom: 0.4rem; }
        .settings-field-hint { font-weight: 400; color: #9ca3af; font-size: 0.78rem; }
        .settings-field input { width: 100%; padding: 0.65rem 0.9rem; border: 1px solid #e5d9dc; border-radius: 8px; font-size: 0.92rem; color: #1f2937; box-sizing: border-box; transition: border-color 0.2s; }
        .settings-field input:focus { outline: none; border-color: #6B2C3E; }
        .settings-field input:disabled { background: #f7f5f6; cursor: not-allowed; }
        .settings-phone-row { display: flex; gap: 8px; }
        .settings-phone-prefix { display: flex; align-items: center; padding: 0 0.9rem; border: 1px solid #e5d9dc; border-radius: 8px; background: #f7f5f6; color: #374151; font-weight: 600; font-size: 0.92rem; flex-shrink: 0; }
        .settings-phone-row input { flex: 1; min-width: 0; }
        .settings-btn-primary { border: none; background: #6B2C3E; color: white; font-size: 0.88rem; font-weight: 700; padding: 0.65rem 1.4rem; border-radius: 8px; cursor: pointer; transition: background-color 0.2s; }
        .settings-btn-primary:hover { background: #58202f; }
        .settings-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .settings-inline-message { font-size: 0.82rem; font-weight: 600; margin-top: 0.75rem; }
        .settings-inline-message.success { color: #166534; }
        .settings-inline-message.error { color: #991b1b; }
        .settings-readonly-row { display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid #f5f5f5; font-size: 0.88rem; gap: 1rem; }
        .settings-readonly-row:last-child { border-bottom: none; }
        .settings-readonly-row span:first-child { color: #9ca3af; }
        .settings-readonly-row span:last-child { color: #1f2937; font-weight: 600; text-align: right; }
        .settings-status-badge { display: inline-flex; padding: 2px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; background: #dcfce7; color: #166534; }
        .settings-photo-pending-note { font-size: 0.75rem; color: #f97316; font-weight: 600; }
        .settings-divider { border: none; border-top: 1px solid #f0eaec; margin: 1.5rem 0; }
      `}</style>

      <div className="settings-header">
        <div>
          <h2><i className="bi bi-gear-fill" /> {t('settings.title')}</h2>
          <p className="settings-header-sub">{t('settings.subtitle')}</p>
        </div>
        <button className="settings-close-btn" onClick={onClose} aria-label="Close settings">
          <i className="bi bi-x-lg" />
        </button>
      </div>

      <div className="settings-body">
        <div className="settings-container">

          {/* ── Profile photo + name ── */}
          <div className="settings-card">
            <h3><i className="bi bi-person-badge-fill" /> {t('settings.profilePhoto')}</h3>
            <p className="settings-card-sub">{t('settings.profilePhotoSub')}</p>

            <div className="settings-photo-row">
              <div className="settings-avatar">
                {displayPhoto
                  ? <img src={displayPhoto} alt="Profile" />
                  : initials}
              </div>

              <div className="settings-photo-actions">
                <div className="settings-photo-btn-row">
                  <button
                    className="settings-btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto || loadingProfile}
                  >
                    <i className="bi bi-image me-1" />
                    {t('settings.choosePhoto')}
                  </button>

                  {pendingFile && (
                    <>
                      <button
                        className="settings-btn-save-photo"
                        onClick={handleSavePhoto}
                        disabled={uploadingPhoto}
                      >
                        {uploadingPhoto
                          ? <><i className="bi bi-arrow-repeat me-1" />{t('settings.uploading')}</>
                          : <><i className="bi bi-check-lg me-1" />{t('settings.savePhoto')}</>}
                      </button>
                      <button
                        className="settings-btn-cancel-photo"
                        onClick={handleCancelPhoto}
                        disabled={uploadingPhoto}
                      >
                        {t('settings.cancel')}
                      </button>
                    </>
                  )}
                </div>

                {pendingFile && !photoMessage && (
                  <p className="settings-photo-pending-note">
                    <i className="bi bi-info-circle me-1" />
                    {t('settings.photoPendingNote')}
                  </p>
                )}

                <span className="settings-photo-hint">{t('settings.photoHint')}</span>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {photoMessage && (
              <div className={`settings-inline-message ${photoMessage.type}`}>
                <i className={`bi ${photoMessage.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'} me-1`} />
                {photoMessage.text}
              </div>
            )}

            <div style={{ marginTop: '1.5rem' }}>
              <div className="settings-readonly-row"><span>{t('settings.fullName')}</span><span>{profile?.fullName || '—'}</span></div>
            </div>
          </div>

          {/* ── Contact Information ── */}
          <div className="settings-card">
            <h3><i className="bi bi-person-lines-fill" /> {t('settings.contactInfo')}</h3>
            <p className="settings-card-sub">{t('settings.contactInfoSub')}</p>

            <div className="settings-field">
              <label htmlFor="settings-email">{t('settings.emailAddress')}</label>
              <input
                id="settings-email"
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                disabled={loadingProfile}
              />
            </div>
            <div className="settings-field">
              <label htmlFor="settings-email-password">
                {t('settings.currentPassword')} <span className="settings-field-hint">{t('settings.emailPasswordHint')}</span>
              </label>
              <input
                id="settings-email-password"
                type="password"
                value={emailPassword}
                onChange={e => setEmailPassword(e.target.value)}
                placeholder={t('settings.currentPasswordPlaceholder')}
                disabled={loadingProfile}
              />
            </div>
            <button className="settings-btn-primary" onClick={handleSaveEmail} disabled={savingEmail || loadingProfile}>
              {savingEmail ? t('settings.saving') : t('settings.saveEmail')}
            </button>
            {emailMessage && (
              <div className={`settings-inline-message ${emailMessage.type}`}>{emailMessage.text}</div>
            )}

            <hr className="settings-divider" />

            <div className="settings-field">
              <label htmlFor="settings-contact">{t('settings.phoneNumber')}</label>
              <div className="settings-phone-row">
                <span className="settings-phone-prefix">+63</span>
                <input
                  id="settings-contact"
                  type="tel"
                  inputMode="numeric"
                  value={contactInput}
                  onChange={e => setContactInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9XXXXXXXXX"
                  maxLength={10}
                  disabled={loadingProfile}
                />
              </div>
            </div>
            <button className="settings-btn-primary" onClick={handleSaveContact} disabled={savingContact || loadingProfile}>
              {savingContact ? t('settings.saving') : t('settings.savePhoneNumber')}
            </button>
            {contactMessage && (
              <div className={`settings-inline-message ${contactMessage.type}`}>{contactMessage.text}</div>
            )}
          </div>

          {/* ── Username ── */}
          <div className="settings-card">
            <h3><i className="bi bi-at" /> {t('settings.username')}</h3>
            <p className="settings-card-sub">{t('settings.usernameSub')}</p>
            <div className="settings-field">
              <label htmlFor="settings-username">{t('settings.username')}</label>
              <input
                id="settings-username"
                type="text"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                placeholder={t('settings.usernamePlaceholder')}
                disabled={loadingProfile}
              />
            </div>
            <button className="settings-btn-primary" onClick={handleSaveUsername} disabled={savingUsername || loadingProfile}>
              {savingUsername ? t('settings.saving') : t('settings.saveUsername')}
            </button>
            {usernameMessage && (
              <div className={`settings-inline-message ${usernameMessage.type}`}>{usernameMessage.text}</div>
            )}
          </div>

          {/* ── Password ── */}
          <div className="settings-card">
            <h3><i className="bi bi-lock-fill" /> {t('settings.password')}</h3>
            <p className="settings-card-sub">{t('settings.passwordSub')}</p>
            <div className="settings-field">
              <label htmlFor="settings-current-password">{t('settings.currentPassword')}</label>
              <input id="settings-current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder={t('settings.currentPasswordPlaceholder')} />
            </div>
            <div className="settings-field">
              <label htmlFor="settings-new-password">{t('settings.newPassword')}</label>
              <input id="settings-new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t('settings.newPasswordPlaceholder')} />
            </div>
            <div className="settings-field">
              <label htmlFor="settings-confirm-password">{t('settings.confirmNewPassword')}</label>
              <input id="settings-confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t('settings.confirmNewPasswordPlaceholder')} />
            </div>
            <button className="settings-btn-primary" onClick={handleSavePassword} disabled={savingPassword}>
              {savingPassword ? t('settings.saving') : t('settings.updatePassword')}
            </button>
            {passwordMessage && (
              <div className={`settings-inline-message ${passwordMessage.type}`}>{passwordMessage.text}</div>
            )}
          </div>

          {/* ── Account Information ── */}
          <div className="settings-card">
            <h3><i className="bi bi-info-circle-fill" /> {t('settings.accountInfo')}</h3>
            <p className="settings-card-sub">{t('settings.accountInfoSub')}</p>
            <div className="settings-readonly-row">
              <span>{t('settings.accountType')}</span>
              <span>{profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : '—'}</span>
            </div>
            <div className="settings-readonly-row">
              <span>{t('settings.accountStatus')}</span>
              <span>
                {profile?.status
                  ? <span className="settings-status-badge">{profile.status}</span>
                  : '—'}
              </span>
            </div>
            <div className="settings-readonly-row">
              <span>{t('settings.memberSince')}</span>
              <span>{formatMemberSince(profile?.createdAt)}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
