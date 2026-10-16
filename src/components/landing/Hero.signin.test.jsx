import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Hero from './Hero';
import TermsModal from '../shared/TermsModal';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { signinUser } from '../../Services/api';

jest.mock('../../Services/api', () => ({
  signinUser: jest.fn(),
  setAuthToken: jest.fn(),
  fetchSiteContent: jest.fn()
}));
jest.mock('../shared/useSiteContent', () => {
  const actual = jest.requireActual('../shared/useSiteContent');
  return { ...actual, __esModule: true, default: () => actual.DEFAULT_SITE_CONTENT };
});

// CRA resets mock implementations before each test, so set them here.
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('sf_language', 'en');
  window.history.replaceState(null, '', '/');
  // A wrong-password answer: proves the request was sent without navigating away.
  signinUser.mockResolvedValue({ success: false, message: 'Invalid email or password.' });
});

const openSignIn = () => {
  render(
    <LanguageProvider>
      <Hero />
      <TermsModal />
    </LanguageProvider>
  );
  fireEvent.click(screen.getAllByRole('button', { name: 'Sign In' })[0]);
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'juan@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Secret123!' } });
  return {
    checkbox: screen.getByRole('checkbox', { name: /I have read and agree to the Terms and Conditions/ }),
    // The hero's own "Sign In" button is also type=submit; use the one in the form.
    submit: () => fireEvent.click(document.querySelector('form button[type="submit"]'))
  };
};

test('shows the agreement checkbox, unticked, with a hint until the Terms are opened', () => {
  const { checkbox } = openSignIn();
  expect(checkbox).not.toBeChecked();
  expect(screen.getByText('Open the Terms and Conditions to enable this checkbox.')).toBeInTheDocument();
});

test('before the Terms are opened: sign-in is blocked', async () => {
  const { submit } = openSignIn();
  submit();
  expect(await screen.findByText('Please read the Terms and Conditions before signing in.')).toBeInTheDocument();
  expect(signinUser).not.toHaveBeenCalled();
});

test('before the Terms are opened: clicking the checkbox opens the Terms instead of ticking it', async () => {
  const { checkbox } = openSignIn();
  fireEvent.click(checkbox);
  expect(checkbox).not.toBeChecked();
  expect(await screen.findByRole('dialog', { name: 'Terms and Conditions' })).toBeInTheDocument();
});

test('after viewing the Terms but without ticking: sign-in is blocked', async () => {
  const { checkbox, submit } = openSignIn();
  fireEvent.click(checkbox); // opens the Terms
  fireEvent.click(await screen.findByRole('button', { name: /I Understand/ }));
  expect(screen.queryByText('Open the Terms and Conditions to enable this checkbox.')).not.toBeInTheDocument();
  submit();
  expect(await screen.findByText('You must agree to the Terms and Conditions to sign in.')).toBeInTheDocument();
  expect(signinUser).not.toHaveBeenCalled();
});

test('after viewing the Terms and ticking the box: sign-in goes through', async () => {
  const { checkbox, submit } = openSignIn();
  // The link in the label (jsdom doesn't follow links, so set the hash it points to)
  expect(screen.getByRole('link', { name: 'Terms and Conditions' })).toHaveAttribute('href', '#terms');
  act(() => { window.location.hash = '#terms'; });
  fireEvent.click(await screen.findByRole('button', { name: 'Close' }));
  fireEvent.click(checkbox);
  expect(checkbox).toBeChecked();
  submit();
  await waitFor(() => expect(signinUser).toHaveBeenCalledWith('juan@example.com', 'Secret123!'));
});

test('Terms viewed on an earlier visit (same version): box can be ticked straight away', async () => {
  localStorage.setItem('sf_terms_viewed', '2026-10-16');
  const { checkbox, submit } = openSignIn();
  fireEvent.click(checkbox);
  expect(checkbox).toBeChecked();
  submit();
  await waitFor(() => expect(signinUser).toHaveBeenCalledTimes(1));
});

test('an older Terms version counts as not viewed', async () => {
  localStorage.setItem('sf_terms_viewed', '2020-01-01');
  const { checkbox, submit } = openSignIn();
  fireEvent.click(checkbox);
  expect(checkbox).not.toBeChecked();
  submit();
  expect(await screen.findByText('Please read the Terms and Conditions before signing in.')).toBeInTheDocument();
});

test('the box starts unticked again each time Sign In is reopened', () => {
  localStorage.setItem('sf_terms_viewed', '2026-10-16');
  const { checkbox } = openSignIn();
  fireEvent.click(checkbox);
  expect(checkbox).toBeChecked();
  fireEvent.click(document.querySelector('.modal-header .btn-close'));
  fireEvent.click(screen.getAllByRole('button', { name: 'Sign In' })[0]);
  expect(screen.getByRole('checkbox', { name: /I have read and agree/ })).not.toBeChecked();
});
