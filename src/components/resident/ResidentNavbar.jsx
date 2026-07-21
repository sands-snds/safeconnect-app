import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Adjust this path if it errors — should point to your Services/api.js
import { fetchAnnouncements } from '../../Services/api';
import MyReportsPage from './MyReportsPage';
import SettingsPage from './SettingsPage';
import NewsOverlay from "./navbar/NewsOverlay";
import NotificationPanel from "./navbar/NotificationPanel";
import UserDropdown from "./navbar/UserDropdown";
import DesktopNavbar from "./navbar/DesktopNavbar";
import MobileNavbar from "./navbar/MobileNavbar";
import useAnnouncements from "../../hooks/useAnnouncements";
import useNotifications from "../../hooks/useNotifications";
import "./navbar/NavbarStyles.css";

// How often to poll for new announcements while the app is open (ms)
const POLL_INTERVAL_MS = 60 * 1000; // 1 minute

// localStorage keys used to persist which announcements this resident has
// already seen, so unread state survives refreshes/logins.
const READ_IDS_KEY = 'sf_readAnnouncementIds';
const BASELINE_SET_KEY = 'sf_notifBaselineSet';

// --- Weather (Open-Meteo, free, no API key required) ---
// Coordinates for Dasmariñas, Cavite (Barangay Santa Fe's area)
const WEATHER_LAT = 14.3294;
const WEATHER_LON = 120.9367;
const WEATHER_CACHE_KEY = 'sf_weatherCache'; // stores { date: 'YYYY-MM-DD', data: {...} }
const WEATHER_DISMISSED_KEY = 'sf_weatherNoticeDismissed'; // stores the date it was last dismissed on
const RAIN_ALERT_THRESHOLD = 40; // % chance of rain that triggers the "possible rain" notice

const getTodayKey = () => new Date().toISOString().split('T')[0];

// The weather notice re-appears each new day, but stays dismissed for the
// rest of today once the resident clicks it.
const loadWeatherDismissed = () => {
  try {
    return localStorage.getItem(WEATHER_DISMISSED_KEY) === getTodayKey();
  } catch {
    return false;
  }
};

// Minimal WMO weather code -> label/icon mapping
const describeWeatherCode = (code) => {
  if ([0].includes(code)) return { label: 'Clear sky', icon: 'bi-sun-fill' };
  if ([1, 2, 3].includes(code)) return { label: 'Partly cloudy', icon: 'bi-cloud-sun-fill' };
  if ([45, 48].includes(code)) return { label: 'Foggy', icon: 'bi-cloud-fog2-fill' };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Drizzle', icon: 'bi-cloud-drizzle-fill' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: 'Rain', icon: 'bi-cloud-rain-fill' };
  if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', icon: 'bi-cloud-lightning-rain-fill' };
  return { label: 'Weather update', icon: 'bi-cloud-fill' };
};

const loadReadIds = () => {
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveReadIds = (set) => {
  try {
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore storage errors (e.g. private browsing quota)
  }
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

// Reads the logged-in resident's account info, saved at sign-in.
// Falls back gracefully if it's missing (e.g. older sessions from before
// this was added) so the navbar never breaks.
const loadCurrentUser = () => {
  try {
    const raw = sessionStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveCurrentUser = (user) => {
  try {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  } catch {
    // Ignore storage errors
  }
};

function ResidentNavbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewsPage, setShowNewsPage] = useState(false);
  const [showReportsPage, setShowReportsPage] = useState(false);
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  const [username, setUsername] = useState('User');
  const [currentUser, setCurrentUser] = useState(() => loadCurrentUser());

  // Single shared source of truth for announcements — powers both the
  // notification bell and the full-screen News page.
  const [readIds, setReadIds] = useState(() => loadReadIds());

  // Daily weather snapshot (Open-Meteo), cached per calendar day
  const [weather, setWeather] = useState(null);
  const [weatherDismissed, setWeatherDismissed] = useState(() => loadWeatherDismissed());

  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const notificationsRef = useRef(null); // desktop bell + panel
  const mobileNotificationsRef = useRef(null); // mobile bell + panel
  const navigate = useNavigate();

  const unreadCount = announcements.filter(a => !readIds.has(a.id)).length;

  const {
      announcements,
      announcementsLoading,
      announcementsError,
      reloadAnnouncements
  } = useAnnouncements();


  // Most recent announcements shown in the dropdown, flagged with unread state
  const notifications = announcements.slice(0, 8).map(a => ({
    ...a,
    unread: !readIds.has(a.id)
  }));

  const showRainNotice = weather && weather.rainChance >= RAIN_ALERT_THRESHOLD && !weatherDismissed;
  const totalBadgeCount = unreadCount + (showRainNotice ? 1 : 0);

  useEffect(() => {
    // Prefer the full account record saved at sign-in (has id, username,
    // email, photo, etc). Fall back to the legacy name-only value so
    // existing sessions from before this change still show something.
    const user = loadCurrentUser();
    if (user) {
      setCurrentUser(user);
      setUsername(user.username || user.fullName || 'User');
      return;
    }
    const storedName = localStorage.getItem('residentName');
    if (storedName) {
      setUsername(storedName);
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = (showNewsPage || showReportsPage || showSettingsPage) ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [showNewsPage, showReportsPage, showSettingsPage]);

  // Load announcements + weather on mount, then keep polling so the bell
  // updates automatically whenever the admin posts something new (weather
  // itself only actually re-fetches once the calendar day rolls over, since
  // it's cached — see loadWeather below).
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


  // Fetches today's forecast for Dasmariñas from Open-Meteo (no API key
  // needed) and caches it in localStorage so it only re-fetches once the
  // date changes — giving a forecast that updates automatically every day.
  const loadWeather = async () => {
    try {
      const cachedRaw = localStorage.getItem(WEATHER_CACHE_KEY);
      const cached = cachedRaw ? JSON.parse(cachedRaw) : null;
      const today = getTodayKey();

      if (cached && cached.date === today) {
        setWeather(cached.data);
        return;
      }

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}&daily=precipitation_probability_max,weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FManila`
      );
      const json = await res.json();

      const rainChance = json.daily.precipitation_probability_max[0];
      const code = json.daily.weathercode[0];
      const tMax = Math.round(json.daily.temperature_2m_max[0]);
      const tMin = Math.round(json.daily.temperature_2m_min[0]);

      const data = { date: today, rainChance, code, tMax, tMin };
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ date: today, data }));
      setWeather(data);

      // A new day's forecast means any prior dismissal no longer applies
      if (localStorage.getItem(WEATHER_DISMISSED_KEY) !== today) {
        setWeatherDismissed(false);
      }
    } catch (err) {
      // Weather is a nice-to-have, not core functionality — fail quietly
      console.error('Weather fetch failed:', err);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest('.mobile-menu-toggle')
      ) {
        setShowMobileMenu(false);
      }
      const outsideDesktopPanel =
        !notificationsRef.current || !notificationsRef.current.contains(event.target);
      const outsideMobilePanel =
        !mobileNotificationsRef.current || !mobileNotificationsRef.current.contains(event.target);
      if (outsideDesktopPanel && outsideMobilePanel) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Bubble profile changes (new username / new photo) from the Settings
  // page back up so the navbar and session storage stay in sync everywhere.
  const handleProfileUpdate = (updates) => {
    setCurrentUser((prev) => {
      const next = { ...(prev || {}), ...updates };
      saveCurrentUser(next);
      return next;
    });
    if (updates.username) {
      setUsername(updates.username);
      // Keep the legacy localStorage value in sync too, since other parts
      // of the app may still read it directly.
      try {
        localStorage.setItem('residentName', updates.username);
      } catch {
        // Ignore storage errors
      }
    }
  };

  const markAllAsRead = () => {
    const allIds = announcements.map((a) => a.id);
    const newSet = new Set([...readIds, ...allIds]);
    setReadIds(newSet);
    saveReadIds(newSet);
  };

  const markOneAsRead = (id) => {
    if (readIds.has(id)) return;
    const newSet = new Set(readIds);
    newSet.add(id);
    setReadIds(newSet);
    saveReadIds(newSet);
  };

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

  // Clicking the weather notice: mark it dismissed for today, open the News
  // page, and scroll to the weather card — same pattern as a regular
  // announcement click.
  const handleWeatherNotificationClick = () => {
    try {
      localStorage.setItem(WEATHER_DISMISSED_KEY, getTodayKey());
    } catch {
      // Ignore storage errors
    }
    setWeatherDismissed(true);
    setShowNotifications(false);
    setShowMobileMenu(false);
    setShowNewsPage(true);

    setTimeout(() => {
      const el = document.getElementById('news-item-weather');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      <style>{`
        .resident-navbar {
          background: linear-gradient(135deg, #6B2C3E 0%, #8B3A52 100%);
          padding: 1rem 0;
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.2);
          position: sticky;
          top: 0;
          z-index: 1040;
        }
        
        .resident-navbar .navbar-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          position: relative;
        }
        
        .resident-navbar .navbar-brand {
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
          .resident-navbar .navbar-brand {
            font-size: 1.1rem;
            gap: 0.5rem;
          }
        }
        
        @media (max-width: 360px) {
          .resident-navbar .navbar-brand {
            font-size: 1rem;
            gap: 0.4rem;
          }
          .resident-navbar .navbar-brand span {
            display: none;
          }
        }
        
        .resident-navbar .navbar-brand:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .resident-navbar .brand-icon {
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
          .resident-navbar .brand-icon {
            width: 36px;
            height: 36px;
          }
        }
        
        @media (max-width: 360px) {
          .resident-navbar .brand-icon {
            width: 32px;
            height: 32px;
          }
        }
        
        .resident-navbar .brand-icon i {
          font-size: 1.25rem;
          color: #DC3545;
        }
        
        @media (max-width: 480px) {
          .resident-navbar .brand-icon i {
            font-size: 1.1rem;
          }
        }
        
        /* Desktop Navigation */
        .resident-nav-links {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          margin-left: auto;
        }
        
        @media (max-width: 768px) {
          .resident-nav-links {
            display: none;
          }
        }
        
        .resident-nav-item {
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
        
        .resident-nav-item:hover {
          opacity: 1;
          color: white;
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .resident-nav-item.active {
          opacity: 1;
          background-color: rgba(255, 255, 255, 0.15);
          border-bottom: 2px solid white;
          padding-bottom: 0.5rem;
        }
        
        .resident-nav-item i {
          font-size: 1.15rem;
        }

        /* Icon-only buttons (bell) */
        .icon-btn-wrapper {
          position: relative;
        }

        .icon-btn {
          position: relative;
          color: white;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 1.3rem;
          padding: 0.55rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .icon-btn:hover {
          background-color: rgba(255, 255, 255, 0.12);
        }

        .notification-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background: #ffc107;
          color: #1f2937;
          font-size: 0.65rem;
          font-weight: 700;
          min-width: 16px;
          height: 16px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
          border: 2px solid #6B2C3E;
        }

        /* Notification dropdown panel */
        .panel-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
          width: 340px;
          max-height: 420px;
          overflow-y: auto;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.25s ease;
          z-index: 1050;
        }

        .panel-dropdown.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        @media (max-width: 480px) {
          .mobile-header-actions .panel-dropdown {
            width: calc(100vw - 2rem);
            right: -0.5rem;
          }
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid #f0f0f0;
        }

        .panel-header h4 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: #1f2937;
        }

        .panel-header button {
          border: none;
          background: none;
          color: #6B2C3E;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }

        .notification-empty {
          padding: 24px 18px;
          text-align: center;
          color: #9ca3af;
          font-size: 0.85rem;
        }

        .notification-item {
          display: flex;
          gap: 10px;
          padding: 12px 18px;
          border-bottom: 1px solid #f5f5f5;
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .notification-item:hover {
          background-color: #faf5f6;
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-icon {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(107, 44, 62, 0.1);
          color: #6B2C3E;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 0.95rem;
        }

        .notification-item.unread .notification-icon {
          background: #6B2C3E;
          color: white;
        }

        .notification-text {
          flex: 1;
          min-width: 0;
        }

        .notification-text .n-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 2px;
        }

        .notification-text .n-message {
          font-size: 0.8rem;
          color: #6b7280;
          margin: 0 0 4px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .notification-text .n-time {
          font-size: 0.72rem;
          color: #9ca3af;
        }

        .unread-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #dc3545;
          flex-shrink: 0;
          margin-top: 4px;
        }

        /* FULL-SCREEN NEWS PAGE */
        .news-fullscreen {
          position: fixed;
          inset: 0;
          background: #f7f5f6;
          z-index: 2000;
          display: flex;
          flex-direction: column;
          opacity: 0;
          visibility: hidden;
          transform: translateY(20px);
          transition: all 0.3s ease;
        }

        .news-fullscreen.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .news-fullscreen-header {
          background: linear-gradient(135deg, #6B2C3E 0%, #8B3A52 100%);
          padding: 1.25rem clamp(1.5rem, 5vw, 4rem);
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
          flex-shrink: 0;
        }

        .news-fullscreen-header h2 {
          color: white;
          font-size: clamp(1.2rem, 2.5vw, 1.6rem);
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .news-close-btn {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: white;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .news-close-btn:hover {
          background: rgba(255, 255, 255, 0.28);
        }

        .news-fullscreen-body {
          flex: 1;
          overflow-y: auto;
          padding: clamp(1.5rem, 4vw, 3rem) clamp(1.5rem, 5vw, 4rem) 4rem;
        }

.news-state-message {
  max-width: 900px;
  margin: 2.5rem auto;
  text-align: center;
  color: #6b7280;
  font-size: 0.95rem;
}

.news-list {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.news-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  transition: transform 0.25s ease, box-shadow 0.25s ease, outline 0.25s ease;
  scroll-margin-top: 1.5rem;
}

.news-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.12);
}

.news-card-media {
  width: 100%;
  height: clamp(280px, 45vw, 480px);
  background-size: cover;
  background-position: center;
  background-color: #e5d9dc;
  flex-shrink: 0;
}

.news-card-content {
  padding: clamp(1.5rem, 3vw, 2.5rem);
}

.news-card-category {
  display: inline-block;
  background: rgba(107, 44, 62, 0.1);
  color: #6B2C3E;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 5px 14px;
  border-radius: 999px;
  margin-bottom: 0.8rem;
}

.news-card-date {
  font-size: 0.85rem;
  color: #9ca3af;
  margin-bottom: 0.5rem;
}

.news-card-content h3 {
  font-size: clamp(1.3rem, 2.2vw, 1.75rem);
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.75rem;
  line-height: 1.3;
}

.news-card-content p {
  font-size: clamp(0.95rem, 1.1vw, 1.05rem);
  color: #6b7280;
  line-height: 1.65;
  margin: 0 0 1rem;
}

.news-card-source-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #6B2C3E;
  text-decoration: none;
}

.news-card-source-link:hover {
  text-decoration: underline;
}
        
        .resident-user-menu-wrapper {
          position: relative;
          padding-left: 1rem;
          border-left: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .resident-user-menu {
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
          max-width: 180px;
        }

        .resident-user-menu span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .resident-user-menu:hover {
          background-color: rgba(255, 255, 255, 0.1);
          opacity: 0.8;
        }
        
        .resident-user-dropdown {
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
        
        .resident-user-dropdown.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        
        .resident-dropdown-item {
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
        
        .resident-dropdown-item:hover {
          background-color: #f8f9fa;
          color: #6B2C3E;
        }
        
        .resident-dropdown-item i {
          font-size: 1.15rem;
          opacity: 0.7;
          width: 20px;
        }
        
        .resident-dropdown-divider {
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

        .mobile-header-actions {
          display: none;
          align-items: center;
          gap: 4px;
          position: relative;
        }

        @media (max-width: 768px) {
          .mobile-header-actions {
            display: flex;
          }
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
          overflow-y: auto;
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
          position: relative;
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

        .mobile-nav-item .notification-badge {
          position: static;
          margin-left: auto;
          border: none;
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
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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