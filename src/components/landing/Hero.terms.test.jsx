import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import Hero from './Hero';
import TermsModal from '../shared/TermsModal';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { signinUser, fetchSiteContent, setAuthToken, rememberLogin } from '../../Services/api';

jest.mock('../../Services/api', () => ({
  signinUser: jest.fn(),
  rememberLogin: jest.fn(),
  setAuthToken: jest.fn(),
  fetchSiteContent: jest.fn()
}));
jest.mock('../shared/useSiteContent', () => {
  const actual = jest.requireActual('../shared/useSiteContent');
  return { ...actual, __esModule: true, default: () => actual.DEFAULT_SITE_CONTENT };
});

const VIEW_FIRST = 'Please read the Terms and Conditions before creating an account.';
const MUST_AGREE = 'You must agree to the Terms and Conditions to create an account.';

// CRA resets mock implementations before each test, so set them here.
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('sf_language', 'en');
  window.history.replaceState(null, '', '/');
  // Sign-up step 1 asks the server to email a verification code.
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ success: true }) }));
  signinUser.mockResolvedValue({ success: false, message: 'Invalid email or password.' });
  // The landing page also refreshes site content (carousel, contacts) on load.
  fetchSiteContent.mockResolvedValue({});
});

const renderHero = () => render(
  <LanguageProvider>
    <Hero />
    <TermsModal />
  </LanguageProvider>
);

// Opens Sign Up and fills every field validly, so only the Terms rule decides.
const openSignUp = () => {
  renderHero();
  fireEvent.click(screen.getAllByRole('button', { name: 'Sign Up' })[0]);
  const type = (placeholder, value) => fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
  type('First name', 'Juan');
  type('Last name', 'Dela Cruz');
  type('Choose a username', 'juandc');
  type('9XXXXXXXXX', '9171234567');
  type('Enter your email', 'juan@example.com');
  type('Min. 8 characters', 'Secret123!');
  type('Confirm your password', 'Secret123!');
  return {
    checkbox: screen.getByRole('checkbox', { name: /I have read and agree to the Terms and Conditions/ }),
    // The hero's own buttons are also type=submit; use the one in the form.
    submit: () => fireEvent.click(document.querySelector('form button[type="submit"]'))
  };
};

const otpRequested = () => global.fetch.mock.calls.some(([url]) => String(url).endsWith('/auth/request-otp'));

describe('Sign Up', () => {
  test('shows the agreement checkbox, unticked, with a hint until the Terms are opened', () => {
    const { checkbox } = openSignUp();
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText('Open the Terms and Conditions to enable this checkbox.')).toBeInTheDocument();
  });

  test('Terms not opened: account creation is blocked', async () => {
    const { submit } = openSignUp();
    submit();
    expect(await screen.findByText(VIEW_FIRST)).toBeInTheDocument();
    expect(otpRequested()).toBe(false);
  });

  test('Terms not opened: clicking the checkbox opens the Terms instead of ticking it', async () => {
    const { checkbox } = openSignUp();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(await screen.findByRole('dialog', { name: 'Terms and Conditions' })).toBeInTheDocument();
  });

  test('Terms opened but box not ticked: account creation is blocked', async () => {
    const { checkbox, submit } = openSignUp();
    fireEvent.click(checkbox); // opens the Terms
    fireEvent.click(await screen.findByRole('button', { name: 'I Understand' }));
    expect(screen.queryByText('Open the Terms and Conditions to enable this checkbox.')).not.toBeInTheDocument();
    submit();
    expect(await screen.findByText(MUST_AGREE)).toBeInTheDocument();
    expect(otpRequested()).toBe(false);
  });

  test('Terms opened (via the link) and box ticked: continues to email verification', async () => {
    const { checkbox, submit } = openSignUp();
    expect(screen.getByRole('link', { name: 'Terms and Conditions' })).toHaveAttribute('href', '#terms');
    act(() => { window.location.hash = '#terms'; }); // what following the link does
    const terms = await screen.findByRole('dialog', { name: 'Terms and Conditions' });
    fireEvent.click(within(terms).getByRole('button', { name: 'Close' }));
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    submit();
    await waitFor(() => expect(otpRequested()).toBe(true));
    expect(await screen.findByRole('dialog', { name: 'Verify Your Email' })).toBeInTheDocument();
  });

  test('Terms viewed on an earlier visit (same version): box can be ticked straight away', async () => {
    localStorage.setItem('sf_terms_viewed', '2026-10-16');
    const { checkbox, submit } = openSignUp();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    submit();
    await waitFor(() => expect(otpRequested()).toBe(true));
  });

  test('an older Terms version counts as not viewed', async () => {
    localStorage.setItem('sf_terms_viewed', '2020-01-01');
    const { checkbox, submit } = openSignUp();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    submit();
    expect(await screen.findByText(VIEW_FIRST)).toBeInTheDocument();
    expect(otpRequested()).toBe(false);
  });

  test('the box starts unticked again each time Sign Up is reopened', () => {
    localStorage.setItem('sf_terms_viewed', '2026-10-16');
    const { checkbox } = openSignUp();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign Up' })[0]);
    expect(screen.getByRole('checkbox', { name: /I have read and agree/ })).not.toBeChecked();
  });
});

describe('Sign In', () => {
  test('has no Terms checkbox and signs in without one', async () => {
    renderHero();
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign In' })[0]);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'juan@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Secret123!' } });
    fireEvent.click(document.querySelector('form button[type="submit"]'));
    await waitFor(() => expect(signinUser).toHaveBeenCalledWith('juan@example.com', 'Secret123!'));
  });
});

describe('Save Login Info', () => {
  const signIn = async () => {
    renderHero();
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign In' })[0]);
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'juan@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Secret123!' } });
    fireEvent.click(document.querySelector('form button[type="submit"]'));
    return screen.findByRole('dialog', { name: 'Save your login info?' });
  };

  beforeEach(() => {
    signinUser.mockResolvedValue({
      success: true, isAdmin: false, token: 'session-token',
      user: { id: 7, fullName: 'Juan Dela Cruz', username: 'juandc', email: 'juan@example.com', role: 'resident' }
    });
  });

  test('after a successful sign-in, asks whether to save the login (nothing stored yet)', async () => {
    const dialog = await signIn();
    expect(dialog).toHaveTextContent('30 days');
    expect(dialog).toHaveTextContent('never on a shared or public computer');
    expect(screen.getByRole('button', { name: 'Yes, save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
    expect(setAuthToken).not.toHaveBeenCalled();
  });

  test('No: keeps the sign-in for this browser session only', async () => {
    await signIn();
    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    await waitFor(() => expect(setAuthToken).toHaveBeenCalledWith('session-token', false, false));
    expect(rememberLogin).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem('currentUser')).id).toBe(7);
  });

  test('Yes: exchanges it for a saved login and stores that', async () => {
    rememberLogin.mockResolvedValue({ success: true, token: 'saved-token' });
    await signIn();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, save' }));
    await waitFor(() => expect(setAuthToken).toHaveBeenCalledWith('saved-token', false, true));
    expect(rememberLogin).toHaveBeenCalledWith('session-token');
  });

  test('Yes, but saving fails: still signed in for this session', async () => {
    rememberLogin.mockResolvedValue({ success: false });
    await signIn();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, save' }));
    await waitFor(() => expect(setAuthToken).toHaveBeenCalledWith('session-token', false, false));
  });

  test('closing the question counts as No', async () => {
    await signIn();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(setAuthToken).toHaveBeenCalledWith('session-token', false, false));
  });

  test('a failed sign-in shows the error and never asks', async () => {
    signinUser.mockResolvedValue({ success: false, message: 'Invalid email or password.' });
    renderHero();
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign In' })[0]);
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'juan@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(document.querySelector('form button[type="submit"]'));
    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Save your login info?' })).not.toBeInTheDocument();
  });
});

describe('Sign Up layout', () => {
  test('password requirements stay hidden until a password is typed', () => {
    renderHero();
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign Up' })[0]);
    expect(screen.queryByRole('list', { name: 'Password requirements' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: 'S' } });
    expect(screen.getByRole('list', { name: 'Password requirements' })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Min. 8 characters'), { target: { value: '' } });
    expect(screen.queryByRole('list', { name: 'Password requirements' })).not.toBeInTheDocument();
  });

  test('no section headings', () => {
    renderHero();
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign Up' })[0]);
    for (const heading of ['Personal information', 'Contact details', 'Account security']) {
      expect(screen.queryByText(heading)).not.toBeInTheDocument();
    }
  });
});
