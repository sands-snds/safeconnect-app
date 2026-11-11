import { render, screen } from '@testing-library/react';
import EmergencyReportDetails from '../emergency/EmergencyReportDetails';
import PettyCrimeReportDetails from '../pettyCrime/PettyCrimeReportDetails';

jest.mock('./ReportLocationMap', () => () => <div>Map here</div>);
jest.mock('../../../shared/useReportMedia', () => () => ({ media: null, loading: false, failed: false }));

const REPORT = {
  id: 41,
  reference: 'EM-2026-000041',
  emergency: 'Fire Emergency',
  reporter: 'Juan Dela Cruz',
  phone: '09171234567',
  location: 'Blk 5 Lot 12, Sampaguita St.',
  peopleAffected: '4',
  specialNeeds: 'Wheelchair user',
  description: 'Smoke coming from the kitchen of the house next door.',
  date: '11/11/2026, 9:42 AM',
  status: 'Received',
  reportFor: 'self',
  latitude: 14.3,
  longitude: 120.95
};

test('the description comes first, with the actions beside it, before the map', () => {
  const { container } = render(
    <EmergencyReportDetails report={REPORT} actions={<button type="button">Dismiss</button>} />
  );
  const text = container.textContent;
  const desc = text.indexOf(REPORT.description);
  expect(desc).toBeGreaterThanOrEqual(0);
  expect(desc).toBeLessThan(text.indexOf('Dismiss'));
  expect(text.indexOf('Dismiss')).toBeLessThan(text.indexOf('Map here'));
  expect(text.indexOf('Contact Number')).toBeGreaterThan(desc);
});

test('only shows what the table row does not', () => {
  render(<EmergencyReportDetails report={REPORT} />);
  expect(screen.getByText('09171234567')).toBeInTheDocument();
  expect(screen.getByText('Wheelchair user')).toBeInTheDocument();
  expect(screen.queryByText('Juan Dela Cruz')).toBeNull();
  expect(screen.queryByText('Blk 5 Lot 12, Sampaguita St.')).toBeNull();
  expect(screen.queryByText('Fire Emergency')).toBeNull();
  expect(screen.queryByText('11/11/2026, 9:42 AM')).toBeNull();
});

test('a missing description says so instead of leaving a blank', () => {
  render(<EmergencyReportDetails report={{ ...REPORT, description: '' }} />);
  expect(screen.getByText('No description was given.')).toBeInTheDocument();
});

test('a dismissed report shows why at the top', () => {
  const { container } = render(
    <EmergencyReportDetails report={{ ...REPORT, status: 'Dismissed', dismissalReason: 'Prank call' }} />
  );
  const text = container.textContent;
  expect(text.indexOf('Prank call')).toBeLessThan(text.indexOf(REPORT.description));
});

test('petty crime shows the suspect, and hides the contact when anonymous', () => {
  render(<PettyCrimeReportDetails report={{ ...REPORT, isAnonymous: true, suspectInfo: 'Tall, red cap' }} />);
  expect(screen.getByText('Tall, red cap')).toBeInTheDocument();
  expect(screen.queryByText('09171234567')).toBeNull();
});
