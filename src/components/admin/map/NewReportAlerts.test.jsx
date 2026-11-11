import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewReportAlerts from './NewReportAlerts';
import { playReportSounds, playReportSound, unlockAudio, useAudioState } from './reportSounds';

jest.mock('./reportSounds', () => ({
  playReportSounds: jest.fn(() => true),
  playReportSound: jest.fn(() => true),
  unlockAudio: jest.fn(() => Promise.resolve(true)),
  useAudioState: jest.fn(() => 'ready')
}));

const fire = { id: 7, emergency: 'Fire Emergency', location: 'Blk 7 Lot 3, Sta. Fe', status: 'Received' };
const flood = { id: 8, emergency: 'Flood Emergency', location: 'Blk 2 Lot 1, Sta. Fe', status: 'Received' };
const medical = { id: 3, assistanceType: 'Medical Aid', location: 'Rizal St' };
const theft = { id: 4, crimeType: 'Theft', location: 'Mabini St' };
const props = (over) => ({ emergencyReports: [], assistanceRequests: [], pettyCrimeReports: [], loaded: true, soundOn: true, onOpen: jest.fn(), ...over });

beforeEach(() => {
  // The test setup resets mocks before each test, so set them again here.
  jest.clearAllMocks();
  useAudioState.mockReturnValue('ready');
  unlockAudio.mockImplementation(() => Promise.resolve(true));
  playReportSound.mockImplementation(() => true);
  playReportSounds.mockImplementation(() => true);
});

test('reports already there when the panel loads are not announced', () => {
  render(<NewReportAlerts {...props({ emergencyReports: [flood] })} />);
  expect(screen.queryByText(/New /)).not.toBeInTheDocument();
  expect(playReportSounds).not.toHaveBeenCalled();
});

test('a new emergency shows a notice and plays the emergency sound', () => {
  const p = props({ emergencyReports: [flood] });
  const { rerender } = render(<NewReportAlerts {...p} />);
  rerender(<NewReportAlerts {...p} emergencyReports={[flood, fire]} />);
  expect(screen.getByText('New Fire Emergency')).toBeInTheDocument();
  expect(screen.getByText(/Blk 7 Lot 3/)).toBeInTheDocument();
  expect(playReportSounds).toHaveBeenCalledWith(['emergency']);
  fireEvent.click(screen.getByRole('button', { name: 'See on map' }));
  expect(p.onOpen).toHaveBeenCalledWith('emergency-7');
});

test('each kind has its own sound: assistance and petty crime arriving together play both', () => {
  const p = props();
  const { rerender } = render(<NewReportAlerts {...p} />);
  rerender(<NewReportAlerts {...p} assistanceRequests={[medical]} pettyCrimeReports={[theft]} />);
  expect(playReportSounds).toHaveBeenCalledTimes(1);
  expect(playReportSounds.mock.calls[0][0]).toEqual(['assistance', 'pettyCrime']);
});

test('the same report is announced only once, even when the lists reload or its status changes', () => {
  const p = props();
  const { rerender } = render(<NewReportAlerts {...p} />);
  rerender(<NewReportAlerts {...p} emergencyReports={[fire]} />);
  rerender(<NewReportAlerts {...p} emergencyReports={[{ ...fire }]} />);
  rerender(<NewReportAlerts {...p} emergencyReports={[{ ...fire, status: 'In Progress' }]} />);
  expect(playReportSounds).toHaveBeenCalledTimes(1);
  expect(screen.getAllByText('New Fire Emergency')).toHaveLength(1);
});

test('with the sound off there is a notice but no sound', () => {
  const p = props({ soundOn: false });
  const { rerender } = render(<NewReportAlerts {...p} />);
  rerender(<NewReportAlerts {...p} assistanceRequests={[medical]} />);
  expect(screen.getByText('New Medical Aid')).toBeInTheDocument();
  expect(playReportSounds).not.toHaveBeenCalled();
});

test('when the browser blocks sound, the notice offers to turn it on and then plays that report\'s sound', async () => {
  useAudioState.mockReturnValue('blocked');
  playReportSounds.mockReturnValueOnce(false);
  const p = props();
  const { rerender } = render(<NewReportAlerts {...p} />);
  rerender(<NewReportAlerts {...p} pettyCrimeReports={[theft]} />);
  fireEvent.click(screen.getByRole('button', { name: /Turn on sound/ }));
  expect(unlockAudio).toHaveBeenCalled();
  await waitFor(() => expect(playReportSound).toHaveBeenCalledWith('pettyCrime'));
});

test('nothing is recorded until the first load has finished', () => {
  const p = props({ loaded: false });
  const { rerender } = render(<NewReportAlerts {...p} />);
  rerender(<NewReportAlerts {...p} loaded emergencyReports={[fire]} />);
  expect(screen.queryByText('New Fire Emergency')).not.toBeInTheDocument();
});
