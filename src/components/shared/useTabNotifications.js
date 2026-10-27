import { useEffect, useRef } from 'react';
import { TAB_ICON } from './logos';

// Shows the unread notification count in the browser tab -- "(3) Safe
// Connect | ..." in the title and a red number on the tab icon -- and plays
// a short chime when a NEW notification arrives (not for the ones already
// there when the page opens). Used by the resident page and the admin panel.
//
// Browsers only allow sound after the person has clicked or tapped the page,
// so the audio is unlocked on the first interaction.

const BASE_TITLE = typeof document !== 'undefined' ? document.title.replace(/^\(\d+\+?\)\s*/, '') : '';
const SETTLE_MS = 4000; // counts loaded right after the page opens don't chime

let audioCtx = null;
const getAudio = () => {
  const Ctx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
};

// Two soft rising tones (no audio file needed).
export const playNotificationSound = () => {
  try {
    const ctx = getAudio();
    if (!ctx || ctx.state === 'suspended') return;
    const now = ctx.currentTime;
    [[880, 0], [1318.5, 0.14]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.18, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.4);
    });
  } catch {
    // audio unavailable: the badge and title still show the count
  }
};

const iconLinks = () => [...document.querySelectorAll('link[rel~="icon"]')];

// The tab icon with a red count bubble, as a data URL (null if drawing fails).
const drawBadgedIcon = (src, label) => new Promise((resolve) => {
  const img = new Image();
  img.onload = () => {
    try {
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      const r = label.length > 2 ? 20 : 17;
      const cx = size - r;
      const cy = r;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#dc2626';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${label.length > 2 ? 18 : 22}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx, cy + 1);
      resolve(canvas.toDataURL('image/png'));
    } catch {
      resolve(null);
    }
  };
  img.onerror = () => resolve(null);
  img.src = src;
});

export default function useTabNotifications(count, { sound = true } = {}) {
  const previous = useRef(count);
  const openedAt = useRef(Date.now());
  const originalIcons = useRef(null);

  // Unlock audio on the first click / tap / key press.
  useEffect(() => {
    if (!sound) return undefined;
    const unlock = () => {
      const ctx = getAudio();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [sound]);

  // Title, tab icon badge, and the chime for new ones.
  useEffect(() => {
    const n = Math.max(0, Number(count) || 0);
    const label = n > 99 ? '99+' : String(n);
    document.title = n > 0 ? `(${label}) ${BASE_TITLE}` : BASE_TITLE;

    if (!originalIcons.current) {
      originalIcons.current = iconLinks().map((link) => [link, link.getAttribute('href')]);
    }
    let cancelled = false;
    if (n > 0) {
      const base = (originalIcons.current[0] || [])[1] || TAB_ICON;
      drawBadgedIcon(base, label).then((url) => {
        if (!cancelled && url) originalIcons.current.forEach(([link]) => link.setAttribute('href', url));
      });
    } else {
      originalIcons.current.forEach(([link, href]) => link.setAttribute('href', href));
    }

    if (sound && n > previous.current && Date.now() - openedAt.current > SETTLE_MS) {
      playNotificationSound();
    }
    previous.current = n;
    return () => { cancelled = true; };
  }, [count, sound]);

  // Leaving the page puts the plain title and icon back.
  useEffect(() => () => {
    document.title = BASE_TITLE;
    (originalIcons.current || []).forEach(([link, href]) => link.setAttribute('href', href));
  }, []);
}
