import React, { useEffect, useRef, useState } from "react";
import {
  fetchUserProfile,
  updateUsername,
  updateContact,
  updateEmail,
  changePassword,
  uploadProfilePhoto
} from "../../../Services/api";
import { roleLabel, MAIN_ACCOUNT_EMAIL } from "../../shared/roles";

// Account Settings for whoever is signed in to the admin panel (Admins and
// Officials), opened from the account menu at the top right. Same options
// as the resident Settings page: photo, username, contact number, email and
// password. The main barangay account's email can't be changed.

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "+639171234567" -> "9171234567" (the input shows the +63 prefix itself).
const stripPhonePrefix = (raw) => String(raw || "").replace(/\D/g, "").slice(-10);

const formatDate = (value) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 16 };
const cardTitle = { margin: "0 0 4px", fontSize: 16, display: "flex", alignItems: "center", gap: 8 };
const cardHint = { margin: "0 0 14px", fontSize: 13, color: "#6b7280" };
const row = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" };
const field = (flex = "1 1 220px") => ({ display: "flex", flexDirection: "column", gap: 4, flex, minWidth: 180 });
const label = { fontSize: 12, fontWeight: 600, color: "#6b7280" };

const Message = ({ message }) =>
  message ? (
    <p style={{ margin: "10px 0 0", fontSize: 13, color: message.type === "success" ? "#166534" : "#b91c1c" }}>
      <i className={`bi ${message.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-circle-fill"}`} style={{ marginRight: 6 }} />
      {message.text}
    </p>
  ) : null;

export default function AccountSettingsPage({ adminUser, onProfileUpdate }) {
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);

  const [pendingFile, setPendingFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoMsg, setPhotoMsg] = useState(null);
  const [savingPhoto, setSavingPhoto] = useState(false);

  const [username, setUsername] = useState("");
  const [usernameMsg, setUsernameMsg] = useState(null);
  const [savingUsername, setSavingUsername] = useState(false);

  const [contact, setContact] = useState("");
  const [contactMsg, setContactMsg] = useState(null);
  const [savingContact, setSavingContact] = useState(false);

  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailMsg, setEmailMsg] = useState(null);
  const [savingEmail, setSavingEmail] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!adminUser?.id) return;
    fetchUserProfile(adminUser.id).then((u) => {
      if (!u?.id) return;
      const p = {
        id: u.id,
        fullName: u.full_name,
        username: u.username,
        contact: u.contact_number,
        email: u.email_address,
        role: u.role,
        photoUrl: u.photoUrl || null,
        createdAt: u.created_at
      };
      setProfile(p);
      setUsername(p.username || "");
      setContact(stripPhonePrefix(p.contact));
      setEmail(p.email || "");
    }).catch(() => {});
  }, [adminUser?.id]);

  useEffect(() => () => { if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  if (!profile) return <div style={card}>Loading your account...</div>;

  const isMain = String(profile.email || "").toLowerCase() === MAIN_ACCOUNT_EMAIL;
  const initials = (profile.fullName || profile.username || "A").trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  const shownPhoto = photoPreview || profile.photoUrl;

  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoMsg({ type: "error", text: "Please choose a JPG, PNG or WebP image." });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoMsg({ type: "error", text: "Photos must be 5 MB or smaller." });
      return;
    }
    setPendingFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoMsg(null);
  };

  const savePhoto = async () => {
    setSavingPhoto(true);
    try {
      const result = await uploadProfilePhoto(profile.id, pendingFile);
      if (!result?.success) throw new Error(result?.message || "Couldn't upload the photo.");
      setProfile((p) => ({ ...p, photoUrl: result.photoUrl }));
      setPhotoPreview(null);
      setPendingFile(null);
      setPhotoMsg({ type: "success", text: "Profile photo updated." });
      onProfileUpdate({ photoUrl: result.photoUrl });
    } catch (err) {
      setPhotoMsg({ type: "error", text: err.message || "Couldn't reach the server." });
    } finally {
      setSavingPhoto(false);
    }
  };

  const saveUsername = async () => {
    const value = username.trim();
    if (!value) return setUsernameMsg({ type: "error", text: "Username can't be empty." });
    if (value === profile.username) return setUsernameMsg(null);
    setSavingUsername(true);
    try {
      const result = await updateUsername(profile.id, value);
      if (!result?.success) throw new Error(result?.message || "Couldn't update the username.");
      setProfile((p) => ({ ...p, username: value }));
      setUsernameMsg({ type: "success", text: "Username updated." });
      onProfileUpdate({ username: value });
    } catch (err) {
      setUsernameMsg({ type: "error", text: err.message || "Couldn't reach the server." });
    } finally {
      setSavingUsername(false);
    }
  };

  const saveContact = async () => {
    if (contact.length !== 10) return setContactMsg({ type: "error", text: "Enter the 10 digits after +63 (e.g. 9171234567)." });
    const full = `+63${contact}`;
    if (full === profile.contact) return setContactMsg(null);
    setSavingContact(true);
    try {
      const result = await updateContact(profile.id, full);
      if (!result?.success) throw new Error(result?.message || "Couldn't update the contact number.");
      setProfile((p) => ({ ...p, contact: full }));
      setContactMsg({ type: "success", text: "Contact number updated." });
    } catch (err) {
      setContactMsg({ type: "error", text: err.message || "Couldn't reach the server." });
    } finally {
      setSavingContact(false);
    }
  };

  const saveEmail = async () => {
    const value = email.trim();
    if (!EMAIL_REGEX.test(value)) return setEmailMsg({ type: "error", text: "Please enter a valid email address." });
    if (value === profile.email) return setEmailMsg(null);
    if (!emailPassword) return setEmailMsg({ type: "error", text: "Enter your current password to confirm this change." });
    setSavingEmail(true);
    try {
      const result = await updateEmail(profile.id, value, emailPassword);
      if (!result?.success) throw new Error(result?.message || "Couldn't update the email address.");
      setProfile((p) => ({ ...p, email: value }));
      setEmailPassword("");
      setEmailMsg({ type: "success", text: "Email address updated. Use it the next time you sign in." });
      onProfileUpdate({ email: value });
    } catch (err) {
      setEmailMsg({ type: "error", text: err.message || "Couldn't reach the server." });
    } finally {
      setSavingEmail(false);
    }
  };

  const savePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) return setPasswordMsg({ type: "error", text: "Fill in all three password fields." });
    if (newPw.length < 8) return setPasswordMsg({ type: "error", text: "The new password must be at least 8 characters." });
    if (newPw !== confirmPw) return setPasswordMsg({ type: "error", text: "The new passwords don't match." });
    if (newPw === currentPw) return setPasswordMsg({ type: "error", text: "The new password must be different from your current one." });
    setSavingPassword(true);
    try {
      const result = await changePassword(profile.id, currentPw, newPw);
      if (!result?.success) throw new Error(result?.message || "Couldn't change the password.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setPasswordMsg({ type: "success", text: "Password changed." });
    } catch (err) {
      setPasswordMsg({ type: "error", text: err.message || "Couldn't reach the server." });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div style={{ maxWidth: 860 }}>
      {/* ── Profile summary + photo ── */}
      <div style={{ ...card, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          {shownPhoto ? (
            <img src={shownPhoto} alt="Profile" style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "3px solid #FDECEC" }} />
          ) : (
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#6B2C3E", color: "#fff", fontSize: 30, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {initials}
            </div>
          )}
          <button
            type="button"
            title="Change photo"
            onClick={() => fileInputRef.current?.click()}
            style={{ position: "absolute", right: -2, bottom: -2, width: 34, height: 34, borderRadius: "50%", border: "2px solid #fff", background: "#6B2C3E", color: "#fff", cursor: "pointer" }}
          >
            <i className="bi bi-camera-fill" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickPhoto} />
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>{profile.fullName || profile.username}</div>
          <div style={{ fontSize: 13.5, color: "#6b7280" }}>{profile.email}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 10px", borderRadius: 999, background: profile.role === "super_admin" ? "#3b0d1b" : "#FDECEC", color: profile.role === "super_admin" ? "#fff" : "#6B2C3E" }}>
              {roleLabel(profile.role)}
            </span>
            {isMain && (
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 10px", borderRadius: 999, background: "#f3f4f6", color: "#374151" }}>
                <i className="bi bi-lock-fill" style={{ marginRight: 4 }} />Main barangay account
              </span>
            )}
            <span style={{ fontSize: 12.5, color: "#9ca3af" }}>Member since {formatDate(profile.createdAt)}</span>
          </div>
          {pendingFile && (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button type="button" className="button button-primary" disabled={savingPhoto} onClick={savePhoto}>
                {savingPhoto ? "Saving…" : "Save photo"}
              </button>
              <button type="button" className="button button-secondary" disabled={savingPhoto} onClick={() => { setPendingFile(null); setPhotoPreview(null); setPhotoMsg(null); }}>
                Cancel
              </button>
            </div>
          )}
          <Message message={photoMsg} />
        </div>
      </div>

      {/* ── Username ── */}
      <div style={card}>
        <h3 style={cardTitle}><i className="bi bi-person-fill" style={{ color: "#6B2C3E" }} />Username</h3>
        <p style={cardHint}>Shown in the admin panel and the activity logs.</p>
        <div style={row}>
          <label style={field()}>
            <span style={label}>Username</span>
            <input className="form-input" value={username} maxLength={100} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <button type="button" className="button button-primary" disabled={savingUsername || username.trim() === (profile.username || "")} onClick={saveUsername}>
            {savingUsername ? "Saving…" : "Save"}
          </button>
        </div>
        <Message message={usernameMsg} />
      </div>

      {/* ── Contact number ── */}
      <div style={card}>
        <h3 style={cardTitle}><i className="bi bi-telephone-fill" style={{ color: "#6B2C3E" }} />Contact number</h3>
        <p style={cardHint}>Your mobile number, for barangay coordination.</p>
        <div style={row}>
          <label style={field()}>
            <span style={label}>Mobile number</span>
            <div style={{ display: "flex" }}>
              <span style={{ padding: "0 12px", display: "flex", alignItems: "center", border: "1px solid #d1d5db", borderRight: "none", borderRadius: "8px 0 0 8px", background: "#f9fafb", fontSize: 14 }}>+63</span>
              <input className="form-input" style={{ borderRadius: "0 8px 8px 0" }} inputMode="numeric" value={contact} placeholder="9171234567"
                onChange={(e) => setContact(e.target.value.replace(/\D/g, "").slice(0, 10))} />
            </div>
          </label>
          <button type="button" className="button button-primary" disabled={savingContact || `+63${contact}` === profile.contact} onClick={saveContact}>
            {savingContact ? "Saving…" : "Save"}
          </button>
        </div>
        <Message message={contactMsg} />
      </div>

      {/* ── Email ── */}
      <div style={card}>
        <h3 style={cardTitle}><i className="bi bi-envelope-fill" style={{ color: "#6B2C3E" }} />Email address</h3>
        <p style={cardHint}>
          {isMain
            ? "This is the barangay's main Admin account, so its email can't be changed."
            : "You sign in with this email. Enter your current password to change it."}
        </p>
        <div style={row}>
          <label style={field()}>
            <span style={label}>Email</span>
            <input className="form-input" type="email" value={email} disabled={isMain} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {!isMain && (
            <>
              <label style={field("1 1 180px")}>
                <span style={label}>Current password</span>
                <input className="form-input" type="password" value={emailPassword} autoComplete="current-password" onChange={(e) => setEmailPassword(e.target.value)} />
              </label>
              <button type="button" className="button button-primary" disabled={savingEmail || email.trim() === profile.email} onClick={saveEmail}>
                {savingEmail ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
        <Message message={emailMsg} />
      </div>

      {/* ── Password ── */}
      <div style={card}>
        <h3 style={cardTitle}><i className="bi bi-shield-lock-fill" style={{ color: "#6B2C3E" }} />Password</h3>
        <p style={cardHint}>Use at least 8 characters. You'll stay signed in on this device.</p>
        <div style={row}>
          <label style={field("1 1 180px")}>
            <span style={label}>Current password</span>
            <input className="form-input" type="password" value={currentPw} autoComplete="current-password" onChange={(e) => setCurrentPw(e.target.value)} />
          </label>
          <label style={field("1 1 180px")}>
            <span style={label}>New password</span>
            <input className="form-input" type="password" value={newPw} autoComplete="new-password" onChange={(e) => setNewPw(e.target.value)} />
          </label>
          <label style={field("1 1 180px")}>
            <span style={label}>Confirm new password</span>
            <input className="form-input" type="password" value={confirmPw} autoComplete="new-password" onChange={(e) => setConfirmPw(e.target.value)} />
          </label>
          <button type="button" className="button button-primary" disabled={savingPassword} onClick={savePassword}>
            {savingPassword ? "Saving…" : "Change password"}
          </button>
        </div>
        <Message message={passwordMsg} />
      </div>
    </div>
  );
}
