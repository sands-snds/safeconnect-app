import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DemoVideoPlayer from './DemoVideoPlayer';

const upload = { video: { source: 'upload', url: '/uploads/demo.mp4' }, title: 'Demo' };
const youtube = { video: { source: 'youtube', url: 'abc123' }, title: 'Demo' };

let observerCallback;
beforeEach(() => {
  global.IntersectionObserver = class {
    constructor(cb) { observerCallback = cb; }
    observe() {}
    disconnect() {}
  };
});
const scrollIntoView = (visible = true) => act(() => { observerCallback([{ isIntersecting: visible }]); });

test('an uploaded video plays with sound when the browser allows it', async () => {
  const play = jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue();
  const { container } = render(<DemoVideoPlayer demo={upload} autoPlay />);
  scrollIntoView();
  await waitFor(() => expect(play).toHaveBeenCalled());
  expect(container.querySelector('video').muted).toBe(false);
  expect(screen.queryByRole('button', { name: /Unmute/ })).not.toBeInTheDocument();
  play.mockRestore();
});

test('when the browser blocks sound, it plays muted with an Unmute button', async () => {
  const play = jest.spyOn(window.HTMLMediaElement.prototype, 'play')
    .mockRejectedValueOnce(new Error('NotAllowedError'))
    .mockResolvedValue();
  const { container } = render(<DemoVideoPlayer demo={upload} autoPlay unmuteLabel="Unmute" />);
  scrollIntoView();
  const button = await screen.findByRole('button', { name: /Unmute/ });
  expect(container.querySelector('video').muted).toBe(true);
  fireEvent.click(button);
  expect(container.querySelector('video').muted).toBe(false);
  play.mockRestore();
});

test('nothing plays until the video is on screen', () => {
  const play = jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue();
  render(<DemoVideoPlayer demo={upload} autoPlay />);
  expect(play).not.toHaveBeenCalled();
  play.mockRestore();
});

test('YouTube loads muted autoplay once on screen', () => {
  const { container } = render(<DemoVideoPlayer demo={youtube} autoPlay />);
  expect(container.querySelector('iframe')).toBeNull();
  scrollIntoView();
  const src = container.querySelector('iframe').getAttribute('src');
  expect(src).toContain('autoplay=1');
  expect(src).toContain('mute=1');
  expect(src).toContain('playsinline=1');
});

test('without autoPlay nothing starts by itself', () => {
  const { container } = render(<DemoVideoPlayer demo={youtube} />);
  expect(container.querySelector('iframe').getAttribute('src')).not.toContain('autoplay=1');
});
