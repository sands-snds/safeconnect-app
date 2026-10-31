import { render, screen, fireEvent, act } from '@testing-library/react';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import { LanguageProvider } from '../../i18n/LanguageContext';

jest.mock('./useSiteContent', () => ({
  __esModule: true,
  default: () => ({
    socials: { email: 'brgy.santafe@example.test', facebookUrl: 'https://facebook.com/brgysantafe', facebookLabel: 'Barangay Sta. Fe' },
    officials: [{ firstName: 'Emmanuel', lastName: 'Noora', position: 'PB', number: '+639354984838' }]
  }),
  officialName: (o) => `${o.firstName} ${o.lastName}`
}));

const goTo = (hash) => act(() => {
  window.history.replaceState(null, '', `/${hash}`);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
});

const renderPrivacy = () => render(
  <LanguageProvider>
    <a href="#privacy">Privacy Policy</a>
    <PrivacyPolicyModal />
  </LanguageProvider>
);

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  localStorage.clear();
  document.body.style.overflow = '';
});

test('hidden until the footer\'s #privacy link is followed', () => {
  renderPrivacy();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  goTo('#privacy');
  expect(screen.getByRole('dialog', { name: 'Privacy Policy' })).toBeInTheDocument();
});

test('covers what RA 10173 asks for: collection, purpose, sharing, security, retention, rights, contact', () => {
  window.history.replaceState(null, '', '/#privacy');
  const { container } = renderPrivacy();
  expect(screen.getByText(/Data Privacy Act of 2012 \(Republic Act No\. 10173\)/)).toBeInTheDocument();
  for (const heading of [
    /Information We Collect/, /Why We Collect It and Our Legal Basis/, /Who Can See Your Information/,
    /How We Store and Protect Your Information/, /How Long We Keep Your Information/, /Your Rights/,
    /Contact Us About Your Privacy/
  ]) {
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
  }
  expect(screen.getByText(/^Birthdate:/)).toBeInTheDocument();
  expect(screen.getByText(/^Emergency reports:/)).toBeInTheDocument();
  expect(screen.getByText(/^Assistance requests:/)).toBeInTheDocument();
  expect(screen.getByText(/^Authorized barangay personnel:/)).toBeInTheDocument();
  expect(container.querySelectorAll('.tc-section').length).toBeGreaterThanOrEqual(10);
});

test('the contact section lists the barangay\'s current email, Facebook page and officials', () => {
  window.history.replaceState(null, '', '/#privacy');
  renderPrivacy();
  expect(screen.getByRole('link', { name: 'brgy.santafe@example.test' })).toHaveAttribute('href', 'mailto:brgy.santafe@example.test');
  expect(screen.getByRole('link', { name: 'Barangay Sta. Fe' })).toHaveAttribute('href', 'https://facebook.com/brgysantafe');
  expect(screen.getByText(/Emmanuel Noora/)).toBeInTheDocument();
});

test('closes with the button and drops #privacy from the address', () => {
  window.history.replaceState(null, '', '/#privacy');
  renderPrivacy();
  fireEvent.click(screen.getByRole('button', { name: 'I Understand' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(window.location.hash).toBe('');
});

test('follows the site language (Tagalog)', () => {
  localStorage.setItem('sf_language', 'tl');
  window.history.replaceState(null, '', '/#privacy');
  renderPrivacy();
  expect(screen.getByRole('dialog', { name: 'Patakaran sa Privacy' })).toBeInTheDocument();
});
