import React, { useState, useEffect } from 'react';
import ResidentNavbar from '../components/resident/ResidentNavbar';
import ResidentHero from '../components/resident/ResidentHero';
import EmergencyReportSection from '../components/resident/EmergencyReportSection';
import Footer from '../components/shared/DonationFooter';
import ResidentEmergencyModal from '../components/resident/ResidentEmergencyModal';
import ResidentAssistanceModal from '../components/resident/ResidentAssistanceModal';
import "../styles/emergencyreport.css";
import "../styles/residentemergencymodal.css";


function ResidentPage() {
  const [emergencyModal, setEmergencyModal] = useState({ show: false, type: '' });
  const [assistanceModal, setAssistanceModal] = useState({ show: false, type: '' });

  useEffect(() => {
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());

    document.body.classList.remove('modal-open');
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '';
    document.body.style.pointerEvents = 'auto';

    window.scrollTo({ top: 0, behavior: 'auto' });

    if (process.env.NODE_ENV === 'development') {
      console.log('ResidentPage mounted and ready');
    }

    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.pointerEvents = 'auto';
    };
  }, []);

  const openEmergencyModal = (type) => {
    if (process.env.NODE_ENV === 'development') console.log('Opening emergency modal:', type);
    setEmergencyModal({ show: true, type });
  };

  const closeEmergencyModal = () => {
    if (process.env.NODE_ENV === 'development') console.log('Closing emergency modal');
    setEmergencyModal({ show: false, type: '' });
  };

  const openAssistanceModal = (type) => {
    if (process.env.NODE_ENV === 'development') console.log('Opening assistance modal:', type);
    setAssistanceModal({ show: true, type });
  };

  const closeAssistanceModal = () => {
    if (process.env.NODE_ENV === 'development') console.log('Closing assistance modal');
    setAssistanceModal({ show: false, type: '' });
  };

  return (
    <div 
      className="resident-page" 
      style={{ position: 'relative', minHeight: '100vh' }}
    >
      <ResidentNavbar />

      <section id="home">
        <ResidentHero 
          onReportEmergency={openEmergencyModal}
          onRequestHelp={openAssistanceModal}
        />
      </section>

      <section id="emergency-report">
        <EmergencyReportSection onReportClick={openEmergencyModal} />
      </section>

      <Footer />

      <ResidentEmergencyModal 
        show={emergencyModal.show}
        type={emergencyModal.type}
        onClose={closeEmergencyModal}
      />

      <ResidentAssistanceModal 
        show={assistanceModal.show}
        type={assistanceModal.type}
        onClose={closeAssistanceModal}
      />
    </div>
  );
}

export default ResidentPage;
