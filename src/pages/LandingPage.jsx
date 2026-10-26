import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Services from '../components/landing/Services';
import DemoVideoSection from '../components/landing/DemoVideoSection';
import Contact from '../components/landing/Contact';
import About from '../components/landing/About';
import Footer from '../components/shared/DonationFooter';
import { fetchCurrentUser, hasStoredToken } from '../Services/api';
import { useLanguage } from '../i18n/LanguageContext';

// Someone already signed in (a saved login, or still within this browser
// session) skips the home page and goes to their account. The server
// confirms every sign-in first (invalid ones are deleted):
// - a resident account goes to /resident;
// - only a confirmed, Active admin account goes to /admin -- a resident is
//   never sent there.
// Right after logging out (navigate state { signedOut: true }) nothing is
// checked, so logging out always lands here directly.
const useSignedInRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const justSignedOut = Boolean(location.state?.signedOut);
  const [checking, setChecking] = useState(() =>
    !justSignedOut
    && !new URLSearchParams(window.location.search).has('signin')
    && (hasStoredToken(false) || hasStoredToken(true))
  );

  // Don't keep "signed out" in history (a refresh may redirect again).
  useEffect(() => {
    if (justSignedOut) navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: null });
  }, [justSignedOut, navigate, location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (!checking) return undefined;
    let cancelled = false;
    (async () => {
      if (hasStoredToken(false)) {
        const result = await fetchCurrentUser({ admin: false });
        if (cancelled) return;
        if (result.success && result.user && !result.isAdmin) {
          sessionStorage.setItem('currentUser', JSON.stringify(result.user));
          sessionStorage.setItem('userAuthenticated', 'true');
          navigate(`/resident${window.location.hash}`, { replace: true });
          return;
        }
      }
      if (hasStoredToken(true)) {
        const result = await fetchCurrentUser({ admin: true });
        if (cancelled) return;
        if (result.success && result.isAdmin) {
          window.location.replace('/admin');
          return;
        }
      }
      if (!cancelled) setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [checking, navigate]);

  return checking;
};

function LandingPage() {
  const { t } = useLanguage();
  const checking = useSignedInRedirect();

  if (checking) {
    return (
      <div role="status" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', background: '#f5f2f3', color: '#374151' }}>
        <div className="spinner-border" style={{ color: '#6B2C3E' }} aria-hidden="true"></div>
        <p style={{ margin: 0, fontSize: '0.95rem' }}>{t('residentGuard.signingIn')}</p>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <Navbar />
      <Hero />
      <DemoVideoSection />
      <Services />
      <Contact />
      <About />
      <Footer />
    </div>
  );
}

export default LandingPage;
