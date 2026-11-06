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
// Sign Up: Next, Next, Create Account (each click re-finds the button).
const submitAll = () => { submit(); submit(); submit(); };
const field = (id) => document.getElementById(id);
const errorOf = (id) => document.getElementById(`${id}-error`)?.textContent;
// The proof-of-residency ID every sign-up now needs.
const fillAddress = () => {
  fireEvent.change(document.getElementById('suAddrHouse'), { target: { value: 'Blk 5 Lot 12' } });
  fireEvent.change(document.getElementById('suAddrStreet'), { target: { value: 'Sampaguita St.' } });
};
const attachId = () => {
  fireEvent.change(document.getElementById('suIdType'), { target: { value: 'Barangay ID' } });
  const file = new File(['%PDF-1.7 test'], 'barangay-id.pdf', { type: 'application/pdf' });
  fireEvent.change(document.getElementById('suIdFile'), { target: { files: [file] } });
};

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
  const type = (id, value) => fireEvent.change(field(id), { target: { value } });
  const fillStep1 = () => {
    type('suFirst', 'Juan'); type('suLast', 'Dela Cruz'); type('suContact', '9171234567');
    type('suEmail', 'juan@example.com');
  };
  const fillStep2 = () => { fillAddress(); attachId(); };
  const fillStep3 = () => {
    type('suUsername', 'juandc'); type('suPassword', 'Secret123!'); type('suConfirm', 'Secret123!');
    fireEvent.click(field('suAgree'));
  };
  const fillValid = () => { fillStep1(); fillStep2(); fillStep3(); };
  const stepShown = () => document.querySelector('.auth-step.current .auth-step-l')?.textContent;

  test('the form is three steps; it starts on "Your details" with a Next button', () => {
    openSignUp();
    expect([...document.querySelectorAll('.auth-step-l')].map((n) => n.textContent)).toEqual(['Your details', 'Address & ID', 'Account']);
    expect(stepShown()).toBe('Your details');
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    expect(document.querySelector('form button[type="submit"]').textContent).toMatch(/^Next/);
    expect(document.querySelector('.auth-part-actions').textContent).not.toMatch(/Back/);
    expect(field('suFirst').closest('.auth-part')).not.toHaveAttribute('hidden');
    expect(field('suAddrHouse').closest('.auth-part')).toHaveAttribute('hidden');
  });

  test('step 1 empty: Next lists only its fields and stays; the first gets the focus', async () => {
    openSignUp();
    submit();
    expect(errorOf('suFirst')).toBe('Please enter your first name.');
    expect(errorOf('suLast')).toBe('Please enter your last name.');
    expect(errorOf('suContact')).toMatch(/mobile number/);
    expect(errorOf('suEmail')).toBe('Please enter your email address.');
    expect(errorOf('suMiddle')).toBeUndefined(); // optional
    expect(errorOf('suAddrHouse')).toBeUndefined(); // next step
    expect(errorOf('suUsername')).toBeUndefined();
    expect(stepShown()).toBe('Your details');
    await waitFor(() => expect(document.activeElement).toBe(field('suFirst')));
    expect(global.fetch).not.toHaveBeenCalledWith(expect.stringMatching(/request-otp$/), expect.anything());
  });

  test('step 2 empty: the address and ID say what is missing', () => {
    openSignUp();
    fillStep1();
    submit();
    expect(stepShown()).toBe('Address & ID');
    submit();
    expect(errorOf('suAddrHouse')).toBe('Please enter your house, lot or block number.');
    expect(errorOf('suAddrStreet')).toBe('Please enter your street.');
    expect(errorOf('suAddrArea')).toBeUndefined(); // optional
    expect(errorOf('suIdType')).toBe('Please choose the type of ID you are uploading.');
    expect(errorOf('suIdFile')).toMatch(/valid ID/);
    expect(stepShown()).toBe('Address & ID');
  });

  test('step 3 empty: the account fields say what is missing', () => {
    openSignUp();
    fillStep1(); submit();
    fillStep2(); submit();
    expect(stepShown()).toBe('Account');
    submit();
    expect(errorOf('suUsername')).toBe('Please choose a username.');
    expect(errorOf('suPassword')).toBe('Please enter your password.');
    expect(errorOf('suConfirm')).toMatch(/confirm/);
    expect(errorOf('suAgree')).toMatch(/read the Terms/);
  });

  test('a later field is the only problem: the focus goes straight to it', async () => {
    openSignUp();
    type('suFirst', 'Juan'); type('suLast', 'Dela Cruz'); type('suContact', '91712');
    type('suEmail', 'juan@example.com');
    submit();
    expect(errorOf('suContact')).toBe('Contact number must be exactly 10 digits');
    expect(errorOf('suFirst')).toBeUndefined();
    await waitFor(() => expect(document.activeElement).toBe(field('suContact')));
  });

  test('Back and Next keep everything typed', () => {
    openSignUp();
    fillStep1(); submit();
    fillAddress(); type('suAddrArea', 'Villa Santa Fe');
    fireEvent.click(document.querySelector('.auth-part-actions button[type="button"]'));
    expect(stepShown()).toBe('Your details');
    expect(field('suFirst').value).toBe('Juan');
    expect(field('suEmail').value).toBe('juan@example.com');
    submit();
    expect(stepShown()).toBe('Address & ID');
    expect(field('suAddrHouse').value).toBe('Blk 5 Lot 12');
    expect(field('suAddrArea').value).toBe('Villa Santa Fe');
    // a finished step can be reopened from the step bar
    fireEvent.click(screen.getByRole('button', { name: /Your details/ }));
    expect(stepShown()).toBe('Your details');
  });

  test('passwords: mismatch and weak passwords are pointed out on step 3', async () => {
    openSignUp();
    fillStep1(); submit();
    fillStep2(); submit();
    type('suUsername', 'juandc'); type('suPassword', 'Secret123!'); type('suConfirm', 'Secret123?');
    submit();
    expect(errorOf('suConfirm')).toBe('Passwords do not match');
    type('suPassword', 'Secret123?');
    expect(errorOf('suConfirm')).toBeUndefined();
    type('suPassword', 'secret');
    submit();
    expect(errorOf('suPassword')).toMatch(/uppercase|number|symbol|8/i);
  });

  test('password boxes refuse paste, copy and drop; typing still works', () => {
    openSignUp();
    for (const id of ['suPassword', 'suConfirm']) {
      const paste = new Event('paste', { bubbles: true, cancelable: true });
      field(id).dispatchEvent(paste);
      expect(paste.defaultPrevented).toBe(true);
      const copy = new Event('copy', { bubbles: true, cancelable: true });
      field(id).dispatchEvent(copy);
      expect(copy.defaultPrevented).toBe(true);
      const drop = new Event('drop', { bubbles: true, cancelable: true });
      field(id).dispatchEvent(drop);
      expect(drop.defaultPrevented).toBe(true);
      type(id, 'Typed123!');
      expect(field(id).value).toBe('Typed123!');
    }
    // other fields still accept a paste
    const paste = new Event('paste', { bubbles: true, cancelable: true });
    field('suEmail').dispatchEvent(paste);
    expect(paste.defaultPrevented).toBe(false);
  });

  test('Terms read but box not ticked: the checkbox is marked and focused', async () => {
    localStorage.setItem('sf_terms_viewed', TERMS_VERSION);
    openSignUp();
    fillValid();
    fireEvent.click(field('suAgree')); // untick
    submitAll();
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
    submitAll();
    await waitFor(() => expect(errorOf('suUsername')).toBe('Username is already taken.'));
    await waitFor(() => expect(document.activeElement).toBe(field('suUsername')));
    expect(screen.queryByRole('dialog', { name: 'Verify Your Email' })).not.toBeInTheDocument();
  });

  test('the server says the email is already used: back to step 1, with the email marked', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ success: false, message: 'An account with this email already exists.' }) }));
    localStorage.setItem('sf_terms_viewed', TERMS_VERSION);
    openSignUp();
    fillValid();
    submitAll();
    await waitFor(() => expect(errorOf('suEmail')).toBe('An account with this email already exists.'));
    expect(stepShown()).toBe('Your details');
    await waitFor(() => expect(document.activeElement).toBe(field('suEmail')));
  });
});

describe('Sign Up: proof of residency', () => {
  const openSignUp = () => {
    renderHero();
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign Up' })[0]);
  };

  test('lists the accepted IDs and the supported file formats', () => {
    openSignUp();
    expect(screen.getByText('Accepted IDs')).toBeInTheDocument();
    expect(screen.getAllByText('Barangay ID (Barangay Santa Fe)').length).toBeGreaterThan(0);
    expect(screen.getByText('JPG, PNG, WebP or PDF · up to 5 MB')).toBeInTheDocument();
    expect(field('suIdFile')).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp,application/pdf');
  });

  test('a file that is not an accepted type is turned away', () => {
    openSignUp();
    const file = new File(['MZ'], 'id.exe', { type: 'application/x-msdownload' });
    fireEvent.change(field('suIdFile'), { target: { files: [file] } });
    expect(errorOf('suIdFile')).toBe("This file type isn't accepted. Please upload a JPG, PNG, WebP or PDF.");
  });

  test('a file over 5 MB is turned away', () => {
    openSignUp();
    const file = new File(['x'], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
    fireEvent.change(field('suIdFile'), { target: { files: [file] } });
    expect(errorOf('suIdFile')).toMatch(/larger than 5 MB/);
  });

  test('the chosen ID is shown and sent with the sign-up', async () => {
    localStorage.setItem('sf_terms_viewed', TERMS_VERSION);
    openSignUp();
    const type = (id, value) => fireEvent.change(field(id), { target: { value } });
    type('suFirst', 'Juan'); type('suLast', 'Dela Cruz'); type('suContact', '9171234567');
    type('suEmail', 'juan@example.com'); type('suUsername', 'juandc');
    type('suPassword', 'Secret123!'); type('suConfirm', 'Secret123!');
    fillAddress();
    attachId();
    expect(screen.getByText('barangay-id.pdf')).toBeInTheDocument();
    fireEvent.click(field('suAgree'));
    submitAll();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/request-otp$/), expect.anything()));
    const [, options] = global.fetch.mock.calls.find(([url]) => String(url).endsWith('/request-otp'));
    const body = JSON.parse(options.body);
    expect(body.address).toEqual({ houseNumber: 'Blk 5 Lot 12', street: 'Sampaguita St.', area: '' });
    expect(body.validId.idType).toBe('Barangay ID');
    expect(body.validId.fileName).toBe('barangay-id.pdf');
    expect(body.validId.dataUrl).toMatch(/^data:application\/pdf;base64,/);
  });
});

describe('Server can\'t reach the database', () => {
  const DB_DOWN = { success: false, code: 'DATABASE_UNAVAILABLE', message: "SafeConnect can't reach its database right now." };

  test('Sign In stays open and explains it, in the chosen language', async () => {
    localStorage.setItem('sf_language', 'tl');
    signinUser.mockResolvedValue(DB_DOWN);
    renderHero();
    fireEvent.click(screen.getAllByRole('button', { name: /Mag-sign In/i })[0]);
    fireEvent.change(field('siEmail'), { target: { value: 'juan@example.com' } });
    fireEvent.change(field('siPassword'), { target: { value: 'Secret123!' } });
    submit();
    expect(await screen.findByText(/Hindi makakonekta ang SafeConnect sa database/)).toBeInTheDocument();
    expect(field('siEmail')).toBeInTheDocument();
    expect(screen.queryByText(/Internal server error/i)).not.toBeInTheDocument();
  });

  test('Sign Up explains it instead of a generic error', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(DB_DOWN) }));
    localStorage.setItem('sf_terms_viewed', TERMS_VERSION);
    renderHero();
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign Up' })[0]);
    const type = (id, value) => fireEvent.change(field(id), { target: { value } });
    type('suFirst', 'Juan'); type('suLast', 'Dela Cruz'); type('suContact', '9171234567');
    type('suEmail', 'juan@example.com'); type('suUsername', 'juandc');
    type('suPassword', 'Secret123!'); type('suConfirm', 'Secret123!');
    fillAddress();
    attachId();
    fireEvent.click(field('suAgree'));
    submitAll();
    expect(await screen.findByText(/can't reach its database right now, so this can't be completed/)).toBeInTheDocument();
  });
});
