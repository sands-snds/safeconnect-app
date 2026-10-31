import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MyReportsPage from './MyReportsPage';
import SettingsPage from './SettingsPage';
import NewsOverlay from "./navbar/NewsOverlay";
import NotificationsPage from "./navbar/NotificationsPage";
import { focusNewsItem } from "./navbar/AnnouncementCard";
import DesktopNavbar from "./navbar/DesktopNavbar";
import MobileNavbar from "./navbar/MobileNavbar";
import useAnnouncements from "./navbar/hooks/useAnnouncements";
import useNotifications from "./navbar/hooks/useNotifications";
import useWeather from "./navbar/hooks/useWeather";
import useResidentProfile from "./navbar/hooks/useResidentProfile";
import useClickOutside from "./navbar/hooks/useClickOutside";
import { clearAuthToken, logoutUser } from "../../Services/api";
import { confirmPopup } from "../shared/popup";
import { refreshSyncedState, useSyncOnFocus } from "../shared/useSyncedState";
import useLiveUpdates from "../shared/useLiveUpdates";
import useTabNotifications, { markNotificationsViewed } from "../shared/useTabNotifications";
import { useLanguage } from "../../i18n/LanguageContext";
import { MAIN_LOGO } from "../shared/logos";
import "./navbar/NavbarStyle.css";



const POLL_INTERVAL_MS = 30 * 1000;


const REPORT_TYPE_BY_NOTIFICATION = {
  emergency_status: 'Emergency',
  assistance_status: 'Assistance',
  petty_crime_status: 'Petty Crime'
};

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



const formatPublishedAt = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' });
  return `${day} · ${time}`;
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
    
    'comment_reply': 'bi-chat-left-text-fill'
  };
  return map[category] || 'bi-megaphone-fill';
};




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
  
  
  const [reportsVersion, setReportsVersion] = useState(0);
  const refreshReports = () => setReportsVersion((v) => v + 1);
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  const [showNotificationsPage, setShowNotificationsPage] = useState(false);
  
  const [reportFocus, setReportFocus] = useState(null);

  
  
  
  
  
  const [activeView, setActiveView] = useState('home');

  const {
    currentUser,
    username,
    updateProfile,
    refreshProfile
  } = useResidentProfile();

  const navRef = useRef(null);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const mobileNotificationsRef = useRef(null);
  const navigate = useNavigate();

  
  
  
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
      archivedNotifications,
      unreadCount,
      totalBadgeCount,
      markOneAsRead,
      markAllAsRead,
      archiveNotifications,
      deleteNotifications,
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
    document.body.style.overflow = (showNewsPage || showReportsPage || showSettingsPage || showNotificationsPage) ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [showNewsPage, showReportsPage, showSettingsPage, showNotificationsPage]);

  useEffect(() => {
    reloadAnnouncements();
    loadWeather();
    const interval = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      reloadAnnouncements();
      loadWeather();
      reloadPersonalNotifications();
      refreshSyncedState();
      refreshProfile();
      refreshReports();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  
  
  const focusRefresh = useRef(null);
  focusRefresh.current = () => {
    reloadAnnouncements();
    reloadPersonalNotifications();
    refreshProfile();
    refreshReports();
  };
  useSyncOnFocus(Boolean(currentUser?.id), () => focusRefresh.current());

  
  useLiveUpdates(Boolean(currentUser?.id), {
    state: refreshSyncedState,
    notifications: reloadPersonalNotifications,
    announcements: reloadAnnouncements,
    profile: refreshProfile,
    reports: refreshReports,
    reconnected: () => {
      refreshSyncedState();
      focusRefresh.current();
    }
  });

  
  const { t } = useLanguage();
  useTabNotifications(totalBadgeCount, { blinkText: t('notificationPanel.tabNew'), alertCount: unreadCount });

  
  
  const markEverythingRead = () => {
    markAllAsRead();
    if (showRainNotice) dismissWeatherNotice();
  };

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
      markNotificationsViewed(); // stops the tab blinking
      reloadAnnouncements();
      reloadPersonalNotifications();
    }
  };

  
  
  const openNewsPage = () => {
    setActiveView('news');
    setShowNewsPage(true);
    setShowReportsPage(false);
    setShowSettingsPage(false);
    setShowNotificationsPage(false);
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
    setShowNotificationsPage(false);
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
    setShowNotificationsPage(false);
    setShowMobileMenu(false);
    setShowDropdown(false);
    setShowNotifications(false);
  };

  
  
  const openNotificationsPage = () => {
    setActiveView('notifications');
    setShowNotificationsPage(true);
    setShowNewsPage(false);
    setShowReportsPage(false);
    setShowSettingsPage(false);
    setShowMobileMenu(false);
    setShowDropdown(false);
    setShowNotifications(false);
    markNotificationsViewed();
    reloadAnnouncements();
    reloadPersonalNotifications();
  };

  const markManyAsRead = (ids) => ids.forEach((id) => markOneAsRead(id));

  const closeSettingsPage = () => setShowSettingsPage(false);

  
  
  
  const closeAllPanels = () => {
    setShowNewsPage(false);
    setShowReportsPage(false);
    setShowSettingsPage(false);
    setShowNotificationsPage(false);
  };

  
  
  
  
  
  const handleNotificationClick = (id) => {
    markOneAsRead(id);
    setShowNotifications(false);

    let focus = { announcementId: id };
    if (typeof id === 'string' && id.startsWith('personal-')) {
      const note = [...notifications, ...archivedNotifications].find((n) => n.id === id);
      const reportType = note && REPORT_TYPE_BY_NOTIFICATION[note.category];
      if (reportType && note.referenceId) {
        openReportsPage();
        setReportFocus({ type: reportType, id: note.referenceId, nonce: Date.now() });
        return;
      }
      if (note?.category !== 'comment_reply' || !note.referenceId) {
        openReportsPage();
        return;
      }
      focus = { announcementId: note.referenceId, commentId: note.commentId, openComments: true };
    }

    openNewsPage();
    
    setTimeout(() => focusNewsItem(focus), 300);
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

  const handleNavigation = async (path) => {
    if (path === '/evacuation') {
      sessionStorage.setItem('previousPage', '/resident');
    }
    if (path === '/') {
      setShowDropdown(false);
      setShowMobileMenu(false);
      const confirmed = await confirmPopup({
        type: 'warning',
        title: t('residentNav.logoutConfirmTitle'),
        message: t('residentNav.logoutConfirmBody'),
        confirmLabel: t('residentNav.logoutConfirmYes'),
        cancelLabel: t('residentNav.logoutConfirmNo')
      });
      if (!confirmed) return;
      
      await logoutUser();
      localStorage.removeItem('residentName');
      sessionStorage.removeItem('userAuthenticated');
      sessionStorage.removeItem('currentUser');
      clearAuthToken();
    }
    setShowDropdown(false);
    setShowMobileMenu(false);
    
    
    if (path === '/') navigate('/', { replace: true, state: { signedOut: true } });
    else navigate(path);
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
                <img src={MAIN_LOGO} alt="Safe Connect logo" />
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

              markAllAsRead={markEverythingRead}

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
              openNotificationsPage={openNotificationsPage}
              archiveNotifications={archiveNotifications}

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

              markAllAsRead={markEverythingRead}

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
              openNotificationsPage={openNotificationsPage}
              archiveNotifications={archiveNotifications}

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
        formatPublishedAt={formatPublishedAt}
        describeWeatherCode={describeWeatherCode}
        RAIN_ALERT_THRESHOLD={RAIN_ALERT_THRESHOLD}
      />

      <MyReportsPage
        isOpen={showReportsPage}
        onClose={closeReportsPage}
        userId={currentUser?.id}
        focusReport={reportFocus}
        liveVersion={reportsVersion}
      />

      <NotificationsPage
        isOpen={showNotificationsPage}
        notifications={notifications}
        archivedNotifications={archivedNotifications}
        onOpen={handleNotificationClick}
        onArchive={archiveNotifications}
        onDelete={deleteNotifications}
        onMarkRead={markManyAsRead}
        onMarkAllRead={markEverythingRead}
        formatRelativeTime={formatRelativeTime}
        getCategoryIcon={getCategoryIcon}
        getCategoryColor={getCategoryColor}
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