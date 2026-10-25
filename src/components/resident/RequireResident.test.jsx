import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import RequireResident from './RequireResident';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { fetchCurrentUser, clearAuthToken, SESSION_EXPIRED_EVENT } from '../../Services/api';

jest.mock('../../Services/api', () => ({
  fetchCurrentUser: jest.fn(),
  clearAuthToken: jest.fn(),
  SESSION_EXPIRED_EVENT: 'safeconnect:session-expired'
}));

const USER = { id: 7, fullName: 'Juan Dela Cruz', email: 'juan@example.com', role: 'resident' };

const Home = () => {
  const location = useLocation();
  return <p>Home page {location.search}</p>;
};

const renderAt = () => render(
  <LanguageProvider>
    <MemoryRouter initialEntries={['/resident']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/resident" element={<RequireResident><p>Resident page (protected)</p></RequireResident>} />
      </Routes>
    </MemoryRouter>
  </LanguageProvider>
);

beforeEach(() => {
  localStorage.setItem('sf_language', 'en');
  sessionStorage.clear();
});

test('shows nothing protected while the server is checking', () => {
  fetchCurrentUser.mockReturnValue(new Promise(() => {})); // never answers
  renderAt();
  expect(screen.getByText('Checking your sign-in...')).toBeInTheDocument();
  expect(screen.queryByText('Resident page (protected)')).not.toBeInTheDocument();
});

test('not signed in: redirected to Sign In, page never shown', async () => {
  fetchCurrentUser.mockResolvedValue({ success: false, message: 'Access denied. No token provided.' });
  renderAt();
  expect(await screen.findByText('Home page ?signin=required')).toBeInTheDocument();
  expect(screen.queryByText('Resident page (protected)')).not.toBeInTheDocument();
  expect(clearAuthToken).toHaveBeenCalled();
});

test('token rejected by the server (expired, tampered, suspended account): redirected and signed out', async () => {
  sessionStorage.setItem('currentUser', JSON.stringify(USER));
  sessionStorage.setItem('userAuthenticated', 'true');
  fetchCurrentUser.mockResolvedValue({ success: false, message: 'Invalid token.' });
  renderAt();
  expect(await screen.findByText('Home page ?signin=required')).toBeInTheDocument();
  expect(sessionStorage.getItem('currentUser')).toBeNull();
  expect(sessionStorage.getItem('userAuthenticated')).toBeNull();
  expect(clearAuthToken).toHaveBeenCalled();
});

test('signed in: shows the page and refreshes the stored user from the server', async () => {
  fetchCurrentUser.mockResolvedValue({ success: true, user: USER });
  renderAt();
  expect(await screen.findByText('Resident page (protected)')).toBeInTheDocument();
  expect(JSON.parse(sessionStorage.getItem('currentUser'))).toEqual(USER);
  expect(sessionStorage.getItem('userAuthenticated')).toBe('true');
});

test('server unreachable: does not let anyone in, offers Try Again', async () => {
  fetchCurrentUser.mockResolvedValueOnce({ success: false, offline: true });
  renderAt();
  expect(await screen.findByText("Couldn't verify your sign-in")).toBeInTheDocument();
  expect(screen.queryByText('Resident page (protected)')).not.toBeInTheDocument();
  fetchCurrentUser.mockResolvedValueOnce({ success: true, user: USER });
  fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
  expect(await screen.findByText('Resident page (protected)')).toBeInTheDocument();
});

test('sign-in lost while on the page (any API call finds it invalid): sent back to Sign In', async () => {
  fetchCurrentUser.mockResolvedValue({ success: true, user: USER });
  renderAt();
  await screen.findByText('Resident page (protected)');
  act(() => { window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT)); });
  await waitFor(() => expect(screen.getByText('Home page ?signin=required')).toBeInTheDocument());
  expect(screen.queryByText('Resident page (protected)')).not.toBeInTheDocument();
});
