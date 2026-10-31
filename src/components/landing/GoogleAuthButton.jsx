import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

// "Continue with Google" on Sign In and Sign Up. Google's own button (Google
// Identity Services) hands back an ID token, which the server verifies
// (POST /api/auth/google). Shown only when REACT_APP_GOOGLE_CLIENT_ID is set
// for the build; the server needs the same ID as GOOGLE_CLIENT_ID.
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const GIS_SRC = 'https://accounts.google.com/gsi/client';

export const googleSignInEnabled = Boolean(CLIENT_ID);

let gisPromise = null;
const loadGoogleScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google);
      script.onerror = () => { gisPromise = null; reject(new Error('Google sign-in could not load.')); };
      document.head.appendChild(script);
    });
  }
  return gisPromise;
};

// text: 'continue_with' (Sign In) or 'signup_with' (Sign Up).
export default function GoogleAuthButton({ text = 'continue_with', onCredential }) {
  const { t, language } = useLanguage();
  const holderRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return undefined;
    let cancelled = false;
    loadGoogleScript()
      .then((google) => {
        const holder = holderRef.current;
        if (cancelled || !holder || !google?.accounts?.id) return;
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => onCredentialRef.current?.(response.credential),
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true
        });
        holder.innerHTML = '';
        google.accounts.id.renderButton(holder, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          logo_alignment: 'center',
          // Google allows 200-400px; match the form's buttons.
          width: Math.max(200, Math.min(400, Math.round(holder.offsetWidth || 320))),
          locale: language === 'tl' ? 'fil' : 'en'
        });
        setFailed(false);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [text, language]);

  if (!CLIENT_ID) return null;

  return (
    <div className="auth-google">
      <div className="auth-divider"><span>{t('auth.or')}</span></div>
      <div ref={holderRef} className="auth-google-btn" />
      {failed && <p className="auth-google-failed">{t('auth.googleUnavailable')}</p>}
    </div>
  );
}
