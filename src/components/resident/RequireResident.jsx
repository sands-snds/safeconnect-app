import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser, clearAuthToken, SESSION_EXPIRED_EVENT } from '../../Services/api';
import { useLanguage } from '../../i18n/LanguageContext';

// Guards /resident. Nothing protected renders until the SERVER confirms the
// sign-in (GET /api/auth/me checks the token and that the account is still
// Active). Missing, expired or rejected sign-ins go to the home page with the
// Sign In box open. This only decides what the browser shows: the real
// protection is the API, which requires a valid token for every resident
// action and data request (backend/middleware/authMiddleware.js).

export const SIGN_IN_REDIRECT = '/?signin=required';

const clearResidentSession = () => {
  clearAuthToken();
  try {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('userAuthenticated');
    localStorage.removeItem('residentName');
  } catch {
    // storage unavailable: nothing to clear
  }
};

export default function RequireResident({ children }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [state, setState] = useState('checking'); // checking | allowed | offline

  const toSignIn = useCallback(() => {
    clearResidentSession();
    navigate(SIGN_IN_REDIRECT, { replace: true });
  }, [navigate]);

  const verify = useCallback(async () => {
    setState('checking');
    const result = await fetchCurrentUser();
    if (result.success && result.user) {
      // Refresh what the resident pages read (also restores it in a new tab).
      sessionStorage.setItem('currentUser', JSON.stringify(result.user));
      sessionStorage.setItem('userAuthenticated', 'true');
      setState('allowed');
    } else if (result.offline) {
      setState('offline');
    } else {
      toSignIn();
    }
  }, [toSignIn]);

  useEffect(() => { verify(); }, [verify]);

  // Any later API call that finds the sign-in gone (expired, suspended,
  // signed out in another tab) sends the resident back to Sign In.
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, toSignIn);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, toSignIn);
  }, [toSignIn]);

  if (state === 'allowed') return children;

  return (
    <div
      role="status"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        padding: '24px',
        textAlign: 'center',
        background: '#f5f2f3',
        color: '#374151'
      }}
    >
      {state === 'checking' ? (
        <>
          <div className="spinner-border" style={{ color: '#6B2C3E' }} aria-hidden="true"></div>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>{t('residentGuard.checking')}</p>
        </>
      ) : (
        <>
          <i className="bi bi-wifi-off" style={{ fontSize: '2rem', color: '#6B2C3E' }} aria-hidden="true"></i>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{t('residentGuard.offlineTitle')}</h1>
          <p style={{ margin: 0, maxWidth: '360px', fontSize: '0.92rem' }}>{t('residentGuard.offlineBody')}</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={verify}
              style={{ background: '#6B2C3E', color: '#fff', border: 'none', borderRadius: '24px', padding: '10px 22px', fontWeight: 600 }}
            >
              {t('residentGuard.retry')}
            </button>
            <button
              type="button"
              onClick={toSignIn}
              style={{ background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '24px', padding: '10px 22px', fontWeight: 600 }}
            >
              {t('residentGuard.signInAgain')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
