import React, { useEffect, useRef, useState } from 'react';
import { mediaSrc, hasVideo } from './useSiteContent';

const frameStyle = {
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 9',
  background: '#111',
  borderRadius: 12,
  overflow: 'hidden'
};

const unmuteStyle = {
  position: 'absolute',
  left: 12,
  bottom: 52,
  zIndex: 2,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 12px',
  border: 0,
  borderRadius: 999,
  background: 'rgba(17, 24, 39, 0.82)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer'
};

// Starts once at least half of the frame is on screen (and pauses when it
// leaves), so a video further down the page doesn't play unseen.
const useInView = (ref, enabled) => {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!enabled || !ref.current) return undefined;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return undefined; }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.5 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ref, enabled]);
  return inView;
};

// autoPlay follows the browsers' rules: an uploaded video tries to play with
// sound and, when the browser refuses (it does until the visitor has clicked
// on the page), plays muted with an Unmute button. YouTube only autoplays
// muted, so it starts muted; its own controls unmute it.
export default function DemoVideoPlayer({ demo, showText = true, placeholder = null, autoPlay = false, unmuteLabel = 'Unmute' }) {
  const frameRef = useRef(null);
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [started, setStarted] = useState(false);
  const inView = useInView(frameRef, autoPlay);
  const source = demo?.video?.source;

  useEffect(() => {
    const video = videoRef.current;
    if (!autoPlay || source === 'youtube' || !video) return;
    if (!inView) {
      if (!video.paused) video.pause();
      return;
    }
    if (!video.paused || video.ended) return;
    const attempt = video.play();
    if (!attempt || typeof attempt.then !== 'function') return;
    attempt.then(() => setStarted(true)).catch(() => {
      video.muted = true;
      setMuted(true);
      video.play().then(() => setStarted(true)).catch(() => { /* the visitor can press play */ });
    });
  }, [autoPlay, inView, source]);

  if (!hasVideo(demo)) return placeholder;
  const { url } = demo.video;

  const unmute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setMuted(false);
    video.play().catch(() => {});
  };

  return (
    <div>
      <div style={frameStyle} ref={frameRef}>
        {source === 'youtube' ? (
          // With autoPlay the player loads once it is in view, so it starts then.
          (!autoPlay || inView || started) && (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${url}?rel=0&playsinline=1${autoPlay ? '&autoplay=1&mute=1' : ''}`}
              title={demo.title || 'SafeConnect demo video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setStarted(true)}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
            />
          )
        ) : (
          <video
            ref={videoRef}
            src={mediaSrc(url)}
            controls
            controlsList="nodownload"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
            playsInline
            preload={autoPlay ? 'auto' : 'metadata'}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000' }}
          >
            Your browser can't play this video.
          </video>
        )}
        {autoPlay && source !== 'youtube' && muted && started && (
          <button type="button" style={unmuteStyle} onClick={unmute}>
            <i className="bi bi-volume-up-fill" aria-hidden="true" /> {unmuteLabel}
          </button>
        )}
      </div>

      {showText && (demo.title || demo.caption) && (
        <div style={{ padding: '10px 2px 0' }}>
          {demo.title && <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{demo.title}</div>}
          {demo.caption && <div style={{ fontSize: 13.5, color: '#6b7280', marginTop: 2, lineHeight: 1.5 }}>{demo.caption}</div>}
        </div>
      )}
    </div>
  );
}
