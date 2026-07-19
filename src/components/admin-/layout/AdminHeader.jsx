import React from 'react';

const AdminHeader = ({ onToggleMobileMenu }) => {
  return (
    <div className="mobile-header">
      <div>
        <h1 className="font-bold text-lg">SafeConnect</h1>
        <p className="text-xs opacity-70">Admin Dashboard</p>
      </div>
      <button 
        onClick={onToggleMobileMenu}
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'white', 
          fontSize: '20px', 
          cursor: 'pointer',
          padding: '8px'
        }}
      >
        ☰
      </button>
    </div>
  );
};

export default AdminHeader;