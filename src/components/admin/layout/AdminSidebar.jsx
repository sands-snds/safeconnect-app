import React from 'react';

const AdminSidebar = ({ 
  activeView, 
  onNavigate, 
  onLogout, 
  showMobileMenu, 
  onCloseMobileMenu 
}) => {
  const menuItems = [
    'dashboard',
    'emergency-reports', 
    'assistance-requests', 
    'petty-crime-reports',
    'create-announcement',
    'announcement-page',
    'registered-users', 
    'sign-in-logs',
    'admin-logs'
  ];

  const handleItemClick = (view) => {
    onNavigate(view);
    onCloseMobileMenu();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="desktop-sidebar">
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 className="font-bold" style={{ fontSize: '2rem' }}>SafeConnect</h1>
          <p className="text-xs opacity-70 mt-1">Admin Dashboard</p>
        </div>
        
        <div style={{ flex: 1, padding: '12px' }}>
          {menuItems.map(view => (
            <div
              key={view}
              onClick={() => onNavigate(view)}
              style={{
                padding: '12px 16px',
                marginBottom: '4px',
                borderRadius: '6px',
                cursor: 'pointer',
                background: activeView === view ? 'rgba(255,255,255,0.15)' : 'transparent',
                transition: 'background 0.2s',
                fontSize: '14px'
              }}
            >
              {view.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </div>
          ))}
        </div>
        
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={onLogout}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              color: 'white',
              textAlign: 'left',
              transition: 'background 0.2s',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div 
          className="mobile-menu-overlay"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div 
        className={`mobile-menu-drawer ${showMobileMenu ? 'open' : ''}`}
      >
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="font-bold text-xl">SafeConnect</h1>
            <p className="text-xs opacity-70">Admin Dashboard</p>
          </div>
          <button 
            onClick={onCloseMobileMenu}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              fontSize: '24px', 
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
          {menuItems.map(view => (
            <div
              key={view}
              onClick={() => handleItemClick(view)}
              style={{
                padding: '14px 16px',
                marginBottom: '4px',
                borderRadius: '6px',
                cursor: 'pointer',
                background: activeView === view ? 'rgba(255,255,255,0.15)' : 'transparent',
                transition: 'background 0.2s',
                fontSize: '15px',
                fontWeight: activeView === view ? '600' : '400'
              }}
            >
              {view.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </div>
          ))}
        </div>
        
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={onLogout}
            className="button button-secondary"
            style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: 'white' }}
          >
            Log Out
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
