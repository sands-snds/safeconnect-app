import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

// A report's photo or video, full size, on the same page. (Opening the
// base64 data URL in a new tab doesn't work: browsers block it.) Closes with
// the X, Escape or a tap outside the media.
export default function MediaLightbox({ src, isVideo, alt = 'Attachment', closeLabel = 'Close', onClose }) {
  useEffect(() => {
    if (!src) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [src, onClose]);

  if (!src) return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 20000, background: 'rgba(0,0,0,.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 12px 12px'
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        autoFocus
        style={{
          position: 'absolute', top: 10, right: 12, width: 40, height: 40, borderRadius: '50%',
          border: 'none', background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 20, cursor: 'pointer'
        }}
      >
        <i className="bi bi-x-lg" aria-hidden="true"></i>
      </button>
      {isVideo ? (
        <video
          src={src}
          controls
          autoPlay
          playsInline
          controlsList="nodownload"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 6, background: '#000' }}
        />
      ) : (
        <img
          src={src}
          alt={alt}
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 6 }}
        />
      )}
    </div>,
    document.body
  );
}
