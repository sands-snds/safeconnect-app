import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCallAccess } from '../../Services/api';

// Fired whenever the resident's reports may have changed, so the call
// button is checked again at once: a report submitted, edited or deleted
// here, and (through ResidentNavbar's refreshReports) the live "reports"
// event the server sends when the barangay changes a report's status. So
// the button appears right after a fire report and goes away as soon as
// the report is resolved or dismissed, without a reload.
export const REPORTS_CHANGED_EVENT = 'safeconnect:reports-changed';
export const announceReportsChanged = () => window.dispatchEvent(new Event(REPORTS_CHANGED_EVENT));

// A fallback in case the live connection is down.
const RECHECK_MS = 60 * 1000;

const currentUserId = () => {
  try {
    const raw = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const source = raw && raw.user ? raw.user : raw;
    return source.id ?? source.user_id ?? source.userId ?? null;
  } catch {
    return null;
  }
};

// Whether the resident page shows the emergency call button. The server
// decides from the report's submission time, so the wait stays right after
// a refresh, a sign-out or on another device; here it only schedules the
// next check for the moment the wait ends.
export default function useCallAccess() {
  const [available, setAvailable] = useState(false);
  const timer = useRef(null);
  const latest = useRef(0);

  const check = useCallback(async () => {
    const userId = currentUserId();
    if (!userId) {
      setAvailable(false);
      return;
    }
    const request = ++latest.current;
    try {
      const access = await fetchCallAccess(userId);
      if (request !== latest.current) return;
      setAvailable(Boolean(access.available));
      clearTimeout(timer.current);
      if (!access.available && access.secondsUntilAvailable > 0) {
        timer.current = setTimeout(check, access.secondsUntilAvailable * 1000 + 1000);
      }
    } catch {
      // Keep what is showing; the next check tries again.
    }
  }, []);

  useEffect(() => {
    check();
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    const interval = setInterval(() => { if (document.visibilityState !== 'hidden') check(); }, RECHECK_MS);
    window.addEventListener(REPORTS_CHANGED_EVENT, check);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      clearTimeout(timer.current);
      window.removeEventListener(REPORTS_CHANGED_EVENT, check);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [check]);

  return available;
}
