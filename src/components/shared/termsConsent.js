// Whether this browser has opened the Terms and Conditions (TermsModal.jsx),
// which the Sign In form requires before its "I agree" box can be ticked.
//
// Stored per TERMS_VERSION: bump it whenever the Terms change, and everyone
// has to open the new version before signing in again.

export const TERMS_VERSION = '2026-10-16';
export const TERMS_HASH = '#terms';
export const TERMS_VIEWED_EVENT = 'safeconnect:terms-viewed';

const STORAGE_KEY = 'sf_terms_viewed';

export const hasViewedTerms = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === TERMS_VERSION;
  } catch {
    return false;
  }
};

export const markTermsViewed = () => {
  try {
    localStorage.setItem(STORAGE_KEY, TERMS_VERSION);
  } catch {
    // Storage unavailable (private browsing): the event below still lets
    // the open Sign In form unlock for this visit.
  }
  window.dispatchEvent(new Event(TERMS_VIEWED_EVENT));
};

// Opens TermsModal (it listens for the #terms hash).
export const openTerms = () => {
  window.location.hash = TERMS_HASH;
};
