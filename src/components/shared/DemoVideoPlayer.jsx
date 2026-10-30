import React from 'react';
import { mediaSrc, hasVideo } from './useSiteContent';

// Plays a demo video from Content > Page Contents: an uploaded MP4/WebM or
// a YouTube video, in a 16:9 frame, with its title and a short caption.
//   demo        - { title, caption, video: { source, url } }
//   showText    - false hides the title/caption (when the parent shows them)
//   placeholder - what to show when no video is set (null = nothing)
//   autoPlay    - start playing right away (admin sign-in popup)
const frameStyle = {
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 9',
  background: '#111',
  borderRadius: 12,
  overflow: 'hidden'
};

export default function DemoVideoPlayer({ demo, showText = true, placeholder = null, autoPlay = false }) {
  if (!hasVideo(demo)) return placeholder;

  const { source, url } = demo.video;

  return (
    <div>
      <div style={frameStyle}>
        {source === 'youtube' ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${url}?rel=0${autoPlay ? '&autoplay=1' : ''}`}
            title={demo.title || 'SafeConnect demo video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          // No download: hides the player's Download item and the
          // right-click "Save video as..." menu. (YouTube embeds have no download.)
          <video
            src={mediaSrc(url)}
            controls
            controlsList="nodownload"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            playsInline
            preload="metadata"
            autoPlay={autoPlay}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000' }}
          >
            Your browser can't play this video.
          </video>
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
