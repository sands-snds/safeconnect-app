import React from 'react';

// Placeholder — this file didn't exist anywhere in what was provided,
// but LandingPage.jsx and ResidentPage.jsx both import it, which was
// breaking the whole app's build (not just the admin page).
// Replace this with your real donation footer design whenever ready.
const DonationFooter = () => {
  return (
    <footer
      style={{
        padding: '32px 20px',
        textAlign: 'center',
        borderTop: '1px solid #e5e7eb',
        color: '#6b7280',
        fontSize: '.9rem'
      }}
    >
      <p style={{ margin: 0 }}>
        Support our community — donations help keep SafeConnect running.
      </p>
    </footer>
  );
};

export default DonationFooter;
