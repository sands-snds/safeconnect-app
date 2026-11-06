import { render, screen, fireEvent } from '@testing-library/react';
import NewReportAlerts from './NewReportAlerts';
import { playReportChime } from '../../shared/location/mapReports';

jest.mock('../../shared/location/mapReports', () => ({
  ...jest.requireActual('../../shared/location/mapReports'),
  playReportChime: jest.fn()
}));

const fire = { id: 7, emergency: 'Fire Emergency', location: 'Blk 7 Lot 3, Sta. Fe', status: 'Received' };
const flood = { id: 8, emergency: 'Flood Emergency', location: 'Blk 2 Lot 1, Sta. Fe', status: 'Received' };
const props = (over) => ({ emergencyReports: [], assistanceRequests: [], pettyCrimeReports: [], loaded: true, soundOn: true, onOpen: jest.fn(), ...over });

beforeEach(() => playReportChime.mockClear());

test('reports already there when the panel loads are not announced', () => {
  render(<NewReportAlerts {...props({ emergencyReports: [flood] })} />);
  expect(screen.queryByText(/New /)).not.toBeInTheDocument();
  expect(playReportChime).not.toHaveBeenCalled();
});

test('a report that arrives later shows a notice and plays the chime (fire: its own chime)', () => {
  const p = props({ emergencyReports: [flood] });
  const { rerender } = render(<NewReportAlerts {...p} />);
  rerender(<NewReportAlerts {...p} emergencyReports={[flood, fire]} />);
  expect(screen.getByText('New Fire Emergency')).toBeInTheDocument();
  expect(screen.getByText(/Blk 7 Lot 3/)).toBeInTheDocument();
  expect(playReportChime).toHaveBeenCalledWith('fire');
  fireEvent.click(screen.getByRole('button', { name: 'See on map' }));
  expect(p.onOpen).toHaveBeenCalledWith('emergency-7');
});

test('with the sound off there is a notice but no chime', () => {
  const p = props({ soundOn: false });
  const { rerender } = render(<NewReportAlerts {...p} />);
  rerender(<NewReportAlerts {...p} assistanceRequests={[{ id: 3, assistanceType: 'Medical Aid', location: 'Rizal St' }]} />);
  expect(screen.getByText('New Medical Aid')).toBeInTheDocument();
  expect(playReportChime).not.toHaveBeenCalled();
});

test('nothing is recorded until the first load has finished', () => {
  const p = props({ loaded: false });
  const { rerender } = render(<NewReportAlerts {...p} />);
  rerender(<NewReportAlerts {...p} loaded emergencyReports={[fire]} />);
  expect(screen.queryByText('New Fire Emergency')).not.toBeInTheDocument();
});
