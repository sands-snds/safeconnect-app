import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Hero from './Hero';
import { TERMS_VERSION } from '../shared/termsConsent';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { signinUser, fetchSiteContent } from '../../Services/api';

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

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('sf_language', 'en');
  window.history.replaceState(null, '', '/');
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ success: true }) }));
  fetchSiteContent.mockResolvedValue({});
});

const renderHero = () => render(<LanguageProvider><Hero /></LanguageProvider>);
const submit = () => fireEvent.click(document.querySelector('form button[type="submit"]'));
const field = (id) => document.getElementById(id);
const errorOf = (id) => document.getElementById(`${id}-error`)?.textContent;

describe('Sign In', () => {
  test('empty form: both fields are marked with a message and the email gets the focus', async () => {
    renderHero();
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign In' })[0]);
    submit();
    expect(errorOf('siEmail')).toBe('Please enter your email address.');
    expect(errorOf('siPassword')).toBe('Please enter your password.');
    expect(field('siEmail')).toHaveAttribute('aria-invalid', 'true');
    expect(field('siEmail')).toHaveAttribute('aria-describedby', 'siEmail-error');
    await waitFor(() => expect(document.activeElement).toBe(field('siEmail')));
    expect(signinUser).not.toHaveBeenCalled();
  });

  test('a badly typed email is pointed out; fixing it clears the message', async () => {
    renderHero();
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign In' })[0]);
    fireEvent.change(field('siEmail'), { target: { value: 'juan@' } });
    fireEvent.change(field('siPassword'), { target: { value: 'Secret123!' } });
    submit();
    expect(errorOf('siEmail')).toMatch(/valid email address/);
    expect(errorOf('siPassword')).toBeUndefined();
    fireEvent.change(field('siEmail'), { target: { value: 'juan@example.com' } });
    expect(errorOf('siEmail')).toBeUndefined();
    expect(field('siEmail')).not.toHaveAttribute('aria-invalid');
  });

  test('only the password missing: the password gets the focus', async () => {
    renderHero();
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign In' })[0]);
    fireEvent.change(field('siEmail'), { target: { value: 'juan@example.com' } });
    submit();
    expect(errorOf('siEmail')).toBeUndefined();
    await waitFor(() => expect(document.activeElement).toBe(field('siPassword')));
  });
});

describe('Sign Up', () => {
  const openSignUp = () => {
    renderHero();
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign Up' })[0]);
  };

  test('empty form: every required field says what is missing; the first one gets the focus', async () => {
    openSignUp();
    submit();
    expect(errorOf('suFirst')).toBe('Please enter your first name.');
    expect(errorOf('suLast')).toBe('Please enter your last name.');
    expect(errorOf('suContact')).toMatch(/mobile number/);
    expect(errorOf('suEmail')).toBe('Please enter your email address.');
    expect(errorOf('suUsername')).toBe('Please choose a username.');
    expect(errorOf('suPassword')).toBe('Please enter your password.');
    expect(errorOf('suConfirm')).toMatch(/confirm/);
    expect(errorOf('suAgree')).toMatch(/read the Terms/);
    expect(errorOf('suMiddle')).toBeUndefined(); // optional
    await waitFor(() => expect(document.activeElement).toBe(field('suFirst')));
    expect(global.fetch).not.toHaveBeenCalledWith(expect.stringMatching(/request-otp$/), expect.anything());
  });

  test('a later field is the only problem: the focus goes straight to it', async () => {
    openSignUp();
    const type = (id, value) => fireEvent.change(field(id), { target: { value } });
    type('suFirst', 'Juan'); type('suLast', 'Dela Cruz'); type('suContact', '91712');
    type('suEmail', 'juan@example.com'); type('suUsername', 'juandc');
    type('suPassword', 'Secret123!'); type('suConfirm', 'Secret123?');
    submit();
    expect(errorOf('suContact')).toBe('Contact number must be exactly 10 digits');
    expect(errorOf('suConfirm')).toBe('Passwords do not match');
    expect(errorOf('suFirst')).toBeUndefined();
    await waitFor(() => expect(document.activeElement).toBe(field('suContact')));
    
    type('suPassword', 'Secret123?');
    expect(errorOf('suConfirm')).toBeUndefined();
  });

  test('a weak password lists what it still needs, under the password', () => {
    openSignUp();
    fireEvent.change(field('suPassword'), { target: { value: 'secret' } });
    submit();
    expect(errorOf('suPassword')).toMatch(/uppercase|number|symbol|8/i);
  });

  const fillValid = () => {
    const type = (id, value) => fireEvent.change(field(id), { target: { value } });
    type('suFirst', 'Juan'); type('suLast', 'Dela Cruz'); type('suContact', '9171234567');
    type('suEmail', 'juan@example.com'); type('suUsername', 'juandc');
    type('suPassword', 'Secret123!'); type('suConfirm', 'Secret123!');
    fireEvent.click(field('suAgree'));
  };

  test('Terms read but box not ticked: the checkbox is marked and focused', async () => {
    localStorage.setItem('sf_terms_viewed', TERMS_VERSION);
    openSignUp();
    fillValid();
    fireEvent.click(field('suAgree')); // untick
    submit();
    expect(errorOf('suAgree')).toBe('You must agree to the Terms and Conditions to create an account.');
    expect(document.querySelectorAll('[aria-invalid="true"]')).toHaveLength(1);
    await waitFor(() => expect(document.activeElement).toBe(field('suAgree')));
  });

  test('the server says the username is taken: the username field is marked and focused', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ success: false, message: 'Username is already taken.' }) }));
    localStorage.setItem('sf_terms_viewed', TERMS_VERSION);
    openSignUp();
    fillValid();
    expect(field('suAgree')).toBeChecked();
    submit();
    await waitFor(() => expect(errorOf('suUsername')).toBe('Username is already taken.'));
    await waitFor(() => expect(document.activeElement).toBe(field('suUsername')));
    expect(screen.queryByRole('dialog', { name: 'Verify Your Email' })).not.toBeInTheDocument();
  });

  test('the server says the email is already used: the email field is marked', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ success: false, message: 'An account with this email already exists.' }) }));
    localStorage.setItem('sf_terms_viewed', TERMS_VERSION);
    openSignUp();
    fillValid();
    submit();
    await waitFor(() => expect(errorOf('suEmail')).toBe('An account with this email already exists.'));
  });
});
