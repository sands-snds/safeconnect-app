// Birthdates ("YYYY-MM-DD"), for the sign-up form and the resident profile.
// Only residents 15 years old and above can register; the server checks the
// same rule (backend/utils/birthdate.js).

export const MIN_SIGNUP_AGE = 15;
const MAX_AGE = 120;

const pad = (n) => String(n).padStart(2, '0');
const toText = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

const parts = (text) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text || '').trim());
  if (!match) return null;
  const [y, m, d] = match.slice(1).map(Number);
  const check = new Date(y, m - 1, d);
  if (check.getFullYear() !== y || check.getMonth() !== m - 1 || check.getDate() !== d) return null;
  return { y, m, d };
};

// Whole years from the birthdate to today (or null for a bad date).
export const ageFrom = (text, now = new Date()) => {
  const b = parts(text);
  if (!b) return null;
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  return y - b.y - (m < b.m || (m === b.m && d < b.d) ? 1 : 0);
};

// The latest birthdate that is old enough, for the date picker's max.
export const latestAllowedBirthdate = (now = new Date()) => {
  const y = now.getFullYear() - MIN_SIGNUP_AGE;
  const m = now.getMonth() + 1;
  // 29 February in a year that has none: the 28th.
  const lastDay = new Date(y, m, 0).getDate();
  return toText(y, m, Math.min(now.getDate(), lastDay));
};

export const earliestAllowedBirthdate = (now = new Date()) => toText(now.getFullYear() - MAX_AGE, 1, 1);

// The problem with a birthdate as a translation key under auth., or null.
export const birthdateProblem = (text, now = new Date()) => {
  if (!String(text || '').trim()) return 'birthdateRequired';
  const age = ageFrom(text, now);
  if (age === null || age > MAX_AGE) return 'birthdateInvalid';
  if (age < 0) return 'birthdateFuture';
  if (age < MIN_SIGNUP_AGE) return 'birthdateTooYoung';
  return null;
};

// e.g. "March 4, 2008"
export const formatBirthdate = (text, locale = 'en-US') => {
  const b = parts(text);
  if (!b) return '';
  return new Date(b.y, b.m - 1, b.d).toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' });
};
