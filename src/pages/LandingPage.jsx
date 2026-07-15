import React from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Services from '../components/landing/Services';
import Contact from '../components/landing/Contact';
import About from '../components/landing/About';
import Footer from '../components/shared/DonationFooter';
import SignInModal from '../components/SignInModal';
import RegisterModal from '../components/RegisterModal';

function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />
      <Hero />
      {/*<Services />
      <Contact />
      <About />
      <Footer />
      <SignInModal />
      <RegisterModal />*/}
    </div>
  );
}

export default LandingPage;