import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
// confirms the sign-in first; an invalid one is cleared by fetchCurrentUser
// and the home page shows as normal.
const useSignedInRedirect = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(() =>
    !new URLSearchParams(window.location.search).has('signin') && (hasStoredToken(false) || hasStoredToken(true))
  );

  useEffect(() => {
    if (!checking) return undefined;
    let cancelled = false;
    (async () => {
      if (hasStoredToken(false)) {
        const result = await fetchCurrentUser();
        if (cancelled) return;
        if (result.success && result.user) {
          sessionStorage.setItem('currentUser', JSON.stringify(result.user));
          sessionStorage.setItem('userAuthenticated', 'true');
          navigate(`/resident${window.location.hash}`, { replace: true });
          return;
        }
      }
      if (hasStoredToken(true)) {
        // The admin panel checks its own sign-in (useAdminAuth).
        window.location.replace('/admin');
        return;
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
