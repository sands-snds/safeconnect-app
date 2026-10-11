import { useEffect, useState } from 'react';
import { fetchSiteContent } from '../../Services/api';

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
    { id: 'barangay', label: 'Barangay Sta. Fe', description: 'Barangay Emergency Line', sublabelKey: 'barangay', number: '+639929474309', icon: 'bi-house-fill', color: '#7c3aed' }
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

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// One request per page load, shared by every component using the hook.
let current = readCache() || DEFAULT_SITE_CONTENT;
let request = null;
const listeners = new Set();

const setCurrent = (content) => {
  current = content;
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(content)); } catch { /* storage unavailable */ }
  listeners.forEach((fn) => fn(content));
};

export const refreshSiteContent = () => {
  request = fetchSiteContent()
    .then((result) => { if (result?.content) setCurrent(result.content); return result; })
    .catch(() => null);
  return request;
};

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
