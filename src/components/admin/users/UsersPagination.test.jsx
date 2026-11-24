import { render, screen, fireEvent, within } from '@testing-library/react';
import RegisteredUsersTable from './RegisteredUsersTable';
import AccountVerificationPage from './AccountVerificationPage';
import AdminLogsTable from '../logs/AdminLogsTable';
import { fetchVerifications, fetchAdminLogs, fetchLogArchiveSettings } from '../../../Services/api';

jest.mock('../../../Services/api', () => ({
  fetchVerifications: jest.fn(),
  fetchValidIdBlob: jest.fn(),
  decideVerification: jest.fn(),
  fetchAdminLogs: jest.fn(),
  fetchLogArchiveSettings: jest.fn(),
  updateLogArchiveSettings: jest.fn()
}));
jest.mock('../shared/GenerateReportButton', () => () => null);

beforeEach(() => {
  localStorage.clear();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
  fetchAdminLogs.mockResolvedValue({ activity: [] });
  fetchLogArchiveSettings.mockResolvedValue(null);
});

const user = (i, role = 'resident') => ({
  id: `${role}-${i}`, fullName: `${role === 'resident' ? 'Resident' : 'Staff'} ${i}`, email: `${role}${i}@example.com`,
  role, status: 'Active', dateRegistered: '2026-11-01'
});
const renderUsers = (residents, staff) => render(
  <RegisteredUsersTable
    residents={residents}
    staff={staff}
    filters={{ users: { search: '', status: 'All Items' } }}
    setFilters={jest.fn()}
    onUpdateStatus={jest.fn()}
    onUpdateRole={jest.fn()}
    currentAdminId="none"
  />
);
const sectionOf = (titleText) => screen.getByRole('heading', { name: titleText }).closest('.admin-section');

describe('Users tab', () => {
  test('each table shows 5 accounts at a time, with no rows-per-page choice', () => {
    renderUsers(Array.from({ length: 12 }, (_, i) => user(i + 1)), Array.from({ length: 7 }, (_, i) => user(i + 1, 'official')));
    const residents = sectionOf('Residents (12)');
    expect(within(residents).getAllByRole('row')).toHaveLength(6); // header + 5
    expect(screen.getByText('Showing 1–5 of 12 residents')).toBeInTheDocument();
    expect(screen.getByText('Showing 1–5 of 7 accounts')).toBeInTheDocument();
    expect(screen.queryByText('Rows per page')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Next page' })[0]);
    expect(screen.getByText('Showing 6–10 of 12 residents')).toBeInTheDocument();
    expect(within(residents).getByText('Resident 6')).toBeInTheDocument();
    expect(within(residents).queryByText('Resident 1')).not.toBeInTheDocument();
    // The other table keeps its own page.
    expect(screen.getByText('Showing 1–5 of 7 accounts')).toBeInTheDocument();
  });

  test('Residents and Admins & Officials can each be hidden, and stay hidden', () => {
    const { unmount } = renderUsers([user(1)], [user(1, 'official')]);
    const hide = screen.getByRole('button', { name: 'Hide table: Residents (1)' });
    expect(hide).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(hide);
    expect(screen.queryByText('Resident 1')).not.toBeVisible();
    expect(screen.queryByText('Showing 1–1 of 1 residents')).not.toBeInTheDocument();
    expect(screen.getByText('Staff 1')).toBeVisible();
    unmount();

    renderUsers([user(1)], [user(1, 'official')]);
    expect(screen.getByRole('button', { name: 'Show table: Residents (1)' })).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Show table: Residents (1)' }));
    expect(screen.getByText('Resident 1')).toBeVisible();
  });
});

describe('Account verification', () => {
  test('shows 6 registrations at a time; changing tab goes back to page 1', async () => {
    fetchVerifications.mockResolvedValue(Array.from({ length: 14 }, (_, i) => ({
      id: i + 1, fullName: `Applicant ${i + 1}`, email: `a${i + 1}@example.com`, verificationStatus: 'Pending', createdAt: '2026-11-20T08:00:00Z'
    })));
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    render(<AccountVerificationPage />);
    await screen.findByText('Applicant 1');
    expect(document.querySelectorAll('.av-card')).toHaveLength(6);
    expect(screen.getByText('Showing 1–6 of 14 registrations')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(document.querySelectorAll('.av-card')).toHaveLength(2);
    expect(screen.getByText('Applicant 13')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Search registrations'), { target: { value: 'Applicant 1' } });
    expect(screen.getByText('Showing 1–6 of 6 registrations')).toBeInTheDocument();
  });
});

describe('Admin logs', () => {
  test('the accounts table and the activity log can each be hidden', () => {
    render(<AdminLogsTable admins={[{ id: 1, username: 'kap', email: 'kap@example.com', role: 'admin' }]} activity={[]} filters={{ adminLogs: {} }} setFilters={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hide table: Admin & Official Accounts' }));
    expect(screen.getByText('kap@example.com', { selector: 'div' })).not.toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Hide table: Activity Log' }));
    expect(screen.getByPlaceholderText(/Search activity/)).not.toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Show table: Admin & Official Accounts' }));
    expect(screen.getByText('kap@example.com', { selector: 'div' })).toBeVisible();
  });
});

