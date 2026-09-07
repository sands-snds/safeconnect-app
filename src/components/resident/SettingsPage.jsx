import React, { useState, useRef, useEffect } from 'react';
import { fetchUserProfile, updateUsername, changePassword, uploadProfilePhoto } from '../../Services/api';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
// Note: api.js already runs resolveAssetUrl on all photo URLs before returning
// them, so no further URL resolution is needed here.

function SettingsPage({ isOpen, onClose, user, onProfileUpdate }) {
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(user || null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Photo
  const [pendingFile, setPendingFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState(null);

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
      const result = await fetchUserProfile(user.id);
      if (result.success) {
        // fetchUserProfile already runs resolveAssetUrl on photo_url inside api.js,
        // so result.user.photoUrl is already a full URL here.
        setProfile(result.user);
        setUsernameInput(result.user.username || '');
        // Keep the navbar avatar in sync with whatever the backend returns.
        if (result.user.photoUrl) {
          onProfileUpdate?.({ photoUrl: result.user.photoUrl });
        }
      } else {
        setProfile(user);
        setUsernameInput(user?.username || '');
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
      setPhotoMessage({ type: 'error', text: 'Please choose a JPG, PNG, or WEBP image.' });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoMessage({ type: 'error', text: 'Photo must be under 5MB.' });
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
        setPhotoMessage({ type: 'success', text: 'Profile photo updated successfully.' });
        onProfileUpdate?.({ photoUrl: savedUrl });
      } else {
        setPhotoMessage({ type: 'error', text: result.message || 'Could not upload photo.' });
      }
    } catch {
      setPhotoMessage({ type: 'error', text: 'Could not reach the server. Please try again.' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCancelPhoto = () => {
    setPendingFile(null);
    setPhotoPreview(null);
    setPhotoMessage(null);
  };

  const handleSaveUsername = async () => {
    const trimmed = usernameInput.trim();
    if (!trimmed) { setUsernameMessage({ type: 'error', text: 'Username cannot be empty.' }); return; }
    if (trimmed === profile?.username) { setUsernameMessage(null); return; }

    setSavingUsername(true);
    setUsernameMessage(null);
    try {
      const result = await updateUsername(user.id, trimmed);
      if (result.success) {
        setProfile(p => ({ ...p, username: result.username || trimmed }));
        setUsernameMessage({ type: 'success', text: 'Username updated.' });
        onProfileUpdate?.({ username: result.username || trimmed });
      } else {
        setUsernameMessage({ type: 'error', text: result.message || 'Could not update username.' });
      }
    } catch {
      setUsernameMessage({ type: 'error', text: 'Could not reach the server. Please try again.' });
    } finally {
      setSavingUsername(false);
    }
  };

  const handleSavePassword = async () => {
    setPasswordMessage(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Fill in all three password fields.' }); return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters.' }); return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' }); return;
    }

    setSavingPassword(true);
    try {
      const result = await changePassword(user.id, currentPassword, newPassword);
      if (result.success) {
        setPasswordMessage({ type: 'success', text: 'Password updated.' });
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: result.message || 'Could not update password.' });
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Could not reach the server. Please try again.' });
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
          position: fixed; inset: 0; background: #f7f5f6;
          z-index: 2000; display: flex; flex-direction: column;
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
        .settings-close-btn { background: rgba(255,255,255,0.15); border: none; color: white; width: 42px; height: 42px; border-radius: 50%; font-size: 1.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s; }
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
        .settings-field input { width: 100%; padding: 0.65rem 0.9rem; border: 1px solid #e5d9dc; border-radius: 8px; font-size: 0.92rem; color: #1f2937; box-sizing: border-box; transition: border-color 0.2s; }
        .settings-field input:focus { outline: none; border-color: #6B2C3E; }
        .settings-btn-primary { border: none; background: #6B2C3E; color: white; font-size: 0.88rem; font-weight: 700; padding: 0.65rem 1.4rem; border-radius: 8px; cursor: pointer; transition: background-color 0.2s; }
        .settings-btn-primary:hover { background: #58202f; }
        .settings-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .settings-inline-message { font-size: 0.82rem; font-weight: 600; margin-top: 0.75rem; }
        .settings-inline-message.success { color: #166534; }
        .settings-inline-message.error { color: #991b1b; }
        .settings-readonly-row { display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid #f5f5f5; font-size: 0.88rem; }
        .settings-readonly-row:last-child { border-bottom: none; }
        .settings-readonly-row span:first-child { color: #9ca3af; }
        .settings-readonly-row span:last-child { color: #1f2937; font-weight: 600; }
        .settings-photo-pending-note { font-size: 0.75rem; color: #f97316; font-weight: 600; }
      `}</style>

      <div className="settings-header">
        <h2><i className="bi bi-gear-fill" /> Settings</h2>
        <button className="settings-close-btn" onClick={onClose} aria-label="Close settings">
          <i className="bi bi-x-lg" />
        </button>
      </div>

      <div className="settings-body">
        <div className="settings-container">

          {/* ── Profile photo + readonly info ── */}
          <div className="settings-card">
            <h3><i className="bi bi-person-badge-fill" /> Edit Profile</h3>
            <p className="settings-card-sub">Update your profile photo and view your account details.</p>

            <div className="settings-photo-row">
              {/* avatar */}
              <div className="settings-avatar">
                {displayPhoto
                  ? <img src={displayPhoto} alt="Profile" />
                  : initials}
              </div>

              <div className="settings-photo-actions">
                <div className="settings-photo-btn-row">
                  {/* always show Choose Photo */}
                  <button
                    className="settings-btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto || loadingProfile}
                  >
                    <i className="bi bi-image me-1" />
                    Choose Photo
                  </button>

                  {/* Save Photo — only visible when a file is staged */}
                  {pendingFile && (
                    <>
                      <button
                        className="settings-btn-save-photo"
                        onClick={handleSavePhoto}
                        disabled={uploadingPhoto}
                      >
                        {uploadingPhoto
                          ? <><i className="bi bi-arrow-repeat me-1" />Uploading...</>
                          : <><i className="bi bi-check-lg me-1" />Save Photo</>}
                      </button>
                      <button
                        className="settings-btn-cancel-photo"
                        onClick={handleCancelPhoto}
                        disabled={uploadingPhoto}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>

                {pendingFile && !photoMessage && (
                  <p className="settings-photo-pending-note">
                    <i className="bi bi-info-circle me-1" />
                    Photo selected — click Save Photo to apply.
                  </p>
                )}

                <span className="settings-photo-hint">JPG, PNG, or WEBP · Max 5MB</span>

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
              <div className="settings-readonly-row"><span>Full name</span><span>{profile?.fullName || '—'}</span></div>
              <div className="settings-readonly-row"><span>Email</span><span>{profile?.email || '—'}</span></div>
              <div className="settings-readonly-row"><span>Contact number</span><span>{profile?.contact || '—'}</span></div>
            </div>
          </div>

          {/* ── Username ── */}
          <div className="settings-card">
            <h3><i className="bi bi-at" /> Username</h3>
            <p className="settings-card-sub">This is how you'll be identified across SafeConnect.</p>
            <div className="settings-field">
              <label htmlFor="settings-username">Username</label>
              <input
                id="settings-username"
                type="text"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                placeholder="Enter a username"
                disabled={loadingProfile}
              />
            </div>
            <button className="settings-btn-primary" onClick={handleSaveUsername} disabled={savingUsername || loadingProfile}>
              {savingUsername ? 'Saving...' : 'Save username'}
            </button>
            {usernameMessage && (
              <div className={`settings-inline-message ${usernameMessage.type}`}>{usernameMessage.text}</div>
            )}
          </div>

          {/* ── Password ── */}
          <div className="settings-card">
            <h3><i className="bi bi-lock-fill" /> Password</h3>
            <p className="settings-card-sub">Choose a new password with at least 8 characters.</p>
            <div className="settings-field">
              <label htmlFor="settings-current-password">Current password</label>
              <input id="settings-current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter your current password" />
            </div>
            <div className="settings-field">
              <label htmlFor="settings-new-password">New password</label>
              <input id="settings-new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
            </div>
            <div className="settings-field">
              <label htmlFor="settings-confirm-password">Confirm new password</label>
              <input id="settings-confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter your new password" />
            </div>
            <button className="settings-btn-primary" onClick={handleSavePassword} disabled={savingPassword}>
              {savingPassword ? 'Saving...' : 'Update password'}
            </button>
            {passwordMessage && (
              <div className={`settings-inline-message ${passwordMessage.type}`}>{passwordMessage.text}</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default SettingsPage;