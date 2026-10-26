import { useEffect, useState } from 'react';

// "Install the app" support (public/manifest.json makes the site installable).
// Chrome/Edge fire `beforeinstallprompt` once, soon after the page loads, so
// this module starts listening as soon as it is imported (src/index.js) and
// keeps the event until Settings asks for it. Safari (iPhone/iPad) has no such
// event; there the user adds the app from the Share menu.

let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

const isStandalone = () =>
  typeof window !== 'undefined' &&
  ((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true);

let installed = isStandalone();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // keep it for our own button instead of the browser's mini-bar
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
}

// iPadOS reports itself as a Mac, so also check for a touch screen.
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
