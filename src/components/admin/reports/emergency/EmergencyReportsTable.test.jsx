import { render, screen, fireEvent, within } from '@testing-library/react';
import EmergencyReportsTable from './EmergencyReportsTable';

jest.mock('./EmergencyReportDetails', () => ({ actions }) => <div><p>Report details here</p>{actions}</div>);
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

test('the reporter comes first, with the report ID above the name; no separate ID column', () => {
  renderTable();
  const heads = screen.getAllByRole('columnheader').map((h) => h.textContent.trim()).filter(Boolean);
  expect(heads).toEqual(['Reporter', 'Type', 'Location', 'People', 'Filed', 'Status', 'Actions', 'Details']);
  const cell = screen.getByText('EM-2026-000041').closest('td');
  expect(within(cell).getByText('Juan Dela Cruz')).toBeInTheDocument();
});

test('rows keep "Move to …"; Dismiss is inside View details', () => {
  renderTable();
  const row = screen.getByText('EM-2026-000041').closest('tr');
  expect(within(row).getByRole('button', { name: /Move to In Progress/ })).toBeInTheDocument();
  expect(within(row).queryByRole('button', { name: /Dismiss/ })).toBeNull();

  fireEvent.click(within(row).getByRole('button', { name: /View details/ }));
  const details = screen.getByText('Report details here').closest('tr');
  expect(within(details).getByRole('button', { name: /Dismiss/ })).toBeInTheDocument();
});

test('Location takes the leftover space, so it has no resize handle', () => {
  renderTable();
  expect(screen.queryByRole('separator', { name: 'Resize the Location column' })).toBeNull();
});

test('a column can be resized, is remembered, and stops at its limit', () => {
  const { container } = renderTable();
  const handle = screen.getByRole('separator', { name: 'Resize the Type column' });
  fireEvent.keyDown(handle, { key: 'ArrowRight' });
  const typeCol = container.querySelectorAll('colgroup col')[2]; // accent, Reporter, Type
  expect(typeCol.style.width).toBe('166px');
  expect(JSON.parse(localStorage.getItem('sc_report_columns_emergency')).type).toBe(166);

  for (let i = 0; i < 40; i += 1) fireEvent.keyDown(handle, { key: 'ArrowRight' });
  expect(typeCol.style.width).toBe('375px'); // 2½ × its normal 150 px
});
