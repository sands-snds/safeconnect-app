import React from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Services from '../components/landing/Services';
import Contact from '../components/landing/Contact';
import About from '../components/landing/About';
import Footer from '../components/shared/DonationFooter';

function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />
      <Hero />
      <Services />
      <Contact />
      <About />
      <Footer />
    </div>
  );
}

export default LandingPage;