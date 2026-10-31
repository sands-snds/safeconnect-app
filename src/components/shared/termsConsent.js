





export const TERMS_VERSION = '2026-10-29';
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
  }
  window.dispatchEvent(new Event(TERMS_VIEWED_EVENT));
};


export const openTerms = () => {
  window.location.hash = TERMS_HASH;
};
