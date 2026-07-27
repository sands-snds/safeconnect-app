import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MyReportsPage from './MyReportsPage';
import SettingsPage from './SettingsPage';
import NewsOverlay from "./navbar/NewsOverlay";
import DesktopNavbar from "./navbar/DesktopNavbar";
import MobileNavbar from "./navbar/MobileNavbar";
import useAnnouncements from "./navbar/hooks/useAnnouncements";
import useNotifications from "./navbar/hooks/useNotifications";
import useWeather from "./navbar/hooks/useWeather";
import useResidentProfile from "./navbar/hooks/useResidentProfile";
import useClickOutside from "./navbar/hooks/useClickOutside";
import "./navbar/NavbarStyle.css";

// How often to poll for new announcements while the app is open (ms)
const POLL_INTERVAL_MS = 60 * 1000; // 1 minute

const RAIN_ALERT_THRESHOLD = 40;

const describeWeatherCode = (code) => {
  if ([0].includes(code)) return { label: 'Clear sky', icon: 'bi-sun-fill' };
  if ([1, 2, 3].includes(code)) return { label: 'Partly cloudy', icon: 'bi-cloud-sun-fill' };
  if ([45, 48].includes(code)) return { label: 'Foggy', icon: 'bi-cloud-fog2-fill' };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Drizzle', icon: 'bi-cloud-drizzle-fill' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: 'Rain', icon: 'bi-cloud-rain-fill' };
  if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', icon: 'bi-cloud-lightning-rain-fill' };
  return { label: 'Weather update', icon: 'bi-cloud-fill' };
};

// Matches the look of the old sample data: "Sunday, July 5, 2026"
const formatNewsDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

// Short relative time for the notification list: "10 min ago", "Yesterday", etc.
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return formatNewsDate(dateStr);
};

// Picks an icon based on the announcement's category
const getCategoryIcon = (category) => {
  const map = {
    'Emergency Alert': 'bi-exclamation-triangle-fill',
    'Weather Advisory': 'bi-cloud-rain-fill',
    'Evacuation': 'bi-signpost-split-fill',
    'Community Event': 'bi-calendar-event-fill',
    'Community Update': 'bi-info-circle-fill',
    'Announcement': 'bi-megaphone-fill',
    'General': 'bi-megaphone-fill'
  };
  return map[category] || 'bi-megaphone-fill';
};

function ResidentNavbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNewsPage, setShowNewsPage] = useState(false);
  const [showReportsPage, setShowReportsPage] = useState(false);
  const [showSettingsPage, setShowSettingsPage] = useState(false);



  const {
    currentUser,
    username,
    updateProfile
  } = useResidentProfile();

  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const notificationsRef = useRef(null); // desktop bell + panel
  const mobileNotificationsRef = useRef(null); // mobile bell + panel
  const navigate = useNavigate();
  const {
      announcements,
      announcementsLoading,
      announcementsError,
      reloadAnnouncements
  } = useAnnouncements();

    const {
      weather,
      showRainNotice,
      loadWeather,
      dismissWeatherNotice,
    } = useWeather();

  const {
      showNotifications,
      setShowNotifications,
      notifications,
      unreadCount,
      totalBadgeCount,
      markOneAsRead,
      markAllAsRead
  } = useNotifications(
      announcements,
      showRainNotice
  );

const handleProfileUpdate = (updates) => {
    updateProfile(updates);
};

  useEffect(() => {
    document.body.style.overflow = (showNewsPage || showReportsPage || showSettingsPage) ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [showNewsPage, showReportsPage, showSettingsPage]);

  useEffect(() => {
    reloadAnnouncements();
    loadWeather();
    const interval = setInterval(() => {
      reloadAnnouncements();
      loadWeather();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


useClickOutside({

    dropdownRef,
    mobileMenuRef,
    notificationsRef,
    mobileNotificationsRef,

    setShowDropdown,
    setShowMobileMenu,
    setShowNotifications,

});

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(!showDropdown);
    setShowNotifications(false);
  };

  const toggleNotifications = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowNotifications(!showNotifications);
    setShowDropdown(false);
    if (!showNotifications) {
      // Refresh right as the panel opens so it's never stale
      reloadAnnouncements();
    }
  };

  const openNewsPage = () => {
    setShowNewsPage(true);
    setShowMobileMenu(false);
    setShowDropdown(false);
    setShowNotifications(false);
    reloadAnnouncements();
  };

  const closeNewsPage = () => setShowNewsPage(false);

  // "My Reports" — shows everything this resident has submitted
  const openReportsPage = () => {
    setShowReportsPage(true);
    setShowMobileMenu(false);
    setShowDropdown(false);
    setShowNotifications(false);
  };

  const closeReportsPage = () => setShowReportsPage(false);

  // Settings — profile photo, username, password
  const openSettingsPage = () => {
    setShowSettingsPage(true);
    setShowMobileMenu(false);
    setShowDropdown(false);
    setShowNotifications(false);
  };

  const closeSettingsPage = () => setShowSettingsPage(false);

  // Clicking a notification: mark it read, open the News page, and scroll
  // straight to that article.
  const handleNotificationClick = (id) => {
    markOneAsRead(id);
    setShowNotifications(false);
    setShowMobileMenu(false);
    setShowNewsPage(true);

    setTimeout(() => {
      const el = document.getElementById(`news-item-${id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

const handleWeatherNotificationClick = () => {
    dismissWeatherNotice();
    setShowNotifications(false);
    setShowMobileMenu(false);
    setShowNewsPage(true);

    setTimeout(() => {
        document
            .getElementById("news-item-weather")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
    }, 300);
};
  const toggleMobileMenu = () => setShowMobileMenu(!showMobileMenu);

  const handleNavigation = (path) => {
    if (path === '/evacuation') {
      sessionStorage.setItem('previousPage', '/resident');
    }
    if (path === '/') {
      localStorage.removeItem('residentName');
      sessionStorage.removeItem('userAuthenticated');
      sessionStorage.removeItem('currentUser');
    }
    setShowDropdown(false);
    setShowMobileMenu(false);
    navigate(path);
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
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setShowMobileMenu(false);
  };

  return (
    <>
      <nav className="resident-navbar">
        <div className="container-fluid px-3 px-sm-4">
            <div className="navbar-container">
                {/* Brand */}
                <button
                    className="navbar-brand"
                    onClick={handleHomeClick}
                >
                    <div className="brand-icon">
                        <i className="bi bi-heart-fill"></i>
                    </div>
                    <span>Safe Connect</span>
                </button>

                {/* Desktop Navigation */}
                <DesktopNavbar
                    username={username}

                    dropdownRef={dropdownRef}
                    notificationsRef={notificationsRef}

                    showDropdown={showDropdown}
                    showNotifications={showNotifications}

                    notifications={notifications}
                    announcements={announcements}

                    announcementsLoading={announcementsLoading}
                    announcementsError={announcementsError}

                    unreadCount={unreadCount}
                    totalBadgeCount={totalBadgeCount}

                    weather={weather}
                    showRainNotice={showRainNotice}

                    markAllAsRead={markAllAsRead}

                    toggleDropdown={toggleDropdown}
                    toggleNotifications={toggleNotifications}

                    handleNotificationClick={handleNotificationClick}
                    handleWeatherNotificationClick={handleWeatherNotificationClick}

                    formatRelativeTime={formatRelativeTime}
                    describeWeatherCode={describeWeatherCode}
                    getCategoryIcon={getCategoryIcon}

                    handleHomeClick={handleHomeClick}
                    handleNavClick={handleNavClick}

                    openNewsPage={openNewsPage}
                    openReportsPage={openReportsPage}
                    openSettingsPage={openSettingsPage}

                    handleNavigation={handleNavigation}
                />

                {/* Mobile Navigation */}
                <MobileNavbar
                    username={username}

                    mobileMenuRef={mobileMenuRef}
                    mobileNotificationsRef={mobileNotificationsRef}

                    showMobileMenu={showMobileMenu}
                    showNotifications={showNotifications}

                    totalBadgeCount={totalBadgeCount}

                    notifications={notifications}
                    announcements={announcements}

                    announcementsLoading={announcementsLoading}
                    announcementsError={announcementsError}

                    unreadCount={unreadCount}

                    weather={weather}
                    showRainNotice={showRainNotice}

                    toggleNotifications={toggleNotifications}

                    markAllAsRead={markAllAsRead}

                    handleNotificationClick={handleNotificationClick}
                    handleWeatherNotificationClick={handleWeatherNotificationClick}

                    formatRelativeTime={formatRelativeTime}
                    describeWeatherCode={describeWeatherCode}
                    getCategoryIcon={getCategoryIcon}

                    toggleMobileMenu={toggleMobileMenu}

                    setShowMobileMenu={setShowMobileMenu}
                    setShowNotifications={setShowNotifications}

                    handleHomeClick={handleHomeClick}
                    handleNavClick={handleNavClick}

                    openNewsPage={openNewsPage}
                    openReportsPage={openReportsPage}
                    openSettingsPage={openSettingsPage}

                    handleNavigation={handleNavigation}
                />
            </div>
        </div>
    </nav>

      <NewsOverlay
        isOpen={showNewsPage}
        onClose={closeNewsPage}

        weather={weather}
        announcements={announcements}

        announcementsLoading={announcementsLoading}
        announcementsError={announcementsError}

        formatNewsDate={formatNewsDate}
        describeWeatherCode={describeWeatherCode}

        RAIN_ALERT_THRESHOLD={RAIN_ALERT_THRESHOLD}
    />

      {/* FULL-SCREEN MY REPORTS PAGE */}
      <MyReportsPage
        isOpen={showReportsPage}
        onClose={closeReportsPage}
        userId={currentUser?.id}
      />

      {/* FULL-SCREEN SETTINGS PAGE */}
      <SettingsPage
        isOpen={showSettingsPage}
        onClose={closeSettingsPage}
        user={currentUser}
        onProfileUpdate={handleProfileUpdate}
      />
    </>
  );
}

export default ResidentNavbar;