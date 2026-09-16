import React, { useState, useEffect } from 'react';
import ResidentNavbar from '../components/resident/ResidentNavbar';
import ResidentHero from '../components/resident/ResidentHero';
import EmergencyReportSection from '../components/resident/EmergencyReportSection';
import Footer from '../components/shared/DonationFooter';
import ResidentEmergencyModal from '../components/resident/ResidentEmergencyModal';
import ResidentAssistanceModal from '../components/resident/ResidentAssistanceModal';
import ResidentPettyCrimeModal from '../components/resident/ResidentPettyCrimeModal';
import "../styles/emergencyreport.css";
import "../styles/residentemergencymodal.css";

function ResidentPage() {
  const [currentUser, setCurrentUser] = useState(null);

  const [emergencyOpen,   setEmergencyOpen]   = useState(false);
  const [assistanceOpen,  setAssistanceOpen]  = useState(false);
  const [pettyCrimeOpen,  setPettyCrimeOpen]  = useState(false);

  useEffect(() => {
    // Load current user from sessionStorage
    try {
      const raw = sessionStorage.getItem('currentUser');
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }

    // Clean up any stale Bootstrap modal artefacts
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(b => b.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow     = 'auto';
    document.body.style.paddingRight = '';
    document.body.style.pointerEvents = 'auto';
    window.scrollTo({ top: 0, behavior: 'auto' });

    if (process.env.NODE_ENV === 'development') {
      console.log('ResidentPage mounted and ready');
    }

    return () => {
      document.body.style.overflow      = 'auto';
      document.body.style.pointerEvents = 'auto';
    };
  }, []);

  return (
    <div className="resident-page" style={{ position: 'relative', minHeight: '100vh' }}>
      <ResidentNavbar />

      <section id="home">
        <ResidentHero
          onReportEmergency={() => setEmergencyOpen(true)}
          onRequestHelp={() => setAssistanceOpen(true)}
        />
      </section>

      <section id="emergency-report">
        <EmergencyReportSection
            onReportClick={() => setEmergencyOpen(true)}
            onAssistanceClick={() => setAssistanceOpen(true)}
            onPettyCrimeClick={() => setPettyCrimeOpen(true)}
          />
      </section>

      <Footer />

      {/* ── Modals ── */}
      <ResidentEmergencyModal
        isOpen={emergencyOpen}
        show={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        currentUser={currentUser}
      />

      <ResidentAssistanceModal
        isOpen={assistanceOpen}
        show={assistanceOpen}
        onClose={() => setAssistanceOpen(false)}
        currentUser={currentUser}
      />

      <ResidentPettyCrimeModal
        isOpen={pettyCrimeOpen}
        show={pettyCrimeOpen}
        onClose={() => setPettyCrimeOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}

export default ResidentPage;