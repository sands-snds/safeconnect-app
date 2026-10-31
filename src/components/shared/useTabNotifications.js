import { useEffect, useRef } from 'react';
import { TAB_ICON } from './logos';












const BASE_TITLE = typeof document !== 'undefined' ? document.title.replace(/^(\(\d+\+?\)|🔔[^|]*?)\s*/, '') : '';
const SETTLE_MS = 6000; 
const BLINK_MS = 1000;
export const NOTIFICATIONS_VIEWED_EVENT = 'safeconnect:notifications-viewed';


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
  }
};





export const setAppIconBadge = (n) => {
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    if (!nav || typeof nav.setAppBadge !== 'function') return;
    const done = n > 0 ? nav.setAppBadge(n) : (nav.clearAppBadge ? nav.clearAppBadge() : nav.setAppBadge(0));
    if (done && typeof done.catch === 'function') done.catch(() => {});
  } catch {
    // not supported here
  }
};

const iconLinks = () => [...document.querySelectorAll('link[rel~="icon"]')];


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




export default function useTabNotifications(count, { sound = true, blinkText = 'New notification', alertCount } = {}) {
  const tracked = alertCount === undefined ? count : alertCount;
  const previous = useRef(tracked);
  const openedAt = useRef(Date.now());
  const originalIcons = useRef(null);
  const badgedIcon = useRef(null);  
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
        restoreIcon(); 
      } else {
        showSteady();
      }
    }, BLINK_MS);
  };

  
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

  
  useEffect(() => {
    const n = Math.max(0, Number(count) || 0);
    label.current = n > 0 ? (n > 99 ? '99+' : String(n)) : '';
    setAppIconBadge(n);
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
    
    if (a < previous.current || n === 0) stopBlinking();
    else if (!blinkOn.current) document.title = steadyTitle();
    if (n === 0) restoreIcon();

    previous.current = a;
    return () => { cancelled = true; };
    // the helpers only touch refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, tracked, sound]);

  
  useEffect(() => () => {
    if (blinkTimer.current) clearInterval(blinkTimer.current);
    document.title = BASE_TITLE;
    restoreIcon();
    setAppIconBadge(0); // signed out / left the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
