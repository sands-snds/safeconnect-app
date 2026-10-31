import { useEffect, useRef } from 'react';
import { API_ENDPOINTS, getAuthToken } from '../../Services/api';












export default function useLiveUpdates(enabled, handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled || typeof window.fetch !== 'function' || typeof TextDecoder === 'undefined') return undefined;
    let stopped = false;
    let controller = null;
    let retryTimer = null;
    let failures = 0;
    let connectedBefore = false;

    const handle = (block) => {
      const match = block.match(/^event: *(.+)$/m);
      const fn = match && handlersRef.current[match[1].trim()];
      if (fn) fn();
    };

    const connect = async () => {
      const token = getAuthToken();
      if (!token || stopped) return;
      controller = new AbortController();
      try {
        const res = await fetch(`${API_ENDPOINTS.ME}/events`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
          cache: 'no-store',
          signal: controller.signal
        });
        
        if (res.status === 401 || res.status === 403) return;
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        if (connectedBefore && handlersRef.current.reconnected) handlersRef.current.reconnected();
        connectedBefore = true;
        failures = 0;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
          let end;
          while ((end = buffer.indexOf('\n\n')) >= 0) {
            handle(buffer.slice(0, end));
            buffer = buffer.slice(end + 2);
          }
        }
      } catch (err) {
        if (stopped || err?.name === 'AbortError') return;
      }
      if (stopped) return;
      failures += 1;
      retryTimer = setTimeout(connect, Math.min(30000, 1000 * 2 ** Math.min(failures, 5)));
    };

    connect();
    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      if (controller) controller.abort();
    };
  }, [enabled]);
}
