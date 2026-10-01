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
import { clearAuthToken } from "../../Services/api";
import "./navbar/NavbarStyle.css";

// How often to poll for new announcements while the app is open (ms)
const POLL_INTERVAL_MS = 60 * 1000; // 1 minute

const RAIN_ALERT_THRESHOLD = 40;

const describeWeatherCode = (code) => {
  if ([0].includes(code)) return { key: 'clear', label: 'Clear sky', icon: 'bi-sun-fill' };
  if ([1, 2, 3].includes(code)) return { key: 'partlyCloudy', label: 'Partly cloudy', icon: 'bi-cloud-sun-fill' };
  if ([45, 48].includes(code)) return { key: 'foggy', label: 'Foggy', icon: 'bi-cloud-fog2-fill' };
  if ([51, 53, 55, 56, 57].includes(code)) return { key: 'drizzle', label: 'Drizzle', icon: 'bi-cloud-drizzle-fill' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { key: 'rain', label: 'Rain', icon: 'bi-cloud-rain-fill' };
  if ([95, 96, 99].includes(code)) return { key: 'thunderstorm', label: 'Thunderstorm', icon: 'bi-cloud-lightning-rain-fill' };
  return { key: 'update', label: 'Weather update', icon: 'bi-cloud-fill' };
};

const formatNewsDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

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

const getCategoryIcon = (category) => {
  const map = {
    'Emergency Alert': 'bi-exclamation-triangle-fill',
    'Weather Advisory': 'bi-cloud-rain-fill',
    'Evacuation': 'bi-signpost-split-fill',
    'Community Event': 'bi-calendar-event-fill',
    'Community Update': 'bi-info-circle-fill',
    'Announcement': 'bi-megaphone-fill',
    'General': 'bi-megaphone-fill',
    // Personal notifications (report status-change replies)
    'emergency_status': 'bi-exclamation-triangle-fill',
    'assistance_status': 'bi-hand-index-thumb-fill',
    'petty_crime_status': 'bi-shield-fill-exclamation',
    // Barangay replied to the resident's comment on an announcement
    'comment_reply': 'bi-chat-left-text-fill'
  };
  return map[category] || 'bi-megaphone-fill';
};

// Color-codes each notification by category so, e.g., a general emergency
// alert and a personal "your report status changed" update don't look
// visually identical just because both use a triangle icon.
const getCategoryColor = (category) => {
  const map = {
    'Emergency Alert': '#dc2626',
    'Weather Advisory': '#3b82f6',
    'Evacuation': '#f97316',
    'Community Event': '#8b5cf6',
    'Community Update': '#0ea5e9',
    'Announcement': '#6B2C3E',
    'General': '#6B2C3E',
    // Personal notifications (report status-change replies)
    'emergency_status': '#dc2626',
    'assistance_status': '#0d9488',
    'petty_crime_status': '#7c3aed',
    'comment_reply': '#6B2C3E'
  };
  return map[category] || '#6B2C3E';
};

function ResidentNavbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNewsPage, setShowNewsPage] = useState(false);
  const [showReportsPage, setShowReportsPage] = useState(false);
  const [showSettingsPage, setShowSettingsPage] = useState(false);

  // Which nav item should read as "active": 'home' | 'emergency' | 'news' |
  // 'reports' | 'settings'. Emergency has no panel of its own (it's an
  // anchor scroll on the dashboard), so this can't be derived from the
  // show*Page booleans alone -- it's set explicitly by whichever nav
  // action the resident actually took.
  const [activeView, setActiveView] = useState('home');

  const {
    currentUser,
    username,
    updateProfile
  } = useResidentProfile();

  const navRef = useRef(null);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const mobileNotificationsRef = useRef(null);
  const navigate = useNavigate();

  // Exposes the navbar's real rendered height as a CSS variable so the
  // News/My Reports/Settings panels can sit flush below it (position:
  // fixed; top: var(--resident-navbar-height)) instead of covering it.
  useEffect(() => {
    const navEl = navRef.current;
    if (!navEl) return;
    const setHeightVar = () => {
      document.documentElement.style.setProperty('--resident-navbar-height', `${navEl.offsetHeight}px`);
    };
    setHeightVar();
    const ro = new ResizeObserver(setHeightVar);
    ro.observe(navEl);
    window.addEventListener('resize', setHeightVar);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', setHeightVar);
    };
  }, []);

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
      markAllAsRead,
      reloadPersonalNotifications
  } = useNotifications(
      announcements,
      showRainNotice,
      currentUser?.id
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
      reloadPersonalNotifications();
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
      reloadAnnouncements();
      reloadPersonalNotifications();
    }
  };

  // Only one of News / My Reports / Settings shows at a time -- they're
  // tabs below the navbar now, not independent overlays.
  const openNewsPage = () => {
    setActiveView('news');
    setShowNewsPage(true);
    setShowReportsPage(false);
    setShowSettingsPage(false);
    setShowMobileMenu(false);
    setShowDropdown(false);
    setShowNotifications(false);
    reloadAnnouncements();
  };

  const closeNewsPage = () => setShowNewsPage(false);

  const openReportsPage = () => {
    setActiveView('reports');
    setShowReportsPage(true);
    setShowNewsPage(false);
    setShowSettingsPage(false);
    setShowMobileMenu(false);
    setShowDropdown(false);
    setShowNotifications(false);
  };

  const closeReportsPage = () => setShowReportsPage(false);

  const openSettingsPage = () => {
    setActiveView('settings');
    setShowSettingsPage(true);
    setShowNewsPage(false);
    setShowReportsPage(false);
    setShowMobileMenu(false);
    setShowDropdown(false);
    setShowNotifications(false);
  };

  const closeSettingsPage = () => setShowSettingsPage(false);

  // Shared by Home and the Emergency anchor link: returns to the normal
  // dashboard view so the navbar's own nav items are the only "back"
  // affordance a resident needs (no more hunting for the X button).
  const closeAllPanels = () => {
    setShowNewsPage(false);
    setShowReportsPage(false);
    setShowSettingsPage(false);
  };

  // Clicking a notification: mark it read. For announcements, also open the
  // News page and scroll straight to that article. Personal notifications
  // (e.g. "your report status changed") don't have a matching news article --
  // take the resident straight to My Reports instead, since that's where
  // they can actually see the report the update is about. The exception is
  // "Barangay replied to your comment", which opens the announcement it's on.
  const handleNotificationClick = (id) => {
    markOneAsRead(id);

    let newsId = id;
    if (typeof id === 'string' && id.startsWith('personal-')) {
      const note = notifications.find((n) => n.id === id);
      if (note?.category !== 'comment_reply' || !note.referenceId) {
        openReportsPage();
        return;
      }
      newsId = note.referenceId;
    }

    setShowNotifications(false);
    openNewsPage();
    setTimeout(() => {
      const el = document.getElementById(`news-item-${newsId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  const handleWeatherNotificationClick = () => {
    dismissWeatherNotice();
    setShowNotifications(false);
    openNewsPage();
    setTimeout(() => {
      document
        .getElementById("news-item-weather")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      clearAuthToken();
    }
    setShowDropdown(false);
    setShowMobileMenu(false);
    navigate(path);
  };

  const scrollToSection = (sectionId) => {
    closeAllPanels();
    setActiveView(sectionId === 'emergency-report' ? 'emergency' : 'home');
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
    closeAllPanels();
    setActiveView('home');
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setShowMobileMenu(false);
  };

  return (
    <>
      <nav className="resident-navbar" ref={navRef}>
        <div className="container-fluid px-3 px-sm-4">
          <div className="navbar-container">
            {/* Brand */}
            <button className="navbar-brand" onClick={handleHomeClick}>
              <div className="brand-icon">
                <img src="/images/safeconnect-logo.svg" alt="Safe Connect logo" />
              </div>
              <span>Safe Connect</span>
            </button>

            {/* Desktop Navigation */}
            <DesktopNavbar
              activeView={activeView}
              username={username}
              photoUrl={currentUser?.photoUrl}

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
              getCategoryColor={getCategoryColor}

              handleHomeClick={handleHomeClick}
              handleNavClick={handleNavClick}

              openNewsPage={openNewsPage}
              openReportsPage={openReportsPage}
              openSettingsPage={openSettingsPage}

              handleNavigation={handleNavigation}
            />

            {/* Mobile Navigation */}
            <MobileNavbar
              activeView={activeView}
              username={username}
              photoUrl={currentUser?.photoUrl}

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
              getCategoryColor={getCategoryColor}

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

      <MyReportsPage
        isOpen={showReportsPage}
        onClose={closeReportsPage}
        userId={currentUser?.id}
      />

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