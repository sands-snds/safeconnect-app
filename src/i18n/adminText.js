import { ADMIN_TL } from './adminTranslations';

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
