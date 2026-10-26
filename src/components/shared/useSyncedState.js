import { useEffect, useState } from 'react';
import { fetchMyState, markItemsRead } from '../../Services/api';

// The signed-in account's synced state (GET/POST /api/me, see
// backend/services/userStateService.js): what they've read or dismissed and
// their language. Kept on the server so it follows them to every device;
// this module holds the copy for the current page.
//
// Read keys: "announcement:<id>", "weather:<YYYY-MM-DD>", "admin-demo:hidden".

let readItems = new Set();
let language = null;
// Marked here but not yet confirmed saved (offline, a failed request): kept
// on screen and sent again on the next refresh.
const unsaved = new Set();
const listeners = new Set();

const emit = () => listeners.forEach((fn) => fn());

export const subscribeSyncedState = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getSyncedLanguage = () => language;

// Loads the latest copy from the server. Resolves to true when it worked.
export const refreshSyncedState = async () => {
  const retried = [...unsaved];
  if (retried.length) await saveKeys(retried);
  const result = await fetchMyState();
  if (!result) return false;
  // Keep what was just re-sent too, in case the copy read back predates it.
  readItems = new Set([...(result.readItems || []), ...unsaved, ...retried]);
  language = result.preferences?.language || null;
  emit();
  return true;
};

async function saveKeys(keys) {
  if (!keys.length) return;
  keys.forEach((k) => unsaved.add(k));
  const ok = await markItemsRead(keys);
  if (ok) keys.forEach((k) => unsaved.delete(k));
}

// Marks items read on this page right away and saves them for the account.
export const markSyncedRead = (keys) => {
  const fresh = keys.filter((k) => !readItems.has(k));
  if (!fresh.length) return;
  readItems = new Set([...readItems, ...fresh]);
  emit();
  saveKeys(fresh);
};

export const isSyncedRead = (key) => readItems.has(key);

// Re-renders the component whenever the synced state changes; returns the
// current set of read keys.
export function useSyncedReadItems() {
  const [, setVersion] = useState(0);
  useEffect(() => subscribeSyncedState(() => setVersion((v) => v + 1)), []);
  return readItems;
}

// Keeps the page in step with the other devices: loads the state now, again
// whenever the person comes back to this tab, and when `onRefresh` callers
// add their own refreshes (profile, notifications) to the same moments.
export function useSyncOnFocus(enabled, onRefresh) {
  useEffect(() => {
    if (!enabled) return undefined;
    let lastRun = 0;
    const run = () => {
      // "focus" and "visibilitychange" usually fire together.
      if (Date.now() - lastRun < 2000) return;
      lastRun = Date.now();
      refreshSyncedState();
      if (onRefresh) onRefresh();
    };
    const onVisible = () => { if (document.visibilityState === 'visible') run(); };
    run();
    window.addEventListener('focus', run);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', run);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // onRefresh is read when the tab regains focus; callers pass a stable function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}

// Tests only.
export const __resetSyncedState = () => {
  readItems = new Set();
  language = null;
  unsaved.clear();
  emit();
};
