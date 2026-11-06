import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmergencyReportSection from './EmergencyReportSection';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { confirmPopup } from '../shared/popup';

jest.mock('./useCallAccess', () => ({ __esModule: true, default: () => true }));
jest.mock('./ResidentAssistanceModal', () => () => null);
jest.mock('./ResidentPettyCrimeModal', () => () => null);
jest.mock('../shared/popup', () => ({ confirmPopup: jest.fn(), showPopup: jest.fn() }));
jest.mock('../shared/useSiteContent', () => {
  const actual = jest.requireActual('../shared/useSiteContent');
  return { ...actual, __esModule: true, default: () => actual.DEFAULT_SITE_CONTENT };
});

let hrefs;
beforeEach(() => {
  localStorage.setItem('sf_language', 'en');
  confirmPopup.mockReset();
  hrefs = [];
  delete window.location;
  window.location = { set href(v) { hrefs.push(v); }, get href() { return 'http://localhost/resident'; } };
});

const renderSection = () => render(<LanguageProvider><EmergencyReportSection /></LanguageProvider>);
const tapFirstContact = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Emergency Contacts' }));
  fireEvent.click(screen.getByText('911 Emergency').closest('button'));
};

test('tapping a contact asks first; Yes places the call', async () => {
  confirmPopup.mockResolvedValue(true);
  renderSection();
  tapFirstContact();
  await waitFor(() => expect(confirmPopup).toHaveBeenCalled());
  const options = confirmPopup.mock.calls[0][0];
  expect(options.title).toBe('Make an emergency call?');
  expect(options.message).toMatch(/911/);
  expect(options.confirmLabel).toBe('Yes, call now');
  await waitFor(() => expect(hrefs).toEqual(['tel:911']));
});

test('Cancel closes it without calling', async () => {
  confirmPopup.mockResolvedValue(false);
  renderSection();
  tapFirstContact();
  await waitFor(() => expect(confirmPopup).toHaveBeenCalled());
  await new Promise((r) => setTimeout(r, 0));
  expect(hrefs).toEqual([]);
});
