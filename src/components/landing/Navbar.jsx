import React, { useState, useEffect, useRef } from 'react';
import { HeartFill } from 'react-bootstrap-icons';
// Removed: useNavigate

function Navbar() {
  // Removed: navigate
  // Removed: showAdminModal, adminEmail, adminPassword, error, setShowAdminModal, setAdminEmail, setAdminPassword, setError
  
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Removed: showDropdown
  // Removed: dropdownRef
  const mobileMenuRef = useRef(null);

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
      // Removed: dropdownRef logic
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

  // Removed: handleAdminLogin function
  // Removed: closeAdminModal function
  // Removed: toggleDropdown function

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  // Removed: toggleDropdown (Replaced with a dummy handler)
  /* const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  }; */

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
        .navbar-custom {
          background: linear-gradient(135deg, #6B2C3E 0%, #8B3A52 100%);
          padding: 1rem 0;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.2);
          position: sticky;
          top: 0;
          z-index: 1050;
        }
        
        .navbar-custom .navbar-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          position: relative;
        }
        
        .navbar-custom .navbar-brand {
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
          .navbar-custom .navbar-brand {
            font-size: 1.1rem;
            gap: 0.5rem;
          }
        }
        
        @media (max-width: 360px) {
          .navbar-custom .navbar-brand {
            font-size: 1rem;
            gap: 0.4rem;
          }
          
          .navbar-custom .navbar-brand span {
            display: none;
          }
        }
        
        .navbar-custom .navbar-brand:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .navbar-custom .brand-icon {
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
          .navbar-custom .brand-icon {
            width: 36px;
            height: 36px;
          }
        }
        
        @media (max-width: 360px) {
          .navbar-custom .brand-icon {
            width: 32px;
            height: 32px;
          }
        }
        
        .navbar-custom .brand-icon svg {
          font-size: 1.25rem;
          color: #DC3545;
        }
        
        @media (max-width: 480px) {
          .navbar-custom .brand-icon svg {
            font-size: 1.1rem;
          }
        }
        
        /* Desktop Navigation */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-left: auto;
          /* Removed padding/border logic for admin wrapper */
        }
        
        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
        }
        
        .nav-item {
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
        
        .nav-item:hover {
          opacity: 1;
          color: white;
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .nav-item.active {
          opacity: 1;
          background-color: rgba(255, 255, 255, 0.15);
          border-bottom: 2px solid white;
          padding-bottom: 0.5rem;
        }
        
        .nav-item i {
          font-size: 1.15rem;
        }
        
        /* Admin related styles removed */
        
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
        
        /* Mobile admin styles removed */
        
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
      
      <nav className="navbar-custom">
        <div className="container-fluid px-3 px-sm-4">
          <div className="navbar-container">
            <button className="navbar-brand" onClick={handleHomeClick}>
              <div className="brand-icon">
                <HeartFill />
              </div>
              <span>Safe Connect</span>
            </button>
            
            {/* Desktop Navigation */}
            <div className="nav-links">
              <button className="nav-item active" onClick={handleHomeClick}>
                <i className="bi bi-house-door-fill"></i>
                <span>Home</span>
              </button>
              
              <button className="nav-item" onClick={(e) => handleNavClick(e, 'services')}>
                <i className="bi bi-list-check"></i>
                <span>Services</span>
              </button>
              
              <button className="nav-item" onClick={(e) => handleNavClick(e, 'contact')}>
                <i className="bi bi-telephone-fill"></i>
                <span>Contact</span>
              </button>
              
              <button className="nav-item" onClick={(e) => handleNavClick(e, 'about')}>
                <i className="bi bi-info-circle-fill"></i>
                <span>About Us</span>
              </button>
              
              {/* Removed: Admin dropdown wrapper */}
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
              
              <button className="mobile-nav-item" onClick={(e) => handleNavClick(e, 'services')}>
                <i className="bi bi-list-check"></i>
                <span>Services</span>
              </button>
              
              <button className="mobile-nav-item" onClick={(e) => handleNavClick(e, 'contact')}>
                <i className="bi bi-telephone-fill"></i>
                <span>Contact</span>
              </button>
              
              <button className="mobile-nav-item" onClick={(e) => handleNavClick(e, 'about')}>
                <i className="bi bi-info-circle-fill"></i>
                <span>About Us</span>
              </button>
              
              {/* Removed: Mobile Admin section */}
            </div>
          </div>
        </div>
      </nav>

      {/* Removed: Admin Modal JSX */}
    </>
  );
}

export default Navbar;