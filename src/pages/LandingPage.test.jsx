import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import { LanguageProvider } from '../i18n/LanguageContext';
import { fetchCurrentUser, hasStoredToken } from '../Services/api';

// The page's sections aren't under test (and pull in the map/carousel).
jest.mock('../components/landing/Navbar', () => () => null);
jest.mock('../components/landing/Hero', () => () => <p>Home page</p>);
jest.mock('../components/landing/Services', () => () => null);
jest.mock('../components/landing/DemoVideoSection', () => () => null);
jest.mock('../components/landing/Contact', () => () => null);
jest.mock('../components/landing/About', () => () => null);
jest.mock('../components/shared/DonationFooter', () => () => null);
jest.mock('../Services/api', () => ({ fetchCurrentUser: jest.fn(), hasStoredToken: jest.fn() }));

const renderAt = (entry) => render(
  <LanguageProvider>
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/resident" element={<p>Resident page</p>} />
      </Routes>
    </MemoryRouter>
  </LanguageProvider>
);

beforeEach(() => {
  localStorage.setItem('sf_language', 'en');
  sessionStorage.clear();
});

test('right after logging out: shows the home page, checks nothing, goes nowhere', async () => {
  hasStoredToken.mockReturnValue(true); // e.g. an old admin sign-in still in storage
  renderAt({ pathname: '/', state: { signedOut: true } });
  expect(await screen.findByText('Home page')).toBeInTheDocument();
  expect(fetchCurrentUser).not.toHaveBeenCalled();
});

test('a confirmed resident sign-in goes to /resident', async () => {
  hasStoredToken.mockImplementation((admin) => !admin);
  fetchCurrentUser.mockResolvedValue({ success: true, isAdmin: false, user: { id: 7, fullName: 'Juan' } });
  renderAt('/');
  expect(await screen.findByText('Resident page')).toBeInTheDocument();
  expect(fetchCurrentUser).toHaveBeenCalledWith({ admin: false });
});

test('a stored admin sign-in that is NOT a confirmed admin (e.g. a resident) is never sent to /admin', async () => {
  hasStoredToken.mockImplementation((admin) => admin);
  fetchCurrentUser.mockResolvedValue({ success: true, isAdmin: false, user: { id: 7 } });
  renderAt('/');
  expect(await screen.findByText('Home page')).toBeInTheDocument();
  expect(fetchCurrentUser).toHaveBeenCalledWith({ admin: true });
});

test('a rejected / expired admin sign-in leaves you on the home page', async () => {
  hasStoredToken.mockImplementation((admin) => admin);
  fetchCurrentUser.mockResolvedValue({ success: false, message: 'Invalid token.' });
  renderAt('/');
  expect(await screen.findByText('Home page')).toBeInTheDocument();
});

test('no sign-in stored: home page right away', async () => {
  hasStoredToken.mockReturnValue(false);
  renderAt('/');
  expect(await screen.findByText('Home page')).toBeInTheDocument();
  await waitFor(() => expect(fetchCurrentUser).not.toHaveBeenCalled());
});
