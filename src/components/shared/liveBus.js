import { useEffect, useRef } from 'react';

// The live connection (useLiveUpdates) repeats every server event here, so a
// page that loads its own data can reload when it changes without being wired
// into the page that owns the connection. Events carry no data: a listener
// fetches again through its usual endpoint, so it only ever sees what that
// endpoint lets the signed-in user see.
//
// "reconnected" fires after the connection comes back, so a page can catch up
// on anything it missed while offline.

export const LIVE_EVENT = 'safeconnect:live';

export const emitLive = (type) => window.dispatchEvent(new CustomEvent(LIVE_EVENT, { detail: type }));

// useLiveEvent(['reports', 'reconnected'], load): calls load (the latest one)
// when any of those events arrive. enabled=false pauses it.
export function useLiveEvent(types, onEvent, enabled = true) {
  const fnRef = useRef(onEvent);
  fnRef.current = onEvent;
  const key = types.join(',');

  useEffect(() => {
    if (!enabled) return undefined;
    const wanted = new Set(key.split(','));
    const listener = (e) => { if (wanted.has(e.detail)) fnRef.current(e.detail); };
    window.addEventListener(LIVE_EVENT, listener);
    return () => window.removeEventListener(LIVE_EVENT, listener);
  }, [key, enabled]);
}
