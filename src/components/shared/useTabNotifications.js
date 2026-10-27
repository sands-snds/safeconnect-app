import { useEffect, useRef } from 'react';
import { TAB_ICON } from './logos';

// Shows the unread notification count in the browser tab -- "(3) Safe
// Connect | ..." in the title and a red number on the tab icon -- and, when a
// NEW notification arrives, plays a short chime and makes the tab blink
// (title and icon alternate) until the person opens the notification bell or
// the count goes down. Used by the resident page and the admin panel.
//
// The bells call markNotificationsViewed() when they open.
//
// Browsers only allow sound after the person has clicked or tapped the page,
// so the audio is unlocked on the first interaction.

const BASE_TITLE = typeof document !== 'undefined' ? document.title.replace(/^(\(\d+\+?\)|🔔[^|]*?)\s*/, '') : '';
const SETTLE_MS = 6000; // counts loaded right after the page opens don't chime
const BLINK_MS = 1000;
export const NOTIFICATIONS_VIEWED_EVENT = 'safeconnect:notifications-viewed';

// Called by the notification bells when they open.
export const markNotificationsViewed = () => {
  window.dispatchEvent(new Event(NOTIFICATIONS_VIEWED_EVENT));
};

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

// count: the number shown in the tab. alertCount: what counts as a new
// notification for the chime / blinking (defaults to count) -- the resident
// page leaves out the daily weather advisory, which isn't something arriving.
export default function useTabNotifications(count, { sound = true, blinkText = 'New notification', alertCount } = {}) {
  const tracked = alertCount === undefined ? count : alertCount;
  const previous = useRef(tracked);
  const openedAt = useRef(Date.now());
  const originalIcons = useRef(null);
  const badgedIcon = useRef(null);  // data URL of the icon with the count
  const blinkTimer = useRef(null);
  const blinkOn = useRef(false);
  const label = useRef('');

  const setIcon = (href) => (originalIcons.current || []).forEach(([link]) => link.setAttribute('href', href));
  const restoreIcon = () => (originalIcons.current || []).forEach(([link, href]) => link.setAttribute('href', href));
  const steadyTitle = () => (label.current ? `(${label.current}) ${BASE_TITLE}` : BASE_TITLE);
  const showSteady = () => {
    document.title = steadyTitle();
    if (label.current && badgedIcon.current) setIcon(badgedIcon.current);
    else restoreIcon();
  };

  const stopBlinking = () => {
    if (blinkTimer.current) clearInterval(blinkTimer.current);
    blinkTimer.current = null;
    blinkOn.current = false;
    showSteady();
  };

  const startBlinking = () => {
    if (blinkTimer.current) return;
    blinkTimer.current = setInterval(() => {
      blinkOn.current = !blinkOn.current;
      if (blinkOn.current) {
        document.title = `🔔 ${blinkText} | ${BASE_TITLE}`;
        restoreIcon(); // the plain icon, flashing against the badged one
      } else {
        showSteady();
      }
    }, BLINK_MS);
  };

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

  // Opening a notification bell stops the blinking.
  useEffect(() => {
    window.addEventListener(NOTIFICATIONS_VIEWED_EVENT, stopBlinking);
    return () => window.removeEventListener(NOTIFICATIONS_VIEWED_EVENT, stopBlinking);
    // stopBlinking only touches refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Title, tab icon badge, chime and blinking for new ones.
  useEffect(() => {
    const n = Math.max(0, Number(count) || 0);
    label.current = n > 0 ? (n > 99 ? '99+' : String(n)) : '';
    if (!originalIcons.current) {
      originalIcons.current = iconLinks().map((link) => [link, link.getAttribute('href')]);
    }

    let cancelled = false;
    if (n > 0) {
      const base = (originalIcons.current[0] || [])[1] || TAB_ICON;
      drawBadgedIcon(base, label.current).then((url) => {
        if (cancelled || !url) return;
        badgedIcon.current = url;
        if (!blinkOn.current) setIcon(url);
      });
    } else {
      badgedIcon.current = null;
    }

    const a = Math.max(0, Number(tracked) || 0);
    const isNew = a > previous.current && Date.now() - openedAt.current > SETTLE_MS;
    if (isNew) {
      if (sound) playNotificationSound();
      startBlinking();
    }
    // Read (fewer unread) or none left: stop blinking.
    if (a < previous.current || n === 0) stopBlinking();
    else if (!blinkOn.current) document.title = steadyTitle();
    if (n === 0) restoreIcon();

    previous.current = a;
    return () => { cancelled = true; };
    // the helpers only touch refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, tracked, sound]);

  // Leaving the page puts the plain title and icon back.
  useEffect(() => () => {
    if (blinkTimer.current) clearInterval(blinkTimer.current);
    document.title = BASE_TITLE;
    restoreIcon();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
