import React, { useState, useEffect, useRef } from 'react';
import { fetchUserProfile, updateUsername, changePassword, uploadProfilePhoto } from '../../Services/api';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB, matches backend limit

function SettingsPage({ isOpen, onClose, user, onProfileUpdate }) {
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(user || null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Photo
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState(null); // { type: 'success'|'error', text }

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
    if (isOpen && user?.id) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.id]);

  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      const result = await fetchUserProfile(user.id);
      if (result.success) {
        setProfile(result.user);
        setUsernameInput(result.user.username || '');
      } else {
        // Fall back to whatever we already had from login
        setProfile(user);
        setUsernameInput(user?.username || '');
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePhotoSelect = async (e) => {
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

    setPhotoPreview(URL.createObjectURL(file));
    setPhotoMessage(null);
    setUploadingPhoto(true);

    try {
      const result = await uploadProfilePhoto(user.id, file);
      if (result.success) {
        setProfile((p) => ({ ...p, photoUrl: result.photoUrl }));
        setPhotoMessage({ type: 'success', text: 'Profile photo updated.' });
        onProfileUpdate?.({ photoUrl: result.photoUrl });
      } else {
        setPhotoMessage({ type: 'error', text: result.message || 'Could not upload photo.' });
      }
    } catch {
      setPhotoMessage({ type: 'error', text: 'Could not reach the server. Please try again.' });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveUsername = async () => {
    const trimmed = usernameInput.trim();
    if (!trimmed) {
      setUsernameMessage({ type: 'error', text: 'Username cannot be empty.' });
      return;
    }
    if (trimmed === profile?.username) {
      setUsernameMessage(null);
      return;
    }

    setSavingUsername(true);
    setUsernameMessage(null);
    try {
      const result = await updateUsername(user.id, trimmed);
      if (result.success) {
        setProfile((p) => ({ ...p, username: result.username || trimmed }));
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
      setPasswordMessage({ type: 'error', text: 'Fill in all three password fields.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setSavingPassword(true);
    try {
      const result = await changePassword(user.id, currentPassword, newPassword);
      if (result.success) {
        setPasswordMessage({ type: 'success', text: 'Password updated.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
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
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const displayPhoto = photoPreview || profile?.photoUrl;

  return (
    <div className={`settings-fullscreen ${isOpen ? 'show' : ''}`}>
      <style>{`
        .settings-fullscreen {
          position: fixed;
          inset: 0;
          background: #f7f5f6;
          z-index: 2000;
          display: flex;
          flex-direction: column;
          opacity: 0;
          visibility: hidden;
          transform: translateY(20px);
          transition: all 0.3s ease;
        }

        .settings-fullscreen.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .settings-header {
          background: linear-gradient(135deg, #6B2C3E 0%, #8B3A52 100%);
          padding: 1.25rem clamp(1.5rem, 5vw, 4rem);
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
          flex-shrink: 0;
        }

        .settings-header h2 {
          color: white;
          font-size: clamp(1.2rem, 2.5vw, 1.6rem);
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .settings-close-btn {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: white;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .settings-close-btn:hover {
          background: rgba(255, 255, 255, 0.28);
        }

        .settings-body {
          flex: 1;
          overflow-y: auto;
          padding: clamp(1.5rem, 4vw, 3rem) clamp(1.5rem, 5vw, 4rem) 4rem;
        }

        .settings-container {
          max-width: 640px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .settings-card {
          background: white;
          border-radius: 16px;
          padding: clamp(1.5rem, 3vw, 2rem);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        }

        .settings-card h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.35rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .settings-card h3 i {
          color: #6B2C3E;
        }

        .settings-card-sub {
          font-size: 0.85rem;
          color: #9ca3af;
          margin: 0 0 1.25rem;
        }

        /* Photo section */
        .settings-photo-row {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .settings-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #6B2C3E;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          flex-shrink: 0;
          overflow: hidden;
          background-size: cover;
          background-position: center;
        }

        .settings-photo-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .settings-btn-secondary {
          border: 1px solid #e5d9dc;
          background: white;
          color: #6B2C3E;
          font-size: 0.85rem;
          font-weight: 600;
          padding: 0.55rem 1.1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .settings-btn-secondary:hover {
          background: rgba(107, 44, 62, 0.06);
        }

        .settings-btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .settings-photo-hint {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        /* Form fields */
        .settings-field {
          margin-bottom: 1rem;
        }

        .settings-field label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.4rem;
        }

        .settings-field input {
          width: 100%;
          padding: 0.65rem 0.9rem;
          border: 1px solid #e5d9dc;
          border-radius: 8px;
          font-size: 0.92rem;
          color: #1f2937;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }

        .settings-field input:focus {
          outline: none;
          border-color: #6B2C3E;
        }

        .settings-btn-primary {
          border: none;
          background: #6B2C3E;
          color: white;
          font-size: 0.88rem;
          font-weight: 700;
          padding: 0.65rem 1.4rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .settings-btn-primary:hover {
          background: #58223330;
          background: #58202f;
        }

        .settings-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .settings-inline-message {
          font-size: 0.82rem;
          font-weight: 600;
          margin-top: 0.75rem;
        }

        .settings-inline-message.success { color: #166534; }
        .settings-inline-message.error { color: #991b1b; }

        .settings-readonly-row {
          display: flex;
          justify-content: space-between;
          padding: 0.6rem 0;
          border-bottom: 1px solid #f5f5f5;
          font-size: 0.88rem;
        }

        .settings-readonly-row:last-child { border-bottom: none; }
        .settings-readonly-row span:first-child { color: #9ca3af; }
        .settings-readonly-row span:last-child { color: #1f2937; font-weight: 600; }
      `}</style>

      <div className="settings-header">
        <h2><i className="bi bi-gear-fill"></i> Settings</h2>
        <button className="settings-close-btn" onClick={onClose} aria-label="Close settings">
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <div className="settings-body">
        <div className="settings-container">

          {/* Edit Profile: photo */}
          <div className="settings-card">
            <h3><i className="bi bi-person-badge-fill"></i> Edit Profile</h3>
            <p className="settings-card-sub">Update your profile photo, username, and account details.</p>

            <div className="settings-photo-row">
              <div
                className="settings-avatar"
                style={displayPhoto ? { backgroundImage: `url(${displayPhoto})` } : undefined}
              >
                {!displayPhoto && initials}
              </div>
              <div className="settings-photo-actions">
                <button
                  className="settings-btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto || loadingProfile}
                >
                  {uploadingPhoto ? 'Uploading...' : 'Change photo'}
                </button>
                <span className="settings-photo-hint">JPG, PNG, or WEBP. Max 5MB.</span>
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
              <div className={`settings-inline-message ${photoMessage.type}`}>{photoMessage.text}</div>
            )}

            <div style={{ marginTop: '1.5rem' }}>
              <div className="settings-readonly-row">
                <span>Full name</span>
                <span>{profile?.fullName || '—'}</span>
              </div>
              <div className="settings-readonly-row">
                <span>Email</span>
                <span>{profile?.email || '—'}</span>
              </div>
              <div className="settings-readonly-row">
                <span>Contact number</span>
                <span>{profile?.contact || '—'}</span>
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="settings-card">
            <h3><i className="bi bi-at"></i> Username</h3>
            <p className="settings-card-sub">This is how you'll be identified across Safe Connect.</p>

            <div className="settings-field">
              <label htmlFor="settings-username">Username</label>
              <input
                id="settings-username"
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
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

          {/* Password */}
          <div className="settings-card">
            <h3><i className="bi bi-lock-fill"></i> Password</h3>
            <p className="settings-card-sub">Choose a new password with at least 8 characters.</p>

            <div className="settings-field">
              <label htmlFor="settings-current-password">Current password</label>
              <input
                id="settings-current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
              />
            </div>
            <div className="settings-field">
              <label htmlFor="settings-new-password">New password</label>
              <input
                id="settings-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="settings-field">
              <label htmlFor="settings-confirm-password">Confirm new password</label>
              <input
                id="settings-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
              />
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