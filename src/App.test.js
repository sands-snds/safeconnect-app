import { render, screen } from '@testing-library/react';
import App from './App';
import { fetchCurrentUser } from './Services/api';




jest.mock('./pages/LandingPage', () => () => <p>Landing page</p>);
jest.mock('./pages/AdminPage', () => () => <p>Admin page</p>);
jest.mock('./pages/ResidentPage', () => () => <p>Resident page (protected)</p>);
jest.mock('./Services/api', () => ({
  fetchCurrentUser: jest.fn(),
  clearAuthToken: jest.fn(),
  SESSION_EXPIRED_EVENT: 'safeconnect:session-expired'
}));

beforeEach(() => {
  localStorage.setItem('sf_language', 'en'); // skip the first-visit language chooser
  sessionStorage.clear();
});

test('typing /resident while signed out lands on the home page with Sign In requested', async () => {
  window.history.pushState({}, '', '/resident');
  fetchCurrentUser.mockResolvedValue({ success: false, message: 'Access denied. No token provided.' });
  render(<App />);
  expect(await screen.findByText('Landing page')).toBeInTheDocument();
  expect(window.location.pathname).toBe('/');
  expect(window.location.search).toBe('?signin=required');
  expect(screen.queryByText('Resident page (protected)')).not.toBeInTheDocument();
});

test('/resident opens once the server confirms the sign-in', async () => {
  window.history.pushState({}, '', '/resident');
  fetchCurrentUser.mockResolvedValue({ success: true, user: { id: 7, fullName: 'Juan Dela Cruz' } });
  render(<App />);
  expect(await screen.findByText('Resident page (protected)')).toBeInTheDocument();
  expect(window.location.pathname).toBe('/resident');
});

test('the public home page needs no sign-in', async () => {
  window.history.pushState({}, '', '/');
  render(<App />);
  expect(await screen.findByText('Landing page')).toBeInTheDocument();
});
