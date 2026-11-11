import { render, screen, fireEvent, within } from '@testing-library/react';
import EmergencyReportsTable from './EmergencyReportsTable';

jest.mock('./EmergencyReportDetails', () => () => <p>Report details here</p>);
jest.mock('../../../shared/useReportMedia', () => () => ({ media: null, loading: false, failed: false }));

const REPORTS = [
  { id: 41, reference: 'EM-2026-000041', emergency: 'Fire Emergency', reporter: 'Juan Dela Cruz', location: 'Blk 5 Lot 12, Sampaguita St.', peopleAffected: '4', date: '11/11/2026, 9:42 AM', status: 'Received', reportFor: 'self' },
  { id: 40, reference: 'EM-2026-000040', emergency: 'Flood Emergency', reporter: 'Maria Santos', location: 'Purok 3', peopleAffected: '12', date: '11/11/2026, 8:15 AM', status: 'In Progress', reportFor: 'self' }
];

const renderTable = () => render(
  <EmergencyReportsTable
    data={REPORTS}
    filters={{ emergency: {} }}
    setFilters={() => {}}
    onUpdateStatus={jest.fn()}
    onArchive={jest.fn()}
  />
);

beforeEach(() => localStorage.clear());

test('a table with REPORT ID first and the reports in rows', () => {
  renderTable();
  const heads = screen.getAllByRole('columnheader').map((h) => h.textContent.trim()).filter(Boolean);
  expect(heads).toEqual(['Report ID', 'Type', 'Reporter', 'Location', 'People', 'Filed', 'Status', 'Actions', 'Details']);
  expect(screen.getByText('EM-2026-000041')).toBeInTheDocument();
});

test('rows keep "Move to …"; Dismiss is inside View details', () => {
  renderTable();
  const row = screen.getByText('EM-2026-000041').closest('tr');
  expect(within(row).getByRole('button', { name: /Move to In Progress/ })).toBeInTheDocument();
  expect(within(row).queryByRole('button', { name: /Dismiss/ })).toBeNull();

  fireEvent.click(within(row).getByRole('button', { name: /View details/ }));
  expect(screen.getByText('Report details here')).toBeInTheDocument();
  const details = screen.getByText('Report details here').closest('tr');
  expect(within(details).getByRole('button', { name: /Dismiss/ })).toBeInTheDocument();
});

test('a column can be resized (here with the keyboard) and is remembered', () => {
  const { container } = renderTable();
  const handle = screen.getByRole('separator', { name: 'Resize the Location column' });
  fireEvent.keyDown(handle, { key: 'ArrowRight' });
  const cols = container.querySelectorAll('colgroup col');
  // accent, Report ID, Type, Reporter, Location…
  expect(cols[4].style.width).toBe('256px');
  expect(JSON.parse(localStorage.getItem('sc_report_columns_emergency')).location).toBe(256);
});
