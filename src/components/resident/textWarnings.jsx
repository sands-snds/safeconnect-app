import { useEffect, useMemo, useState } from 'react';
import { checkText } from '../shared/textCheck';

// Inline warnings for a report form's text fields (see shared/textCheck.js).
//
// fields: { key: { value, kind, api } } — kind is 'description', 'short' or
// 'number'; api is the field's name in the request, used to show a
// TEXT_INVALID answer from the backend under the right field.
// serverErrors: the backend's { [api]: { reason, value } } (cleared by
// editing that field).
//
// Returns { warnings, blocked }: warnings[key] is the reason to show under the
// field ('offensive', 'spam', 'meaningless') or null; blocked is true while
// any field has a problem, so Send stays off. A warning shows once typing
// pauses and goes away as soon as the text is fixed.
const SHOW_AFTER_MS = 600;

export function useTextWarnings(fields, serverErrors = {}) {
  const reasons = {};
  Object.entries(fields).forEach(([key, { value, kind, api }]) => {
    const local = checkText(value, kind);
    const server = api && serverErrors[api] && serverErrors[api].value === value ? serverErrors[api].reason : null;
    reasons[key] = local || server || null;
  });
  const signature = JSON.stringify(reasons);
  const current = useMemo(() => JSON.parse(signature), [signature]);

  // Shown warnings: new ones after a pause, fixed ones right away.
  const [shown, setShown] = useState({});
  useEffect(() => {
    setShown((prev) => {
      const next = {};
      Object.keys(current).forEach((k) => { next[k] = current[k] && prev[k] === current[k] ? current[k] : null; });
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
    });
    const timer = setTimeout(() => setShown(current), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [current]);

  return { warnings: shown, blocked: Object.values(current).some(Boolean), reasons: current };
}

// A backend TEXT_INVALID answer (error.code / error.fields from resultError)
// as serverErrors for useTextWarnings, remembering each field's value.
export const serverTextErrors = (error, valuesByApi) => {
  if (!error || error.code !== 'TEXT_INVALID' || !error.fields) return null;
  const out = {};
  Object.entries(error.fields).forEach(([api, reason]) => { out[api] = { reason, value: valuesByApi[api] }; });
  return out;
};

// The red line under a field.
export function TextWarning({ t, reason, id }) {
  if (!reason) return null;
  return (
    <p id={id} role="alert" style={{ margin: '4px 0 0', color: '#dc2626', fontSize: '12px', fontWeight: 600, lineHeight: 1.4 }}>
      <i className="bi bi-exclamation-circle-fill" aria-hidden="true"></i> {t(`reportForm.textCheck.${reason}`)}
    </p>
  );
}
