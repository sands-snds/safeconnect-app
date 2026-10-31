import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { translations } from './translations';
import { saveLanguagePreference } from '../Services/api';
import { subscribeSyncedState, getSyncedLanguage } from '../components/shared/useSyncedState';

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

  
  
  const lastLocalChange = useRef(0);
  const pushedLocal = useRef(false);

  const setLanguage = useCallback((lang) => {
    lastLocalChange.current = Date.now();
    pushedLocal.current = true;
    saveLanguagePreference(lang);
    setStoredLanguage(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
    }
  }, []);

  const language = storedLanguage || 'en';

  
  
  
  const storedRef = useRef(storedLanguage);
  storedRef.current = storedLanguage;
  useEffect(() => subscribeSyncedState(() => {
    const synced = getSyncedLanguage();
    if (!synced) {
      if (storedRef.current && !pushedLocal.current) {
        pushedLocal.current = true;
        saveLanguagePreference(storedRef.current);
      }
      return;
    }
    pushedLocal.current = true;
    if (synced === storedRef.current || Date.now() - lastLocalChange.current < 10000) return;
    setStoredLanguage(synced);
    try { localStorage.setItem(STORAGE_KEY, synced); } catch { /* storage unavailable */ }
  }), []);

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
