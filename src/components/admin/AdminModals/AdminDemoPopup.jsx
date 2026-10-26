import React, { useEffect, useState } from "react";
import DemoVideoPlayer from "../../shared/DemoVideoPlayer";
import { useSiteMedia, hasVideo } from "../../shared/useSiteContent";
import { markSyncedRead, useSyncedReadItems } from "../../shared/useSyncedState";

// Admin demo video, shown once right after someone signs in to the admin
// panel (Admins and Officials). The sign-in screens set JUST_SIGNED_IN_KEY;
// this popup consumes it. "Don't show this again" is remembered per account
// for the account, on every device (useSyncedState). Anyone can watch it again from the account menu
// (manualOpen). Admins set the video, or turn the popup off, under
// Content > Site Contents.

export const JUST_SIGNED_IN_KEY = "sf_showAdminDemo";
const hiddenKey = (userId) => `sf_adminDemoHidden_${userId}`; // older, this browser only
const SYNCED_HIDDEN_KEY = "admin-demo:hidden";

// Called by the sign-in screens when an Admin or Official signs in.
export const markAdminJustSignedIn = () => {
  try { sessionStorage.setItem(JUST_SIGNED_IN_KEY, "1"); } catch { /* storage unavailable */ }
};

export default function AdminDemoPopup({ userId, manualOpen = false, onManualClose }) {
  const { adminDemo } = useSiteMedia();
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const readItems = useSyncedReadItems();
  const hiddenForAccount = readItems.has(SYNCED_HIDDEN_KEY);

  useEffect(() => {
    if (!userId) return;
    let justSignedIn = false;
    let hidden = false;
    try {
      justSignedIn = sessionStorage.getItem(JUST_SIGNED_IN_KEY) === "1";
      hidden = localStorage.getItem(hiddenKey(userId)) === "1" || hiddenForAccount;
    } catch { /* storage unavailable */ }
    if (justSignedIn && !hidden && adminDemo?.showOnSignIn && hasVideo(adminDemo)) {
      setOpen(true);
      try { sessionStorage.removeItem(JUST_SIGNED_IN_KEY); } catch { /* ignore */ }
    }
  }, [userId, adminDemo, hiddenForAccount]);

  // "Don't show again" chosen on another device, loaded after this opened.
  useEffect(() => {
    if (hiddenForAccount && open) setOpen(false);
  }, [hiddenForAccount, open]);

  useEffect(() => {
    if (!open && !manualOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, manualOpen, dontShowAgain]);

  if (!open && !manualOpen) return null;

  function close() {
    if (dontShowAgain) {
      try { localStorage.setItem(hiddenKey(userId), "1"); } catch { /* ignore */ }
      markSyncedRead([SYNCED_HIDDEN_KEY]);
    }
    setOpen(false);
    if (manualOpen && onManualClose) onManualClose();
  }

  return (
    <div
      onClick={close}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 10050, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={adminDemo.title || "Admin demo video"}
        style={{ background: "#fff", borderRadius: 14, width: 820, maxWidth: "100%", maxHeight: "92vh", overflowY: "auto", padding: 20 }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>{adminDemo.title || "Welcome to SafeConnect"}</h3>
            {adminDemo.caption && <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "#6b7280" }}>{adminDemo.caption}</p>}
          </div>
          <button type="button" onClick={close} aria-label="Close" style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <DemoVideoPlayer demo={adminDemo} showText={false} autoPlay />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", cursor: "pointer" }}>
            <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} />
            Don't show this after signing in (you can still watch it from your account menu)
          </label>
          <button type="button" className="button button-primary" onClick={close}>Got it</button>
        </div>
      </div>
    </div>
  );
}
