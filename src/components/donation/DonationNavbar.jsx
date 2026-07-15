import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DonationNavbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && 
          !event.target.closest('.mobile-menu-toggle')) {
        setShowMobileMenu(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const handleNavigation = (path) => {
    console.log('🔍 Attempting to navigate to:', path);
    
    if (path === '/evacuation') {
      sessionStorage.setItem('previousPage', '/donation');
    }
    
    setShowDropdown(false);
    setShowMobileMenu(false);
    navigate(path);
    console.log('✅ Navigation called');
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setShowMobileMenu(false);
  };

  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    scrollToSection(sectionId);
  };

  const handleHomeClick = () => {
    console.log('🏠 Home clicked - scrolling to top');
    
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
    
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setShowMobileMenu(false);
  };

  return (
    <>
      <style>{`
        .donation-navbar {
          background: linear-gradient(135deg, #6B2C3E 0%, #8B3A52 100%);
          padding: 1rem 0;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.2);
          position: sticky;
          top: 0;
          z-index: 1040;
        }
        
        .donation-navbar .navbar-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          position: relative;
        }
        
        .donation-navbar .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: white;
          text-decoration: none;
          font-weight: 700;
          font-size: 1.25rem;
          letter-spacing: 0.5px;
          cursor: pointer;
          border: none;
          background: none;
          padding: 0.5rem;
          border-radius: 4px;
          z-index: 1050;
        }
        
        @media (max-width: 480px) {
          .donation-navbar .navbar-brand {
            font-size: 1.1rem;
            gap: 0.5rem;
          }
        }
        
        @media (max-width: 360px) {
          .donation-navbar .navbar-brand {
            font-size: 1rem;
            gap: 0.4rem;
          }
          
          .donation-navbar .navbar-brand span {
            display: none;
          }
        }
        
        .donation-navbar .navbar-brand:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .donation-navbar .brand-icon {
          width: 42px;
          height: 42px;
          background-color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          flex-shrink: 0;
        }
        
        @media (max-width: 480px) {
          .donation-navbar .brand-icon {
            width: 36px;
            height: 36px;
          }
        }
        
        @media (max-width: 360px) {
          .donation-navbar .brand-icon {
            width: 32px;
            height: 32px;
          }
        }
        
        .donation-navbar .brand-icon i {
          font-size: 1.25rem;
          color: #DC3545;
        }
        
        @media (max-width: 480px) {
          .donation-navbar .brand-icon i {
            font-size: 1.1rem;
          }
        }
        
        /* Desktop Navigation */
        .donation-nav-links {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-left: auto;
        }
        
        @media (max-width: 768px) {
          .donation-nav-links {
            display: none;
          }
        }
        
        .donation-nav-item {
          color: white;
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
          cursor: pointer;
          opacity: 0.95;
          white-space: nowrap;
          border: none;
          background: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
        }
        
        .donation-nav-item:hover {
          opacity: 1;
          color: white;
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .donation-nav-item.active {
          opacity: 1;
          background-color: rgba(255, 255, 255, 0.15);
          border-bottom: 2px solid white;
          padding-bottom: 0.5rem;
        }
        
        .donation-nav-item i {
          font-size: 1.15rem;
        }
        
        .donation-user-menu-wrapper {
          position: relative;
          padding-left: 1rem;
          border-left: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .donation-user-menu {
          color: white;
          font-size: 0.95rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          background: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
        }
        
        .donation-user-menu:hover {
          background-color: rgba(255, 255, 255, 0.1);
          opacity: 0.8;
        }
        
        .donation-user-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          min-width: 200px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s ease;
          z-index: 1050;
          overflow: hidden;
        }
        
        .donation-user-dropdown.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        
        .donation-dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.25rem;
          color: #333;
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          transition: background-color 0.2s;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }
        
        .donation-dropdown-item:hover {
          background-color: #f8f9fa;
          color: #6B2C3E;
        }
        
        .donation-dropdown-item i {
          font-size: 1.15rem;
          opacity: 0.7;
          width: 20px;
        }
        
        .donation-dropdown-divider {
          height: 1px;
          background-color: #e9ecef;
          margin: 0.5rem 0;
        }
        
        /* Mobile Navigation */
        .mobile-menu-toggle {
          display: none;
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
          z-index: 1050;
        }
        
        @media (max-width: 768px) {
          .mobile-menu-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
        
        .mobile-menu-toggle:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .mobile-nav-menu {
          position: fixed;
          top: 0;
          right: -100%;
          width: 280px;
          height: 100vh;
          background: linear-gradient(135deg, #6B2C3E 0%, #8B3A52 100%);
          box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
          transition: right 0.3s ease-in-out;
          z-index: 1060;
          padding: 5rem 1.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        @media (max-width: 360px) {
          .mobile-nav-menu {
            width: 100%;
            right: -100%;
          }
        }
        
        .mobile-nav-menu.show {
          right: 0;
        }
        
        .mobile-nav-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1055;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        
        .mobile-nav-overlay.show {
          opacity: 1;
          visibility: visible;
        }
        
        .mobile-nav-item {
          color: white;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }
        
        .mobile-nav-item:hover,
        .mobile-nav-item:active {
          background-color: rgba(255, 255, 255, 0.15);
        }
        
        .mobile-nav-item.active {
          background-color: rgba(255, 255, 255, 0.2);
          border-left: 4px solid white;
        }
        
        .mobile-nav-item i {
          font-size: 1.25rem;
          width: 24px;
          text-align: center;
        }
        
        .mobile-user-section {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .mobile-user-header {
          color: white;
          font-size: 0.9rem;
          font-weight: 600;
          opacity: 0.8;
          margin-bottom: 1rem;
          padding: 0 1.5rem;
        }
        
        .mobile-close-button {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: white;
          font-size: 2rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
        }
        
        .mobile-close-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
      `}</style>
      
      <nav className="donation-navbar">
        <div className="container-fluid px-3 px-sm-4">
          <div className="navbar-container">
            <button className="navbar-brand" onClick={handleHomeClick}>
              <div className="brand-icon">
                <i className="bi bi-heart-fill"></i>
              </div>
              <span>Safe Connect</span>
            </button>
            
            {/* Desktop Navigation */}
            <div className="donation-nav-links">
              <button className="donation-nav-item active" onClick={handleHomeClick}>
                <i className="bi bi-house-door-fill"></i>
                <span>Home</span>
              </button>
              
              <button className="donation-nav-item" onClick={(e) => handleNavClick(e, 'news')}>
                <i className="bi bi-newspaper"></i>
                <span>News</span>
              </button>
              
              <button className="donation-nav-item" onClick={(e) => handleNavClick(e, 'campaigns')}>
                <i className="bi bi-megaphone-fill"></i>
                <span>Campaigns</span>
              </button>
              
              <button className="donation-nav-item" onClick={() => handleNavigation('/evacuation')}>
                <i className="bi bi-geo-alt-fill"></i>
                <span>Location</span>
              </button>
              
              <div className="donation-user-menu-wrapper" ref={dropdownRef}>
                <div className="donation-user-menu" onClick={toggleDropdown}>
                  <i className="bi bi-person-circle"></i>
                  <span>User</span>
                  <i className="bi bi-chevron-down" style={{ fontSize: '0.8rem' }}></i>
                </div>
                <div className={`donation-user-dropdown ${showDropdown ? 'show' : ''}`}>
                  <button className="donation-dropdown-item" onClick={() => handleNavigation('/volunteer')}>
                    <i className="bi bi-hand-thumbs-up-fill"></i>
                    <span>Volunteer</span>
                  </button>
                  <button className="donation-dropdown-item" onClick={() => handleNavigation('/resident')}>
                    <i className="bi bi-house-heart-fill"></i>
                    <span>Resident</span>
                  </button>
                  <div className="donation-dropdown-divider"></div>
                  <button className="donation-dropdown-item" onClick={() => handleNavigation('/')}>
                    <i className="bi bi-box-arrow-right"></i>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <i className="bi bi-list"></i>
            </button>
            
            {/* Mobile Navigation Menu */}
            <div 
              className={`mobile-nav-overlay ${showMobileMenu ? 'show' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            />
            
            <div 
              ref={mobileMenuRef}
              className={`mobile-nav-menu ${showMobileMenu ? 'show' : ''}`}
            >
              <button 
                className="mobile-close-button"
                onClick={() => setShowMobileMenu(false)}
                aria-label="Close menu"
              >
                ×
              </button>
              
              <button className="mobile-nav-item active" onClick={handleHomeClick}>
                <i className="bi bi-house-door-fill"></i>
                <span>Home</span>
              </button>
              
              <button className="mobile-nav-item" onClick={(e) => handleNavClick(e, 'news')}>
                <i className="bi bi-newspaper"></i>
                <span>News</span>
              </button>
              
              <button className="mobile-nav-item" onClick={(e) => handleNavClick(e, 'campaigns')}>
                <i className="bi bi-megaphone-fill"></i>
                <span>Campaigns</span>
              </button>
              
              <button className="mobile-nav-item" onClick={() => handleNavigation('/evacuation')}>
                <i className="bi bi-geo-alt-fill"></i>
                <span>Location</span>
              </button>
              
              <div className="mobile-user-section">
                <div className="mobile-user-header">USER MENU</div>
                
                <button className="mobile-nav-item" onClick={() => handleNavigation('/volunteer')}>
                  <i className="bi bi-hand-thumbs-up-fill"></i>
                  <span>Volunteer</span>
                </button>
                
                <button className="mobile-nav-item" onClick={() => handleNavigation('/resident')}>
                  <i className="bi bi-house-heart-fill"></i>
                  <span>Resident</span>
                </button>
                
                <button className="mobile-nav-item" onClick={() => handleNavigation('/')}>
                  <i className="bi bi-box-arrow-right"></i>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}