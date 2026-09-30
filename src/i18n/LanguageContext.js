import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'sf_language';

const readStoredLanguage = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const getByPath = (dict, key) =>
  key.split('.').reduce((obj, part) => (obj && obj[part] !== undefined ? obj[part] : undefined), dict);

export function LanguageProvider({ children }) {
  const [storedLanguage, setStoredLanguage] = useState(readStoredLanguage);

  const setLanguage = useCallback((lang) => {
    setStoredLanguage(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Storage unavailable (private browsing, etc.) -- the choice just
      // won't persist across reloads, which is a fine fallback.
    }
  }, []);

  const language = storedLanguage || 'en';

  const t = useCallback((key, vars) => {
    let value = getByPath(translations[language], key);
    if (value === undefined) value = getByPath(translations.en, key);
    if (value === undefined) return key;

    if (vars && typeof value === 'string') {
      return Object.keys(vars).reduce(
        (str, k) => str.replace(new RegExp(`{{${k}}}`, 'g'), vars[k]),
        value
      );
    }
    return value;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    hasChosenLanguage: !!storedLanguage
  }), [language, setLanguage, t, storedLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
