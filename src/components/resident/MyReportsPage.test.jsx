import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import MyReportsPage from './MyReportsPage';
import { LanguageProvider } from '../../i18n/LanguageContext';
import {
  fetchMyReports,
  updateEmergencyReport,
  updateAssistanceRequest,
  updatePettyCrimeReport,
  deleteEmergencyReport,
  markItemsRead,
  unmarkItems,
  saveLanguagePreference
} from '../../Services/api';
import { showPopup, confirmPopup } from '../shared/popup';
import { __resetSyncedState } from '../shared/useSyncedState';

// The photo / video date check has its own tests (mediaCheck.test.js); here
// every attachment counts as taken today.
jest.mock('../shared/media/mediaCheck', () => ({
  ...jest.requireActual('../shared/media/mediaCheck'),
  checkMediaFile: () => Promise.resolve({ ok: true, takenAt: new Date(), dayOld: false })
}));


jest.mock('../shared/location/LocationPickerMap', () => () => null);
// The map beside the list (Leaflet doesn't load under Jest).
jest.mock('./ResidentReportsMap', () => function MockReportsMap(props) {
  return require('react').createElement('div', { 'data-testid': 'reports-map', 'data-panel': String(props.panel) });
});
jest.mock('../shared/location/useLocationPin', () => {
  const pin = {
    gpsCoords: { lat: 14.32, lng: 120.96 },
    setGpsCoords: () => {},
    isLocating: false,
    locationError: '',
    setLocationError: () => {},
    isOutsideSantaFe: false,
    outsideMessage: '',
    handleUseCurrentLocation: () => {},
    handlePickOnMap: () => {}
  };
  return () => pin;
});
jest.mock('../../Services/api', () => ({
  fetchMyReports: jest.fn(),
  fetchReportMedia: jest.fn(() => Promise.resolve({ photoUrl: 'data:image/jpeg;base64,AAA', mediaType: 'image' })),
  deleteEmergencyReport: jest.fn(),
  deleteAssistanceRequest: jest.fn(),
  deletePettyCrimeReport: jest.fn(),
  createEmergencyReport: jest.fn(),
  updateEmergencyReport: jest.fn(),
  createAssistanceRequest: jest.fn(),
  updateAssistanceRequest: jest.fn(),
  createPettyCrimeReport: jest.fn(),
  updatePettyCrimeReport: jest.fn(),
  // the resident's synced settings (archived reports are kept there)
  fetchMyState: jest.fn(),
  markItemsRead: jest.fn(),
  unmarkItems: jest.fn(),
  saveLanguagePreference: jest.fn()
}));
jest.mock('../shared/popup', () => ({ showPopup: jest.fn(), confirmPopup: jest.fn() }));


const REPORTS = [
  {
    id: 11, type: 'Emergency', title: 'Fire Emergency', description: 'Smoke from a house',
    date: '2026-10-16T08:00:00Z', location: '12 Mabini St, Sta. Fe', status: 'Received',
    report_reference: 'SC-2026-000011', latitude: '14.3198000', longitude: '120.9644000', peopleAffected: '6'
  },
  {
    id: 22, type: 'Assistance', title: 'Medical Aid', description: 'Need first aid',
    date: '2026-10-16T07:00:00Z', location: '3 Rizal St, Sta. Fe', status: 'Received',
    report_reference: 'SC-2026-000022', urgency: 'High', victim_of_emergency: 'Flood Emergency',
    has_media: 1, media_type: 'image', latitude: '14.3198000', longitude: '120.9644000',
    peopleAffected: 2
  },
  {
    id: 33, type: 'Petty Crime', title: 'Theft', description: 'Bike stolen',
    date: '2026-10-16T06:00:00Z', location: '5 Luna St, Sta. Fe', status: 'Received',
    report_reference: 'SC-2026-000033', latitude: '14.3198000', longitude: '120.9644000'
  }
];


beforeEach(() => {
  __resetSyncedState();
  markItemsRead.mockResolvedValue(true);
  unmarkItems.mockResolvedValue(true);
  saveLanguagePreference.mockResolvedValue(true);
  localStorage.setItem('sf_language', 'en');
  fetchMyReports.mockResolvedValue(REPORTS);
  updateEmergencyReport.mockResolvedValue({ success: true });
  updateAssistanceRequest.mockResolvedValue({ success: true });
  updatePettyCrimeReport.mockResolvedValue({ success: true });
  deleteEmergencyReport.mockResolvedValue({ success: true });
  global.URL.createObjectURL = jest.fn(() => 'blob:preview');
  global.URL.revokeObjectURL = jest.fn();
});

const renderPage = async () => {
  const utils = render(
    <LanguageProvider>
      <MyReportsPage isOpen userId={7} onClose={() => {}} />
    </LanguageProvider>
  );
  await screen.findByText('Fire Emergency');
  return utils;
};

// Each report is one child of .mr-list.
const cardFor = (title) => [...document.querySelector('.mr-list').children].find((c) => within(c).queryByText(title));


const openMenu = (title) => fireEvent.click(within(cardFor(title)).getByRole('button', { name: 'More options' }));
const chooseFromMenu = (title, option) => {
  openMenu(title);
  fireEvent.click(within(cardFor(title)).getByRole('menuitem', { name: option }));
};

test('the map of your reports sits beside the list (moved here from the home page)', async () => {
  const { container } = await renderPage();
  const map = screen.getByTestId('reports-map');
  expect(map).toHaveAttribute('data-panel', 'true');
  expect(map.closest('.mr-layout > .mr-map-col')).toBeInTheDocument();
  expect(container.querySelector('.mr-layout > .mr-wrap .mr-list')).toBeInTheDocument();
});

test('assistance requests are orange, as on the Request Assistance card', async () => {
  await renderPage();
  const icon = cardFor('Medical Aid').querySelector('.mr-card-icon');
  expect(icon).toHaveStyle({ color: '#ea580c' });
});

test('no "Total Reports" status bar', async () => {
  const { container } = await renderPage();
  expect(screen.queryByText('Total Reports')).not.toBeInTheDocument();
  expect(container.querySelector('.mr-overview, .mr-seg')).toBeNull();
});

test.each([
  ['Emergency', 'Fire Emergency', updateEmergencyReport, 11],
  ['Assistance', 'Medical Aid', updateAssistanceRequest, 22],
  ['Petty Crime', 'Theft', updatePettyCrimeReport, 33]
])('%s: Edit opens the form on top of the page and saving updates the report', async (_, title, updateFn, id) => {
  await renderPage();
  chooseFromMenu(title, 'Edit');

  
  // Assistance and Petty Crime open on their details step; Next goes on to
  // the step with the confirmation box and Save.
  const consent = await waitFor(() => {
    const next = [...document.querySelectorAll('.qr-foot button')].find((b) => /^Next/.test(b.textContent.trim()));
    if (next && !next.disabled) fireEvent.click(next);
    const box = document.querySelector('input[name="consent"]');
    if (!box) throw new Error('edit form not open');
    return box;
  });
  expect(consent.closest('.myreports-fullscreen')).toBeNull();

  const form = consent.closest('form');
  fireEvent.click(consent);
  expect(form.checkValidity()).toBe(true); // nothing else blocks Save
  fireEvent.submit(form);

  await waitFor(() => expect(updateFn).toHaveBeenCalledTimes(1));
  expect(updateFn.mock.calls[0][0]).toMatchObject({ id });
  await waitFor(() => expect(fetchMyReports).toHaveBeenCalledTimes(2)); // list reloads after saving
});

describe('Delete', () => {
  test('asks with the styled confirmation, not the browser dialog', async () => {
    const nativeConfirm = jest.spyOn(window, 'confirm').mockImplementation(() => true);
    confirmPopup.mockResolvedValue(false);
    await renderPage();
    chooseFromMenu('Fire Emergency', 'Delete');
    await waitFor(() => expect(confirmPopup).toHaveBeenCalledTimes(1));
    expect(confirmPopup.mock.calls[0][0]).toMatchObject({
      type: 'danger',
      title: 'Delete this report?',
      confirmLabel: 'Delete'
    });
    expect(confirmPopup.mock.calls[0][0].message).toMatch(/emergency report "Fire Emergency" will be permanently removed/);
    expect(nativeConfirm).not.toHaveBeenCalled();
    nativeConfirm.mockRestore();
  });

  test('Cancel keeps the report', async () => {
    confirmPopup.mockResolvedValue(false);
    await renderPage();
    chooseFromMenu('Fire Emergency', 'Delete');
    await waitFor(() => expect(confirmPopup).toHaveBeenCalled());
    expect(deleteEmergencyReport).not.toHaveBeenCalled();
  });

  test('confirming deletes it, reloads the list and says so', async () => {
    confirmPopup.mockResolvedValue(true);
    await renderPage();
    chooseFromMenu('Fire Emergency', 'Delete');
    await waitFor(() => expect(deleteEmergencyReport).toHaveBeenCalledWith(11));
    await waitFor(() => expect(showPopup).toHaveBeenCalledWith(expect.objectContaining({ type: 'success', title: 'Report Deleted' })));
    expect(fetchMyReports).toHaveBeenCalledTimes(2);
  });

  test('a failed delete shows an error', async () => {
    confirmPopup.mockResolvedValue(true);
    deleteEmergencyReport.mockResolvedValue({ success: false });
    await renderPage();
    chooseFromMenu('Fire Emergency', 'Delete');
    await waitFor(() => expect(showPopup).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', message: 'Failed to delete report.' })));
  });
});

describe('Three-dot menu', () => {
  test('Edit and Delete are hidden behind a three-dot button on each editable card', async () => {
    await renderPage();
    expect(screen.queryByRole('button', { name: /^Edit$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Delete$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'More options' })).toHaveLength(3);
  });

  test('clicking it shows Edit, Archive and Delete', async () => {
    await renderPage();
    openMenu('Theft');
    const btn = within(cardFor('Theft')).getByRole('button', { name: 'More options' });
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    const menu = within(cardFor('Theft')).getByRole('menu');
    expect(within(menu).getAllByRole('menuitem').map((m) => m.textContent.trim())).toEqual(['Edit', 'Archive', 'Delete']);
  });

  test('closes when clicking the button again, clicking outside, or pressing Esc', async () => {
    await renderPage();
    openMenu('Theft');
    openMenu('Theft');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    openMenu('Theft');
    fireEvent.mouseDown(document.querySelector('.myreports-header'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    openMenu('Theft');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(within(cardFor('Theft')).getByRole('button', { name: 'More options' })).toHaveFocus();
  });

  test('only one menu is open at a time', async () => {
    await renderPage();
    openMenu('Theft');
    openMenu('Medical Aid');
    expect(screen.getAllByRole('menu')).toHaveLength(1);
    expect(within(cardFor('Medical Aid')).getByRole('menu')).toBeInTheDocument();
  });

  test('choosing an option closes the menu', async () => {
    confirmPopup.mockResolvedValue(false);
    await renderPage();
    chooseFromMenu('Theft', 'Delete');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('reports that can no longer be edited can only be archived', async () => {
    fetchMyReports.mockResolvedValue([{ ...REPORTS[2], status: 'In Progress' }]);
    render(<LanguageProvider><MyReportsPage isOpen userId={7} onClose={() => {}} /></LanguageProvider>);
    await screen.findByText('Theft');
    openMenu('Theft');
    const menu = within(cardFor('Theft')).getByRole('menu');
    expect(within(menu).getAllByRole('menuitem').map((m) => m.textContent.trim())).toEqual(['Archive']);
  });
});

describe('Archive', () => {
  const titles = () => [...document.querySelectorAll('.mr-list > *')].map((c) => c.querySelector('.mr-card-heading')?.textContent || '');
  const box = (name) => screen.getByRole('button', { name: new RegExp('^' + name) });

  test('archiving moves a report to Archived, saved with the account; restoring brings it back', async () => {
    await renderPage();
    expect(box('Reports')).toHaveAttribute('aria-pressed', 'true');
    chooseFromMenu('Theft', 'Archive');
    expect(showPopup).toHaveBeenCalledWith(expect.objectContaining({ title: 'Report archived' }));
    expect(markItemsRead).toHaveBeenCalledWith(['report-archived:pettyCrime-33']);
    expect(titles().some((h) => h.includes('Theft'))).toBe(false);
    expect(box('Archived')).toHaveTextContent('1');

    fireEvent.click(box('Archived'));
    expect(titles()).toHaveLength(1);
    expect(cardFor('Theft')).toBeTruthy();
    chooseFromMenu('Theft', 'Restore');
    expect(unmarkItems).toHaveBeenCalledWith(['report-archived:pettyCrime-33']);
    expect(screen.getByText('No archived reports. Reports you archive are kept here.')).toBeInTheDocument();

    fireEvent.click(box('Reports'));
    expect(cardFor('Theft')).toBeTruthy();
  });

  test('the type tabs, search and counts work inside Archived', async () => {
    await renderPage();
    chooseFromMenu('Theft', 'Archive');
    chooseFromMenu('Medical Aid', 'Archive');
    fireEvent.click(box('Archived'));
    expect(titles()).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /^Petty Crime/ }));
    expect(titles()).toHaveLength(1);
    expect(cardFor('Theft')).toBeTruthy();
  });

  test('a report opened from a notification shows in Archived when it was archived', async () => {
    const view = (focusReport) => <LanguageProvider><MyReportsPage isOpen userId={7} onClose={() => {}} focusReport={focusReport} /></LanguageProvider>;
    const { rerender } = render(view(null));
    await screen.findByText('Fire Emergency');
    chooseFromMenu('Theft', 'Archive');
    rerender(view({ type: 'Petty Crime', id: 33, nonce: Date.now() }));
    await waitFor(() => expect(box('Archived')).toHaveAttribute('aria-pressed', 'true'));
    expect(cardFor('Theft')).toBeTruthy();
  });
});

describe('Automatic archive after 7 days', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const ago = (days) => new Date(Date.now() - days * DAY).toISOString();
  const box = (name) => screen.getByRole('button', { name: new RegExp('^' + name) });

  beforeEach(() => {
    fetchMyReports.mockResolvedValue([
      { ...REPORTS[0], date: ago(30) }, // open for a month: stays
      { ...REPORTS[1], status: 'Resolved', resolved_at: ago(2) }, // closed 2 days ago: stays
      { ...REPORTS[2], status: 'Dismissed', resolved_at: ago(8) } // closed 8 days ago: archived
    ]);
  });

  test('reports resolved or dismissed 7+ days ago move to Archived on their own; open ones never do', async () => {
    await renderPage();
    expect(cardFor('Medical Aid')).toBeTruthy();
    expect(screen.queryByText('Theft')).not.toBeInTheDocument();
    expect(box('Archived')).toHaveTextContent('1');

    fireEvent.click(box('Archived'));
    expect(cardFor('Theft')).toBeTruthy();
    expect(screen.getByText(/move here on their own 7 days after/)).toBeInTheDocument();
  });

  test('restoring an automatically archived report keeps it in the list', async () => {
    await renderPage();
    fireEvent.click(box('Archived'));
    chooseFromMenu('Theft', 'Restore');
    expect(markItemsRead).toHaveBeenCalledWith(['report-kept:pettyCrime-33']);

    fireEvent.click(box('Reports'));
    expect(cardFor('Theft')).toBeTruthy();
  });
});
