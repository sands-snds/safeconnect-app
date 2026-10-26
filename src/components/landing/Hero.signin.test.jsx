import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Hero from './Hero';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { signinUser, fetchSiteContent, setAuthToken, rememberLogin } from '../../Services/api';

jest.mock('../../Services/api', () => ({
  signinUser: jest.fn(),
  rememberLogin: jest.fn(),
  setAuthToken: jest.fn(),
  fetchSiteContent: jest.fn(),
  saveLanguagePreference: jest.fn(),
  fetchMyState: jest.fn(),
  markItemsRead: jest.fn()
}));
jest.mock('../shared/useSiteContent', () => {
  const actual = jest.requireActual('../shared/useSiteContent');
  return { ...actual, __esModule: true, default: () => actual.DEFAULT_SITE_CONTENT };
});
jest.mock('../admin/AdminModals/AdminDemoPopup', () => ({ markAdminJustSignedIn: jest.fn() }));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('sf_language', 'en');
  window.history.replaceState(null, '', '/');
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ success: true }) }));
  fetchSiteContent.mockResolvedValue({});
  jest.spyOn(console, 'error').mockImplementation(() => {}); // jsdom: "navigation not implemented"
});
afterEach(() => console.error.mockRestore());

const signIn = () => {
  render(<LanguageProvider><Hero /></LanguageProvider>);
  fireEvent.click(screen.getAllByRole('button', { name: 'Sign In' })[0]);
  fireEvent.change(document.querySelector('#siEmail'), { target: { value: 'person@example.com' } });
  fireEvent.change(document.querySelector('#siPassword'), { target: { value: 'Secret123!' } });
  fireEvent.click(document.querySelector('form button[type="submit"]'));
};

test('admins are not asked to save their login', async () => {
  signinUser.mockResolvedValue({ success: true, isAdmin: true, token: 'admin.token', user: { id: 1, role: 'admin' } });
  signIn();
  await waitFor(() => expect(setAuthToken).toHaveBeenCalledWith('admin.token', true, false));
  expect(screen.queryByText('Save your login info?')).not.toBeInTheDocument();
  expect(rememberLogin).not.toHaveBeenCalled();
  expect(sessionStorage.getItem('adminAuthenticated')).toBe('true');
});

test('residents are still asked to save their login', async () => {
  signinUser.mockResolvedValue({ success: true, isAdmin: false, token: 'resident.token', user: { id: 7, fullName: 'Juan', role: 'resident' } });
  signIn();
  expect(await screen.findByText('Save your login info?')).toBeInTheDocument();
  expect(setAuthToken).not.toHaveBeenCalled();
});
