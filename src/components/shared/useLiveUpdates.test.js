import { renderHook, waitFor } from '@testing-library/react';
import useLiveUpdates from './useLiveUpdates';
import { getAuthToken } from '../../Services/api';
import { LIVE_EVENT, emitLive, useLiveEvent } from './liveBus';

jest.mock('../../Services/api', () => ({
  API_ENDPOINTS: { ME: 'http://api.test/api/me' },
  getAuthToken: jest.fn()
}));

const encoder = new TextEncoder();

const streamResponse = (chunks, { status = 200, hang = true } = {}) => {
  let i = 0;
  return {
    ok: status < 400,
    status,
    body: {
      getReader: () => ({
        read: () => (i < chunks.length
          ? Promise.resolve({ value: encoder.encode(chunks[i++]), done: false })
          : hang ? new Promise(() => {}) : Promise.resolve({ done: true }))
      })
    }
  };
};

beforeEach(() => {
  getAuthToken.mockReturnValue('resident.token');
});

test('calls the handler named by each event, including events split across chunks', async () => {
  global.fetch = jest.fn(() => Promise.resolve(streamResponse([
    ': connected\n\n',
    'event: notifications\ndata: {}\n\nevent: sta',
    'te\ndata: {}\n\n'
  ])));
  const notifications = jest.fn();
  const state = jest.fn();
  renderHook(() => useLiveUpdates(true, { notifications, state }));
  await waitFor(() => expect(state).toHaveBeenCalledTimes(1));
  expect(notifications).toHaveBeenCalledTimes(1);
  const [url, options] = global.fetch.mock.calls[0];
  expect(url).toBe('http://api.test/api/me/events');
  expect(options.headers.Authorization).toBe('Bearer resident.token'); // header, not the URL
});

test('a signed-out response stops without retrying', async () => {
  jest.useFakeTimers();
  global.fetch = jest.fn(() => Promise.resolve(streamResponse([], { status: 401 })));
  renderHook(() => useLiveUpdates(true, {}));
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  jest.advanceTimersByTime(60000);
  expect(global.fetch).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});

test('reconnects after the connection drops and catches up', async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce(streamResponse([': connected\n\n'], { hang: false })) // drops
    .mockResolvedValue(streamResponse([': connected\n\n']));
  const reconnected = jest.fn();
  renderHook(() => useLiveUpdates(true, { reconnected }));
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2), { timeout: 4000 });
  await waitFor(() => expect(reconnected).toHaveBeenCalledTimes(1));
});

test('does nothing when not signed in or disabled', () => {
  global.fetch = jest.fn();
  renderHook(() => useLiveUpdates(false, {}));
  getAuthToken.mockReturnValue(null);
  renderHook(() => useLiveUpdates(true, {}));
  expect(global.fetch).not.toHaveBeenCalled();
});

test('a burst of events runs a shared handler once and passes each type on to page listeners', async () => {
  global.fetch = jest.fn(() => Promise.resolve(streamResponse([
    ': connected\n\n',
    'event: reports\ndata: {}\n\nevent: admin-notifications\ndata: {}\n\nevent: reports\ndata: {}\n\n'
  ])));
  const reload = jest.fn();
  const heard = [];
  const listener = (e) => heard.push(e.detail);
  window.addEventListener(LIVE_EVENT, listener);
  renderHook(() => useLiveUpdates(true, { reports: reload, 'admin-notifications': reload }));
  await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  expect(heard.sort()).toEqual(['admin-notifications', 'reports']);
  window.removeEventListener(LIVE_EVENT, listener);
});

test('useLiveEvent only hears the types it asks for, and not while paused', () => {
  const fn = jest.fn();
  const { rerender } = renderHook(({ on }) => useLiveEvent(['users'], fn, on), { initialProps: { on: true } });
  emitLive('reports');
  emitLive('users');
  expect(fn).toHaveBeenCalledTimes(1);
  rerender({ on: false });
  emitLive('users');
  expect(fn).toHaveBeenCalledTimes(1);
});
