import { render, screen, fireEvent } from '@testing-library/react';
import EmergencyContactList, { formatMobile } from './EmergencyContactList';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { DEFAULT_SITE_CONTENT } from './useSiteContent';

const renderList = (onCall) => render(
  <LanguageProvider>
    <EmergencyContactList contacts={DEFAULT_SITE_CONTENT.emergencyContacts} onCall={onCall} />
  </LanguageProvider>
);

beforeEach(() => localStorage.setItem('sf_language', 'en'));

test('Barangay Sta. Fe asks who to call instead of calling right away', () => {
  const onCall = jest.fn();
  renderList(onCall);
  expect(screen.queryByText('PB Emmanuel B. Noora')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Barangay Sta\. Fe/ }));
  expect(onCall).not.toHaveBeenCalled();
  expect(screen.getByText('PB Emmanuel B. Noora')).toBeInTheDocument();
  expect(screen.getByText('Sec Hazel R. Adriano')).toBeInTheDocument();
  expect(screen.getByText('0935 498 4838')).toBeInTheDocument();
  expect(screen.getByText('0945 635 5303')).toBeInTheDocument();
});

test('each person calls their own number', () => {
  const onCall = jest.fn();
  renderList(onCall);
  fireEvent.click(screen.getByRole('button', { name: /Barangay Sta\. Fe/ }));
  fireEvent.click(screen.getByRole('button', { name: /Sec Hazel R\. Adriano/ }));
  expect(onCall).toHaveBeenLastCalledWith('09456355303');
  fireEvent.click(screen.getByRole('button', { name: /PB Emmanuel B\. Noora/ }));
  expect(onCall).toHaveBeenLastCalledWith('09354984838');
});

test('the old barangay line is gone; other contacts still call right away', () => {
  const onCall = jest.fn();
  renderList(onCall);
  expect(JSON.stringify(DEFAULT_SITE_CONTENT)).not.toContain('9929474309');
  fireEvent.click(screen.getByRole('button', { name: /911 Emergency/ }));
  expect(onCall).toHaveBeenCalledWith('911');
});

test('formats mobile numbers', () => {
  expect(formatMobile('09354984838')).toBe('0935 498 4838');
  expect(formatMobile('+639456355303')).toBe('+63 945 635 5303');
  expect(formatMobile('911')).toBe('911');
});
