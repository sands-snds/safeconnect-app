import React, { useState } from 'react';
import MediaLightbox from './MediaLightbox';

// The photo or video a resident just attached to a report form, shown whole
// (not cropped) and big enough to check. Tapping the photo, or the expand
// button on either, opens it full size on the same page (MediaLightbox), like
// in My Reports and the admin report details.
// labels: { open, close, alt }
export default function ZoomableMedia({ src, isVideo, labels, maxHeight = 360 }) {
  const [open, setOpen] = useState(false);
  if (!src) return null;
  const mediaStyle = {
    display: 'block',
    width: '100%',
    height: 'auto',
    minHeight: 180,
    maxHeight,
    objectFit: 'contain',
    background: '#111'
  };
  return (
    <>
      {isVideo ? (
        <video src={src} controls playsInline style={mediaStyle} />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={labels.open}
          aria-label={labels.open}
          style={{ display: 'block', width: '100%', padding: 0, border: 0, background: '#111', cursor: 'zoom-in' }}
        >
          <img src={src} alt={labels.alt} style={mediaStyle} />
        </button>
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.open}
        title={labels.open}
        className="zm-open"
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 1, width: 36, height: 36, borderRadius: '50%',
          border: 0, background: 'rgba(17,24,39,.75)', color: '#fff', fontSize: 15, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <i className="bi bi-arrows-fullscreen" aria-hidden="true" />
      </button>
      <MediaLightbox
        src={open ? src : null}
        isVideo={isVideo}
        alt={labels.alt}
        closeLabel={labels.close}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
