import { render, screen, fireEvent, act } from '@testing-library/react';
import TermsModal from './TermsModal';
import { LanguageProvider } from '../../i18n/LanguageContext';

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

test('shows the summary, contents and all 13 numbered sections', () => {
  window.history.replaceState(null, '', '/#terms');
  const { container } = renderTerms();
  expect(screen.getByText('The short version')).toBeInTheDocument();
  expect(container.querySelectorAll('.tc-chip')).toHaveLength(13);
  expect(container.querySelectorAll('.tc-section')).toHaveLength(13);
  expect(screen.getByRole('heading', { name: /1\.\s*Acceptance of These Terms/ })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /13\.\s*Questions and Contact/ })).toBeInTheDocument();
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
  ['"I Understand"', () => fireEvent.click(screen.getByRole('button', { name: /I Understand/ }))],
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

test('clicking inside the panel does not close it', () => {
  window.history.replaceState(null, '', '/#terms');
  renderTerms();
  fireEvent.click(screen.getByText('The short version'));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
