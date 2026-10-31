import { useEffect, useState } from 'react';

let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

const isStandalone = () =>
  typeof window !== 'undefined' &&
  ((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true);

let installed = isStandalone();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
}

export const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export function useInstallApp() {
  const [, rerender] = useState(0);
  useEffect(() => {
    const fn = () => rerender((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    const event = deferredPrompt;
    deferredPrompt = null; // a prompt can only be shown once
    notify();
    event.prompt();
    const { outcome } = await event.userChoice;
    return outcome === 'accepted';
  };

  return { installed, canPrompt: !!deferredPrompt, ios: isIOS(), promptInstall };
}
