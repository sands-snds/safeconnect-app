import { useEffect, useState } from 'react';
import { fetchSiteContent, resolveAssetUrl } from '../../Services/api';

// Contact details for the public site (floating call button, footer):
// { emergencyContacts, officials, socials }. Admins edit them under
// Content > Site Contacts (backend/services/siteContentService.js).
//
// Shows the last copy this browser saw (or the defaults below) right away,
// then refreshes from the server once per page load.

const CACHE_KEY = 'sf_siteContent';

// Same as DEFAULT_CONTENT in backend/services/siteContentService.js, used
// until the server answers (or if it can't be reached).
export const DEFAULT_SITE_CONTENT = {
  emergencyContacts: [
    { id: 'police', label: '911 Emergency', description: 'National Emergency Hotline', sublabelKey: 'police', number: '911', icon: 'bi-shield-fill-exclamation', color: '#dc2626' },
    { id: 'dasma', label: 'Dasmariñas Police', description: 'Dasmariñas City PNP', sublabelKey: 'dasma', number: '+63462420002', icon: 'bi-shield-fill', color: '#1d4ed8' },
    { id: 'cdrmc', label: 'CDRMC', description: 'Cavite Disaster Risk Management', sublabelKey: 'cdrmc', number: '+63462300345', icon: 'bi-heart-pulse-fill', color: '#059669' },
    { id: 'dswd', label: 'DSWD', description: 'Social Welfare & Development', sublabelKey: 'dswd', number: '+63464165393', icon: 'bi-people-fill', color: '#ea580c' },
    {
      id: 'barangay', label: 'Barangay Sta. Fe', description: 'Barangay Emergency Line', sublabelKey: 'barangay', number: '09354984838', icon: 'bi-house-fill', color: '#7c3aed',
      choices: [
        { name: 'PB Emmanuel B. Noora', number: '09354984838' },
        { name: 'Sec Hazel R. Adriano', number: '09456355303' }
      ]
    }
  ],
  officials: [
    { name: 'PB Emmanuel B. Noora', number: '09354984838' },
    { name: 'Chief Tanod Gaudencio C. Dela Cruz', number: '0993611340' },
    { name: 'Sec Hazel R. Adriano', number: '09456355303' },
    { name: 'BHW Cecilia T. De Quiros', number: '09381259351' },
    { name: 'Kagawad Rolando Noora', number: '09683200779' },
    { name: 'BNS Myrna T. Dellomas', number: '09069709313' }
  ],
  socials: {
    email: 'safeconnect.brgy.santafe@gmail.com',
    facebookLabel: 'Barangay Sta. Fe',
    facebookUrl: 'https://www.facebook.com/profile.php?id=100080219150790'
  }
};

// Carousel photos and demo videos (Content > Site Contents). Same as
// DEFAULT_MEDIA in backend/services/siteMediaService.js.
const MEDIA_CACHE_KEY = 'sf_siteMedia';
export const DEFAULT_SITE_MEDIA = {
  carousel: [
    { src: '/images/Santa Fe 3.jpg', alt: 'Barangay Sta. Fe' },
    { src: '/images/Santa Fe 2.jpg', alt: 'Community rescue' },
    { src: '/images/Santa Fe.jpg', alt: 'Evacuation' }
  ],
  residentCarousel: [
    { src: '/images/resident-background.jpg', alt: 'Barangay Sta. Fe' },
    { src: '/images/resident-background2.jpg', alt: 'Barangay Sta. Fe' },
    { src: '/images/resident-background3.jpg', alt: 'Barangay Sta. Fe' }
  ],
  systemDemo: {
    title: 'See SafeConnect in action',
    caption: 'A quick tour of how to report an emergency, request help and follow your report.',
    video: { source: 'none', url: '' },
    showOnLanding: true,
    showInNews: true
  },
  adminDemo: {
    title: 'Welcome to the SafeConnect admin panel',
    caption: 'A short walkthrough of handling reports, posting announcements and managing the site.',
    video: { source: 'none', url: '' },
    showOnSignIn: true
  }
};

const readCache = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCache = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
};

// One request per page load, shared by every component using the hooks.
let current = readCache(CACHE_KEY) || DEFAULT_SITE_CONTENT;
let currentMedia = readCache(MEDIA_CACHE_KEY) || DEFAULT_SITE_MEDIA;
let request = null;
const listeners = new Set();
const mediaListeners = new Set();

const setCurrent = (content) => {
  current = content;
  writeCache(CACHE_KEY, content);
  listeners.forEach((fn) => fn(content));
};

const setCurrentMedia = (media) => {
  currentMedia = media;
  writeCache(MEDIA_CACHE_KEY, media);
  mediaListeners.forEach((fn) => fn(media));
};

export const refreshSiteContent = () => {
  request = fetchSiteContent()
    .then((result) => {
      if (result?.content) setCurrent(result.content);
      if (result?.media) setCurrentMedia(result.media);
      return result;
    })
    .catch(() => null);
  return request;
};

// Lets the Content > Site Contents editor show its changes immediately.
export const setSiteMedia = (media) => setCurrentMedia(media);

export function useSiteMedia() {
  const [media, setMedia] = useState(currentMedia);

  useEffect(() => {
    mediaListeners.add(setMedia);
    if (!request) refreshSiteContent();
    return () => mediaListeners.delete(setMedia);
  }, []);

  return media;
}

// Full URL for a carousel photo or uploaded video: uploads come from the
// backend, the default photos from the frontend's public/images.
export const mediaSrc = (src) =>
  String(src || '').startsWith('/uploads/') ? resolveAssetUrl(src) : src;

// True when a demo video has something to play.
export const hasVideo = (demo) =>
  Boolean(demo?.video && demo.video.source !== 'none' && demo.video.url);

// Lets the Content > Site Contacts editor show its changes immediately.
export const setSiteContent = (content) => setCurrent(content);

export default function useSiteContent() {
  const [content, setContent] = useState(current);

  useEffect(() => {
    listeners.add(setContent);
    if (!request) refreshSiteContent();
    return () => listeners.delete(setContent);
  }, []);

  return content;
}

// Description for an emergency contact: the translated default while it's
// unchanged (sublabelKey), otherwise the text an Admin typed.
export const contactDescription = (contact, t) =>
  contact.sublabelKey ? t(`emergencyContacts.sublabels.${contact.sublabelKey}`) : contact.description;
