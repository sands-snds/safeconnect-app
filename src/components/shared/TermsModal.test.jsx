import { render, screen, fireEvent, act } from '@testing-library/react';
import TermsModal from './TermsModal';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { TERMS_VERSION } from './termsConsent';

const goTo = (hash) => act(() => {
  window.history.replaceState(null, '', `/${hash}`);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
});

const renderTerms = () => render(
  <LanguageProvider>
    <a href="#terms">Terms and Conditions</a>
    <TermsModal />
  </LanguageProvider>
);

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  localStorage.clear();
  document.body.style.overflow = '';
});

test('hidden until a #terms link is followed', () => {
  renderTerms();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  goTo('#terms');
  expect(screen.getByRole('dialog', { name: 'Terms and Conditions' })).toBeInTheDocument();
});

test('opens straight away when the page loads with #terms (shared link)', () => {
  window.history.replaceState(null, '', '/#terms');
  renderTerms();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

test('a plain document: title, date, introduction and 13 sections of numbered clauses', () => {
  window.history.replaceState(null, '', '/#terms');
  const { container } = renderTerms();
  expect(screen.getByText('Last updated: October 29, 2026')).toBeInTheDocument();
  expect(screen.getByText(/^Please read these Terms and Conditions carefully/)).toBeInTheDocument();
  expect(container.querySelectorAll('.tc-section')).toHaveLength(13);
  // Clauses are numbered 1.1, 1.2 ... 13.1
  expect(screen.getByText('1.1')).toBeInTheDocument();
  expect(screen.getByText('9.4')).toBeInTheDocument();
  expect(screen.getByText('13.1')).toBeInTheDocument();
  // No decorative extras (badge, summary box, contents chips, section icons)
  expect(container.querySelector('.tc-badge, .tc-summary, .tc-chip, .tc-num')).toBeNull();
  expect(container.querySelectorAll('.tc-body i.bi')).toHaveLength(0);
  expect(screen.getByRole('heading', { name: /1\.\s*Acceptance of Terms/ })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /13\.\s*Contact Information/ })).toBeInTheDocument();
  expect(screen.getByText(/Data Privacy Act of 2012 \(Republic Act No\. 10173\)/)).toBeInTheDocument();
});

test('follows the site language (Tagalog)', () => {
  localStorage.setItem('sf_language', 'tl');
  window.history.replaceState(null, '', '/#terms');
  renderTerms();
  expect(screen.getByRole('dialog', { name: 'Mga Tuntunin at Kundisyon' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Naiintindihan Ko/ })).toBeInTheDocument();
});

test.each([
  ['the close (X) button', () => fireEvent.click(screen.getByRole('button', { name: 'Close' }))],
  ['"I Understand"', () => fireEvent.click(screen.getByRole('button', { name: 'I Understand' }))],
  ['Escape', () => fireEvent.keyDown(document, { key: 'Escape' })],
  ['clicking outside', () => fireEvent.click(document.querySelector('.tc-overlay'))]
])('closes with %s, clears #terms, and restores page scrolling', (_, doClose) => {
  window.history.replaceState(null, '', '/#terms');
  renderTerms();
  expect(document.body.style.overflow).toBe('hidden');
  doClose();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(window.location.hash).toBe('');
  expect(document.body.style.overflow).toBe('');
});

test('opening the Terms records that they were viewed (for the Sign In checkbox)', () => {
  const onViewed = jest.fn();
  window.addEventListener('safeconnect:terms-viewed', onViewed);
  renderTerms();
  expect(localStorage.getItem('sf_terms_viewed')).toBeNull();
  goTo('#terms');
  expect(localStorage.getItem('sf_terms_viewed')).toBe(TERMS_VERSION);
  expect(onViewed).toHaveBeenCalled();
  window.removeEventListener('safeconnect:terms-viewed', onViewed);
});

test('clicking inside the panel does not close it', () => {
  window.history.replaceState(null, '', '/#terms');
  renderTerms();
  fireEvent.click(screen.getByText(/^Please read these Terms and Conditions carefully/));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
