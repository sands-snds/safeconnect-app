import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmergencyReportSection from './EmergencyReportSection';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { confirmPopup } from '../shared/popup';

// The real hook would ask the server; this one says the button is available
// and, when a test sets mockReadyNow, that a report's wait has just ended.
let mockReadyNow = false;
jest.mock('./useCallAccess', () => {
  const { useEffect } = require('react');
  return {
    __esModule: true,
    default: ({ onReady } = {}) => {
      useEffect(() => { if (mockReadyNow && onReady) onReady(['emergency-5']); }, []); // eslint-disable-line react-hooks/exhaustive-deps
      return true;
    }
  };
});
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

describe('when the call button becomes available', () => {
  test('a notice asks: Call Now opens the emergency contacts', async () => {
    mockReadyNow = true;
    confirmPopup.mockResolvedValueOnce(true);
    renderSection();
    await waitFor(() => expect(confirmPopup).toHaveBeenCalled());
    const options = confirmPopup.mock.calls[0][0];
    expect(options.title).toBe('Emergency call button is ready');
    expect(options.confirmLabel).toBe('Call Now');
    expect(options.cancelLabel).toBe('Not Now');
    expect(await screen.findByText('911 Emergency')).toBeInTheDocument();
    expect(hrefs).toEqual([]); // nothing dialled until a contact is chosen
  });

  test('Not Now just closes it', async () => {
    mockReadyNow = true;
    confirmPopup.mockResolvedValueOnce(false);
    renderSection();
    await waitFor(() => expect(confirmPopup).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText('911 Emergency')).not.toBeInTheDocument();
    expect(hrefs).toEqual([]);
  });

  test('the Bureau of Fire Protection is in the list', () => {
    renderSection();
    fireEvent.click(screen.getByRole('button', { name: 'Emergency Contacts' }));
    expect(screen.getByText('Bureau of Fire Protection')).toBeInTheDocument();
  });
});
