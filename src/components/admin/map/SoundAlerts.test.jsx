import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SoundAlerts } from './IncidentMapPage';
import { playReportSound, unlockAudio, useAudioState } from './reportSounds';

jest.mock('../../shared/location/IncidentMap', () => () => null);
jest.mock('./reportSounds', () => ({
  SOUND_KINDS: ['emergency', 'assistance', 'pettyCrime'],
  playReportSound: jest.fn(() => true),
  unlockAudio: jest.fn(() => Promise.resolve(true)),
  useAudioState: jest.fn(() => 'ready')
}));

beforeEach(() => {
  // The test setup resets mocks before each test, so set them again here.
  jest.clearAllMocks();
  useAudioState.mockReturnValue('ready');
  unlockAudio.mockImplementation(() => Promise.resolve(true));
  playReportSound.mockImplementation(() => true);
});

test('an on / off switch for the alert sound', () => {
  const onToggle = jest.fn();
  const { rerender } = render(<SoundAlerts soundOn={false} onToggle={onToggle} />);
  const toggle = screen.getByRole('switch', { name: 'Alert sound for new reports' });
  expect(toggle).toHaveAttribute('aria-checked', 'false');
  expect(screen.getByText(/Off: new reports show a notice without sound/)).toBeInTheDocument();
  fireEvent.click(toggle);
  expect(onToggle).toHaveBeenCalledTimes(1);
  rerender(<SoundAlerts soundOn onToggle={onToggle} />);
  expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByText(/each kind of report has its own sound/)).toBeInTheDocument();
});

test('each sound can be heard from its own button', async () => {
  render(<SoundAlerts soundOn onToggle={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: /Petty crime/ }));
  await waitFor(() => expect(playReportSound).toHaveBeenCalledWith('pettyCrime'));
  fireEvent.click(screen.getByRole('button', { name: /Emergency/ }));
  await waitFor(() => expect(playReportSound).toHaveBeenCalledWith('emergency'));
});

test('when the browser blocks sound, an Enable sound button is offered', () => {
  useAudioState.mockReturnValue('blocked');
  render(<SoundAlerts soundOn onToggle={() => {}} />);
  expect(screen.getByText(/holding back sound until you allow it/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Enable sound' }));
  expect(unlockAudio).toHaveBeenCalled();
});

test('no warning while the sound is off, even if the browser would block it', () => {
  useAudioState.mockReturnValue('blocked');
  render(<SoundAlerts soundOn={false} onToggle={() => {}} />);
  expect(screen.queryByRole('button', { name: 'Enable sound' })).not.toBeInTheDocument();
});
