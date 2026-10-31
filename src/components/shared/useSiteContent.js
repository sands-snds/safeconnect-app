import { useEffect, useState } from 'react';
import { fetchSiteContent, resolveAssetUrl } from '../../Services/api';

const CACHE_KEY = 'sf_siteContent';

export const DEFAULT_SITE_CONTENT = {
  emergencyContacts: [
    { id: 'police', label: '911 Emergency', description: 'National Emergency Hotline', sublabelKey: 'police', number: '911', icon: 'bi-shield-fill-exclamation', color: '#dc2626' },
    { id: 'dasma', label: 'Dasmariñas Police', description: 'Dasmariñas City PNP', sublabelKey: 'dasma', number: '+63462420002', numberType: 'landline', icon: 'bi-shield-fill', color: '#1d4ed8' },
    { id: 'cdrmc', label: 'CDRMC', description: 'Cavite Disaster Risk Management', sublabelKey: 'cdrmc', number: '+63462300345', numberType: 'landline', icon: 'bi-heart-pulse-fill', color: '#059669' },
    { id: 'dswd', label: 'DSWD', description: 'Social Welfare & Development', sublabelKey: 'dswd', number: '+63464165393', numberType: 'landline', icon: 'bi-people-fill', color: '#ea580c' },
    {
      id: 'barangay', label: 'Barangay Sta. Fe', description: 'Barangay Emergency Line', sublabelKey: 'barangay', number: '+639354984838', numberType: 'mobile', icon: 'bi-house-fill', color: '#7c3aed',
      choices: [
        { name: 'PB Emmanuel B. Noora', number: '+639354984838', numberType: 'mobile' },
        { name: 'Sec Hazel R. Adriano', number: '+639456355303', numberType: 'mobile' }
      ]
    }
  ],
  footerHotlines: [
    { label: '911 Emergency', number: '911' },
    { label: 'Dasmariñas Police', number: '+63462420002' },
    { label: 'CDRMC', number: '+63462300345' },
    { label: 'DSWD', number: '+63464165393' }
  ],
  officials: [
    { name: 'PB Emmanuel B. Noora', position: 'PB', firstName: 'Emmanuel', middleName: 'B.', lastName: 'Noora', number: '+639354984838', numberType: 'mobile' },
    { name: 'Chief Tanod Gaudencio C. Dela Cruz', position: 'Chief Tanod', firstName: 'Gaudencio', middleName: 'C.', lastName: 'Dela Cruz', number: '+63993611340', numberType: 'landline' },
    { name: 'Sec Hazel R. Adriano', position: 'Sec', firstName: 'Hazel', middleName: 'R.', lastName: 'Adriano', number: '+639456355303', numberType: 'mobile' },
    { name: 'BHW Cecilia T. De Quiros', position: 'BHW', firstName: 'Cecilia', middleName: 'T.', lastName: 'De Quiros', number: '+639381259351', numberType: 'mobile' },
    { name: 'Kagawad Rolando Noora', position: 'Kagawad', firstName: 'Rolando', middleName: '', lastName: 'Noora', number: '+639683200779', numberType: 'mobile' },
    { name: 'BNS Myrna T. Dellomas', position: 'BNS', firstName: 'Myrna', middleName: 'T.', lastName: 'Dellomas', number: '+639069709313', numberType: 'mobile' }
  ],
  socials: {
    email: 'safeconnect.brgy.santafe@gmail.com',
    facebookLabel: 'Barangay Sta. Fe',
    facebookUrl: 'https://www.facebook.com/profile.php?id=100080219150790'
  }
};

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
    showInNews: false
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

export const mediaSrc = (src) =>
  String(src || '').startsWith('/uploads/') ? resolveAssetUrl(src) : src;

export const hasVideo = (demo) =>
  Boolean(demo?.video && demo.video.source !== 'none' && demo.video.url);

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

export const officialName = (o) =>
  [o.position, o.firstName, o.middleName, o.lastName].filter(Boolean).join(' ') || o.name || '';

export const contactDescription = (contact, t) =>
  contact.sublabelKey ? t(`emergencyContacts.sublabels.${contact.sublabelKey}`) : contact.description;
