import { renderHook, act, waitFor } from '@testing-library/react';
import useCallAccess, { announceReportSubmitted } from './useCallAccess';
import { fetchCallAccess } from '../../Services/api';

jest.mock('../../Services/api', () => ({ fetchCallAccess: jest.fn() }));

beforeEach(() => {
  jest.useFakeTimers();
  fetchCallAccess.mockReset();
  sessionStorage.setItem('currentUser', JSON.stringify({ id: 7, fullName: 'Juan Dela Cruz' }));
});
afterEach(() => {
  jest.useRealTimers();
  sessionStorage.clear();
});

const NONE = { available: false, secondsUntilAvailable: null };
const NOW = { available: true, secondsUntilAvailable: 0 };
const waitFor_ = (seconds) => ({ available: false, secondsUntilAvailable: seconds });

test('no report yet: the button stays hidden', async () => {
  fetchCallAccess.mockResolvedValue(NONE);
  const { result } = renderHook(() => useCallAccess());
  await waitFor(() => expect(fetchCallAccess).toHaveBeenCalledWith(7));
  expect(result.current).toBe(false);
});

test('fire report: the button appears right after it is submitted, without a reload', async () => {
  fetchCallAccess.mockResolvedValueOnce(NONE).mockResolvedValue(NOW);
  const { result } = renderHook(() => useCallAccess());
  await waitFor(() => expect(fetchCallAccess).toHaveBeenCalledTimes(1));
  expect(result.current).toBe(false);

  act(() => announceReportSubmitted());
  await waitFor(() => expect(result.current).toBe(true));
});

test.each([
  ['flood or typhoon', 10 * 60],
  ['earthquake', 5 * 60],
  ['transport vehicle', 5 * 60],
  ['other assistance or petty crime', 20 * 60]
])('%s: hidden during the wait, shown when the server says it is over', async (_, wait) => {
  fetchCallAccess.mockResolvedValueOnce(NONE).mockResolvedValueOnce(waitFor_(wait)).mockResolvedValue(NOW);
  const { result } = renderHook(() => useCallAccess());
  await waitFor(() => expect(fetchCallAccess).toHaveBeenCalledTimes(1));

  act(() => announceReportSubmitted());
  await waitFor(() => expect(fetchCallAccess).toHaveBeenCalledTimes(2));
  expect(result.current).toBe(false);

  // The check scheduled for the end of the wait asks the server again.
  await act(async () => { jest.advanceTimersByTime(wait * 1000 + 1000); });
  await waitFor(() => expect(result.current).toBe(true));
});

test('after a reload or a new sign-in it picks up where the server says', async () => {
  // e.g. an earthquake report sent 3 minutes ago: 2 minutes left
  fetchCallAccess.mockResolvedValueOnce(waitFor_(120)).mockResolvedValue(NOW);
  const { result } = renderHook(() => useCallAccess());
  await waitFor(() => expect(fetchCallAccess).toHaveBeenCalledTimes(1));
  expect(result.current).toBe(false);
  await act(async () => { jest.advanceTimersByTime(121 * 1000); });
  await waitFor(() => expect(result.current).toBe(true));
});

test('the button goes away once the report is resolved', async () => {
  fetchCallAccess.mockResolvedValueOnce(NOW).mockResolvedValue(NONE);
  const { result } = renderHook(() => useCallAccess());
  await waitFor(() => expect(result.current).toBe(true));
  await act(async () => { jest.advanceTimersByTime(60 * 1000); });
  await waitFor(() => expect(result.current).toBe(false));
});

test('a failed check keeps what is showing', async () => {
  fetchCallAccess.mockResolvedValueOnce(NOW).mockRejectedValue(new Error('offline'));
  const { result } = renderHook(() => useCallAccess());
  await waitFor(() => expect(result.current).toBe(true));
  act(() => announceReportSubmitted());
  await waitFor(() => expect(fetchCallAccess).toHaveBeenCalledTimes(2));
  expect(result.current).toBe(true);
});
