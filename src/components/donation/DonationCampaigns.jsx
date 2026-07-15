import React, { useState } from "react";
import { X } from "lucide-react";

export default function DonationCampaigns() {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const campaigns = [
    { 
      id: "flood",
      title: "Emergency Flash Flood Response",
      location: "Cagayan Valley, Philippines",
      goal: 500000, 
      raised: 37500,
      donors: 1247,
      priority: "Critical",
      priorityColor: "danger",
      image: "https://cdn.hswstatic.com/gif/flash-flood-update.jpg",
    },
    { 
      id: "earthquake",
      title: "Emergency Earthquake Response",
      location: "Davao Oriental, Philippines",
      goal: 75000, 
      raised: 45000,
      donors: 892,
      priority: "High",
      priorityColor: "warning",
      image: "https://newsinfo.inquirer.net/files/2025/10/AFP__20251011__78EW34P__v1__HighRes__PhilippinesEarthquakeTsunami-1200x740.jpg",
    },
    { 
      id: "fire",
      title: "Emergency Fire Response",
      location: "Sitio San Roque, Marikina City, Philippines",
      goal: 30000, 
      raised: 15000,
      donors: 2156,
      priority: "Urgent",
      priorityColor: "warning",
      image: "https://media.licdn.com/dms/image/v2/D5612AQFYrBWsYGxJhQ/article-inline_image-shrink_1000_1488/article-inline_image-shrink_1000_1488/0/1711134337223?e=2147483647&v=beta&t=2EQiaYIsyAHNWLxoXQ_rQd4Fjb3RjM_0LPa-TqzCT4I",
    }
  ];

  const handleDonateClick = (campaign) => {
    setSelectedCampaign(campaign);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCampaign(null);
  };

 
  return (
    <>
      <section className="donate-section" id="campaigns">
        <div className="container py-5">
          <h2 className="text-center text-white donate-title mb-3">DONATE</h2>
          <p className="text-center donate-desc mb-5">
            Your contribution directly funds life-saving rescue operations and emergency relief<br />
            efforts around the world.
          </p>
 
          <div className="campaigns-container">
            {campaigns.map((c, i) => {
              const progress = Math.round((c.raised / c.goal) * 100);
              return (
                <div className="campaign-card-wrapper" key={i}>
                  <div className="campaign-card-fixed">
                    <div className="campaign-image-wrapper-fixed">
                      <span className={`badge bg-${c.priorityColor} campaign-priority-badge-fixed`}>
                        {c.priority}
                      </span>
                      <img src={c.image} className="campaign-image-fixed" alt={c.title} />
                    </div>
 
                    <div className="campaign-body-fixed">
                      <h5 className="campaign-title-fixed">{c.title}</h5>
                      <p className="campaign-location-fixed">
                        <i className="bi bi-geo-alt-fill"></i>
                        <span>{c.location}</span>
                      </p>
 
                      <p className="campaign-donors-fixed">
                        <i className="bi bi-people-fill"></i>
                        {c.donors.toLocaleString()} donors
                      </p>
 
                      <button
                        className="campaign-donate-btn-fixed"
                        onClick={() => handleDonateClick(c)}
                      >
                        <i className="bi bi-heart-fill"></i>
                        <span>Donate Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
 
      {/* Donation Modal */}
      {showModal && selectedCampaign && (
        <DonationModal
          campaign={selectedCampaign}
          onClose={closeModal}
        />
      )}
    </>
  );
}
 
// ================= DONATION MODAL =================
 
function DonationModal({ campaign, onClose }) {
  const [selectedPayment, setSelectedPayment] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    accountName: "",
    accountNumber: "",
    amount: "",
  });
 
  const paymentOptions = [
    { id: "gcash", name: "GCASH", icon: "", className: "gcash" },
    { id: "paymaya", name: "PAYMAYA", icon: "", className: "paymaya" },
    { id: "bank", name: "BANK TRANSFER", icon: "", className: "bank" },
    { id: "card", name: "CREDIT CARD", icon: "", className: "card" },
  ];
 
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
 
  const handleAmountChange = (e) => {
    let value = e.target.value.replace(/[^\d.]/g, "");
    setFormData((prev) => ({
      ...prev,
      amount: value,
    }));
  };
 
  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Thank you for your donation of ₱${formData.amount} to ${campaign.title}!`);
    onClose();
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '1rem',
      overflowY: 'auto'
    },
    modalContainer: {
      width: '100%',
      maxWidth: '500px',
      maxHeight: '95vh',  
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '0.75rem', 
      position: 'relative',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      marginTop: '0.5rem', 
      marginBottom: '0.5rem', 
      overflowY: 'auto'
    },
    closeButton: {
      position: 'absolute',
      top: '0.5rem',  
      right: '0.5rem', 
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#666',
      zIndex: 10
    },
    campaignTitle: {
      fontSize: '0.85rem',
      fontWeight: 'bold',
      color: '#b91c1c',
      marginBottom: '0.15rem',  
      textAlign: 'center',
      lineHeight: '1.2', 
      paddingTop: '0.25rem'  
    },
    formTitle: {
      fontSize: '1rem', 
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '0.5rem',  
      textAlign: 'center',
      lineHeight: '1.2'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem'
    },
    paymentOptions: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0.4rem', 
      marginBottom: '0.4rem'  
    },
    paymentBtn: {
      padding: '0.5rem 0.6rem',  
      border: 'none',
      borderRadius: '6px',
      fontWeight: 'bold',
      fontSize: '0.75rem',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.25rem',
      transition: 'all 0.2s',
      minHeight: '40px'  
    },
    paymentBtnGcash: {
      backgroundColor: '#2563eb'
    },
    paymentBtnPaymaya: {
      backgroundColor: '#16a34a'
    },
    paymentBtnBank: {
      backgroundColor: '#991b1b'
    },
    paymentBtnSelected: {
      outline: '3px solid #60a5fa',
      transform: 'scale(1.02)'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    formLabel: {
      display: 'block',
      color: '#111827',
      fontWeight: 'bold',
      marginBottom: '0.25rem',  
      fontSize: '0.85rem'  
    },
    formInput: {
      width: '100%',
      padding: '0.5rem 0.6rem',
      border: '2px solid #d1d5db',
      borderRadius: '6px',
      backgroundColor: '#f9fafb',
      fontSize: '0.85rem', 
      outline: 'none',
      transition: 'border-color 0.2s',
      minHeight: '40px' 
    },
    formInputFocus: {
      borderColor: '#2563eb'
    },
    amountWrapper: {
      position: 'relative'
    },
    currencySymbol: {
      position: 'absolute',
      left: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#4b5563',
      fontSize: '1rem',
      fontWeight: 'bold'
    },
    amountInput: {
      paddingLeft: '2rem',
      fontSize: '1rem',
      fontWeight: 'bold'
    },
    submitBtn: {
      width: '100%',
      backgroundColor: '#b91c1c',
      color: 'white',
      fontWeight: 'bold',
      padding: '0.65rem 1rem', 
      borderRadius: '6px',
      fontSize: '0.95rem', 
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      textTransform: 'uppercase',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      marginTop: '0.4rem', 
      minHeight: '46px' 
    }
  };
 
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>
          <X size={20} />
        </button>
       
        <h3 style={styles.campaignTitle}>{campaign.title}</h3>
        <h2 style={styles.formTitle}>MAKE A DONATION</h2>
 
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Payment Options */}
          <div style={styles.paymentOptions}>
            {paymentOptions.map((option) => {
              const btnStyle = {
                ...styles.paymentBtn,
                ...(option.className === 'gcash' && styles.paymentBtnGcash),
                ...(option.className === 'paymaya' && styles.paymentBtnPaymaya),
                ...(option.className === 'bank' && styles.paymentBtnBank),
                ...(option.className === 'card' && styles.paymentBtnBank),
                ...(selectedPayment === option.id && styles.paymentBtnSelected)
              };
             
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedPayment(option.id)}
                  style={btnStyle}
                  onMouseOver={(e) => e.target.style.opacity = '0.9'}
                  onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                  <span>{option.icon}</span>
                  {option.name}
                </button>
              );
            })}
          </div>
 
          {/* Email */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              style={styles.formInput}
              required
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
 
          {/* Account Name */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Account Name</label>
            <input
              type="text"
              name="accountName"
              value={formData.accountName}
              onChange={handleInputChange}
              style={styles.formInput}
              required
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
 
          {/* Account Number */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Account Number</label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleInputChange}
              style={styles.formInput}
              required
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
 
          {/* Amount */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Amount</label>
            <div style={styles.amountWrapper}>
              <span style={styles.currencySymbol}>₱</span>
              <input
                type="text"
                name="amount"
                value={formData.amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                style={{...styles.formInput, ...styles.amountInput}}
                required
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
          </div>
 
          <button
            type="submit"
            style={styles.submitBtn}
            onMouseOver={(e) => e.target.style.backgroundColor = '#991b1b'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#b91c1c'}
          >
            DONATE
          </button>
        </form>
      </div>
    </div>
  );
}