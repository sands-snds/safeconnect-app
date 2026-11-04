import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCallAccess } from '../../Services/api';

// The report forms fire this after a report is saved, so the call button
// can appear right away (a fire report) or start its wait.
export const REPORT_SUBMITTED_EVENT = 'safeconnect:report-submitted';
export const announceReportSubmitted = () => window.dispatchEvent(new Event(REPORT_SUBMITTED_EVENT));

// Also checks now and then, so the button goes away once the barangay
// resolves or dismisses the report.
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
    window.addEventListener(REPORT_SUBMITTED_EVENT, check);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      clearTimeout(timer.current);
      window.removeEventListener(REPORT_SUBMITTED_EVENT, check);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [check]);

  return available;
}
