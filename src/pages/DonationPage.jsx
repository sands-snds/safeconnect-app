import React, { useState } from "react";
import DonationNavbar from "../components/donation/DonationNavbar";
import DonationHero from "../components/donation/DonationHero";
import DonationNewsSection from "../components/donation/DonationNewsSection";
import DonationFooter from "../components/shared/DonationFooter"; 
import DonationCampaigns from "../components/donation/DonationCampaigns";
import "../styles/donation.css";
import "../styles/donationcampaign.css";
import "../styles/donationnews.css";

function DonationPage() {
  const [selectedNews, setSelectedNews] = useState(null);
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <DonationNavbar />
      <DonationHero />
      <DonationNewsSection setSelectedNews={setSelectedNews} setShowModal={setShowModal} />
      <DonationCampaigns />
      <DonationFooter />
    </div>
  );
}

export default DonationPage;