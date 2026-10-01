import React, { useEffect, useRef, useState } from "react";

// Share menu for an admin announcement card: the device's share sheet (where
// the browser has one), Facebook, or copy the announcement text. Links to the
// article for news-link announcements, otherwise to the public SafeConnect site.
const AnnouncementShareButton = ({ announcement }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef(null);

  const shareUrl = announcement.sourceUrl || `${window.location.origin}/`;
  const shareText = `${announcement.title}\n\n${announcement.message}\n\n${shareUrl}`;
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const nativeShare = async () => {
    setOpen(false);
    try {
      await navigator.share({ title: announcement.title, text: announcement.message, url: shareUrl });
    } catch {
      // Cancelled -- nothing to do.
    }
  };

  const shareFacebook = () => {
    setOpen(false);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,noreferrer,width=640,height=560"
    );
  };

  const copyText = async () => {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy the announcement:", shareText);
    }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <style>{`
        .as-menu { position: absolute; bottom: calc(100% + 6px); left: 0; z-index: 20; min-width: 200px;
          background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 10px 24px rgba(0,0,0,0.12); padding: 6px; }
        .as-menu button { display: flex; align-items: center; gap: 10px; width: 100%; border: none; background: none;
          padding: 8px 10px; border-radius: 6px; font-size: 13px; color: #374151; text-align: left; cursor: pointer; }
        .as-menu button:hover { background: #f3f4f6; }
        .as-menu i { font-size: 15px; width: 18px; text-align: center; }
      `}</style>

      <button
        type="button"
        className="button button-secondary"
        style={{ fontSize: 12.5, padding: "8px 18px" }}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <i className={`bi ${copied ? "bi-check2" : "bi-share"}`}></i> {copied ? "Copied!" : "Share"}
      </button>

      {open && (
        <div className="as-menu" role="menu">
          {canNativeShare && (
            <button type="button" role="menuitem" onClick={nativeShare}>
              <i className="bi bi-box-arrow-up"></i> Share via...
            </button>
          )}
          <button type="button" role="menuitem" onClick={shareFacebook}>
            <i className="bi bi-facebook" style={{ color: "#1877f2" }}></i> Share on Facebook
          </button>
          <button type="button" role="menuitem" onClick={copyText}>
            <i className="bi bi-clipboard"></i> Copy announcement
          </button>
        </div>
      )}
    </div>
  );
};

export default AnnouncementShareButton;
