import { renderHook } from '@testing-library/react';

// A stand-in AudioContext that counts the chime's tones.
let tones = 0;
class FakeAudioContext {
  constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
  createOscillator() { tones += 1; return { type: '', frequency: {}, connect: (g) => g, start() {}, stop() {} }; }
  createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: (d) => d }; }
  resume() { return Promise.resolve(); }
}

// The hook reads the page's title once, when it loads.
window.AudioContext = FakeAudioContext;
document.title = 'Safe Connect | Barangay Sta. Fe';
const useTabNotificationsModule = require('./useTabNotifications');

beforeEach(() => {
  tones = 0;
  document.title = 'Safe Connect | Barangay Sta. Fe';
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

const load = () => useTabNotificationsModule.default;

test('the tab title shows the unread count and goes back to normal at zero', () => {
  const useTabNotifications = load();
  const { rerender, unmount } = renderHook(({ n }) => useTabNotifications(n), { initialProps: { n: 3 } });
  expect(document.title).toBe('(3) Safe Connect | Barangay Sta. Fe');
  rerender({ n: 120 });
  expect(document.title).toBe('(99+) Safe Connect | Barangay Sta. Fe');
  rerender({ n: 0 });
  expect(document.title).toBe('Safe Connect | Barangay Sta. Fe');
  rerender({ n: 2 });
  unmount();
  expect(document.title).toBe('Safe Connect | Barangay Sta. Fe');
});

test('chimes only for new notifications, not for ones already there on open', () => {
  const useTabNotifications = load();
  const { rerender } = renderHook(({ n }) => useTabNotifications(n), { initialProps: { n: 0 } });
  rerender({ n: 4 }); // loaded right after opening
  expect(tones).toBe(0);
  jest.advanceTimersByTime(5000);
  rerender({ n: 5 }); // a new one arrives
  expect(tones).toBe(2); // two-tone chime
  rerender({ n: 3 }); // read some: no sound
  expect(tones).toBe(2);
});

test('no sound when turned off', () => {
  const useTabNotifications = load();
  const { rerender } = renderHook(({ n }) => useTabNotifications(n, { sound: false }), { initialProps: { n: 0 } });
  jest.advanceTimersByTime(5000);
  rerender({ n: 1 });
  expect(tones).toBe(0);
  expect(document.title).toBe('(1) Safe Connect | Barangay Sta. Fe');
});
