import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResidentGlance from './ResidentGlance';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { fetchMyReports } from '../../Services/api';
import { OPEN_RESIDENT_VIEW_EVENT } from './navbar/weatherCodes';

jest.mock('../../Services/api', () => ({ fetchMyReports: jest.fn(), saveLanguagePreference: jest.fn(), fetchMyState: jest.fn(), markItemsRead: jest.fn() }));
jest.mock('./navbar/hooks/useAnnouncements', () => () => ({
  announcements: [{ id: 1, title: 'Water interruption', message: 'Tomorrow 8 AM to 5 PM.', date: new Date().toISOString() }],
  announcementsLoading: false,
  reloadAnnouncements: () => {}
}));
jest.mock('./navbar/hooks/useWeather', () => () => ({ weather: { code: 61, rainChance: 70, tMax: 31, tMin: 25 } }));

beforeEach(() => localStorage.setItem('sf_language', 'en'));

const renderGlance = () => render(<LanguageProvider><ResidentGlance userId={7} /></LanguageProvider>);

test('shows report counts by status, the latest update and the weather', async () => {
  fetchMyReports.mockResolvedValue([
    { status: 'Received' }, { status: 'Pending' }, { status: 'In Progress' }, { status: 'Resolved' }, { status: 'Completed' }, { status: 'Resolved' }
  ]);
  renderGlance();
  await waitFor(() => expect(screen.getAllByText('2')).toHaveLength(1));
  expect(screen.getByText('3')).toBeInTheDocument(); // resolved
  expect(screen.getByText('1')).toBeInTheDocument(); // in progress
  expect(screen.getByText('Water interruption')).toBeInTheDocument();
  expect(screen.getByText('31°C')).toBeInTheDocument();
  expect(fetchMyReports).toHaveBeenCalledWith(7);
});

test('links open My Reports and News', async () => {
  fetchMyReports.mockResolvedValue([]);
  const opened = [];
  const listener = (e) => opened.push(e.detail);
  window.addEventListener(OPEN_RESIDENT_VIEW_EVENT, listener);
  renderGlance();
  expect(await screen.findByText("You haven't sent any reports yet.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /View my reports/ }));
  fireEvent.click(screen.getByRole('button', { name: /See all news/ }));
  expect(opened).toEqual(['reports', 'news']);
  window.removeEventListener(OPEN_RESIDENT_VIEW_EVENT, listener);
});
