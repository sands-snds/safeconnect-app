import { renderHook, waitFor } from '@testing-library/react';
import useLiveUpdates from './useLiveUpdates';
import { getAuthToken } from '../../Services/api';

jest.mock('../../Services/api', () => ({
  API_ENDPOINTS: { ME: 'http://api.test/api/me' },
  getAuthToken: jest.fn()
}));

const encoder = new TextEncoder();
// A response whose body streams the given chunks, then (optionally) stays open.
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
