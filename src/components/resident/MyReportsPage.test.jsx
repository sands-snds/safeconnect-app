import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import MyReportsPage from './MyReportsPage';
import { LanguageProvider } from '../../i18n/LanguageContext';
import {
  fetchMyReports,
  updateEmergencyReport,
  updateAssistanceRequest,
  updatePettyCrimeReport,
  deleteEmergencyReport
} from '../../Services/api';
import { showPopup, confirmPopup } from '../shared/popup';

// The map needs a real browser; the form logic under test doesn't.
jest.mock('../shared/location/LocationPickerMap', () => () => null);
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
  deleteEmergencyReport: jest.fn(),
  deleteAssistanceRequest: jest.fn(),
  deletePettyCrimeReport: jest.fn(),
  createEmergencyReport: jest.fn(),
  updateEmergencyReport: jest.fn(),
  createAssistanceRequest: jest.fn(),
  updateAssistanceRequest: jest.fn(),
  createPettyCrimeReport: jest.fn(),
  updatePettyCrimeReport: jest.fn()
}));
jest.mock('../shared/popup', () => ({ showPopup: jest.fn(), confirmPopup: jest.fn() }));

// Shapes match myReportsController's normalize* (raw columns + type/title/...).
const REPORTS = [
  {
    id: 11, type: 'Emergency', title: 'Fire Emergency', description: 'Smoke from a house',
    date: '2026-10-16T08:00:00Z', location: '12 Mabini St, Sta. Fe', status: 'Received',
    report_reference: 'SC-2026-000011', latitude: '14.3198000', longitude: '120.9644000', peopleAffected: '1-10'
  },
  {
    id: 22, type: 'Assistance', title: 'Medical Aid', description: 'Need first aid',
    date: '2026-10-16T07:00:00Z', location: '3 Rizal St, Sta. Fe', status: 'Received',
    report_reference: 'SC-2026-000022', urgency: 'High', victim_of_emergency: 'Flood Emergency',
    photo_url: 'data:image/jpeg;base64,AAA', latitude: '14.3198000', longitude: '120.9644000'
  },
  {
    id: 33, type: 'Petty Crime', title: 'Theft', description: 'Bike stolen',
    date: '2026-10-16T06:00:00Z', location: '5 Luna St, Sta. Fe', status: 'Received',
    report_reference: 'SC-2026-000033', latitude: '14.3198000', longitude: '120.9644000'
  }
];

// CRA resets mock implementations before each test, so set them here.
beforeEach(() => {
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

// Edit and Delete live in each card's three-dot menu.
const openMenu = (title) => fireEvent.click(within(cardFor(title)).getByRole('button', { name: 'More options' }));
const chooseFromMenu = (title, option) => {
  openMenu(title);
  fireEvent.click(within(cardFor(title)).getByRole('menuitem', { name: option }));
};

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

  // The edit form must not be inside the transformed My Reports panel.
  const consent = await waitFor(() => {
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

  test('clicking it shows Edit and Delete', async () => {
    await renderPage();
    openMenu('Theft');
    const btn = within(cardFor('Theft')).getByRole('button', { name: 'More options' });
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    const menu = within(cardFor('Theft')).getByRole('menu');
    expect(within(menu).getAllByRole('menuitem').map((m) => m.textContent.trim())).toEqual(['Edit', 'Delete']);
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

  test('reports that can no longer be edited have no menu', async () => {
    fetchMyReports.mockResolvedValue([{ ...REPORTS[2], status: 'In Progress' }]);
    render(<LanguageProvider><MyReportsPage isOpen userId={7} onClose={() => {}} /></LanguageProvider>);
    await screen.findByText('Theft');
    expect(screen.queryByRole('button', { name: 'More options' })).not.toBeInTheDocument();
  });
});
