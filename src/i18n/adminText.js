import { ADMIN_TL } from './adminTranslations';

// The admin panel's translations: tx("View details") returns the Tagalog
// from adminTranslations.js when the panel is in Tagalog, otherwise the
// English as is. {{name}} placeholders are filled from `vars`.
//
// AdminPage calls setAdminLanguage(language) while it renders, before its
// children, and a language change re-renders the whole panel, so tx() can
// be used anywhere in admin components (also outside hooks).
let current = 'en';

export const setAdminLanguage = (language) => {
  current = language === 'tl' ? 'tl' : 'en';
};

export const adminLanguage = () => current;

export const tx = (text, vars) => {
  if (text === null || text === undefined) return text;
  let value = (current === 'tl' && ADMIN_TL[text]) || text;
  if (vars) {
    value = Object.keys(vars).reduce((str, k) => str.replace(new RegExp(`{{${k}}}`, 'g'), vars[k]), value);
  }
  return value;
};
