import { render, screen, waitFor, within } from '@testing-library/react';
import { coordsForSubmit } from './ReportLocationFields';
import { registeredHomePin, homePinForLocation } from './useRegisteredAddress';
import ResidentReportsMap from './ResidentReportsMap';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { fetchMyReports, saveLanguagePreference } from '../../Services/api';
import { forwardGeocode } from '../shared/location/geocode';
import { REPORTS_CHANGED_EVENT } from './useCallAccess';
import { __resetSyncedState } from '../shared/useSyncedState';

// Every report a resident sends has a place on "Your Reports on the Map":
// the pin on the map, else (at home) their home pin from sign-up, else the
// typed address looked up. The map shows all of their reports.

jest.mock('../shared/location/LocationPickerMap', () => () => null);
jest.mock('../shared/location/geocode', () => ({ forwardGeocode: jest.fn(), reverseGeocode: jest.fn() }));
jest.mock('../../Services/api', () => ({
  fetchMyReports: jest.fn(),
  fetchMyState: jest.fn(),
  markItemsRead: jest.fn(),
  unmarkItems: jest.fn(),
  saveLanguagePreference: jest.fn()
}));
// The map itself (Leaflet doesn't load under Jest): lists what it was given.
jest.mock('../shared/location/IncidentMap', () => function MockIncidentMap({ reports, placeAll, home }) {
  const React = require('react');
  return React.createElement('ul', { 'data-testid': 'map', 'data-place-all': String(Boolean(placeAll)), 'data-home': home ? `${home.lat},${home.lng}` : 'none' },
    reports.map((r) => React.createElement('li', { key: r.key, 'data-status': r.status, 'data-pos': r.position ? `${r.position[0] ?? r.position.lat},${r.position[1] ?? r.position.lng}` : 'none' }, r.title)));
});

const HOME = { lat: 14.3203, lng: 120.9648 };
const USER = { id: 7, fullName: 'Juan Dela Cruz', address: { houseNumber: 'Blk 5 Lot 12', street: 'Sampaguita St.' }, homeLocation: HOME };

beforeEach(() => {
  __resetSyncedState();
  saveLanguagePreference.mockResolvedValue(true);
  sessionStorage.setItem('currentUser', JSON.stringify(USER));
  forwardGeocode.mockResolvedValue(null);
});

describe('the position sent with a new report', () => {
  test('the pin on the map comes first', async () => {
    await expect(coordsForSubmit({ houseNumber: 'Blk 5 Lot 12', street: 'Sampaguita St.' }, { lat: 14.321, lng: 120.965 }, true))
      .resolves.toEqual({ lat: 14.321, lng: 120.965 });
  });

  test('at home, with no pin: the home pin from sign-up, without looking anything up', async () => {
    await expect(coordsForSubmit({ houseNumber: 'blk 5 lot 12 ', street: 'Sampaguita  St.' }, null, false)).resolves.toEqual(HOME);
    expect(forwardGeocode).not.toHaveBeenCalled();
  });

  test('a different address typed at home is looked up instead', async () => {
    forwardGeocode.mockResolvedValue({ lat: 14.318, lng: 120.962 });
    await expect(coordsForSubmit({ houseNumber: '9', street: 'Rizal St.' }, null, false)).resolves.toEqual({ lat: 14.318, lng: 120.962 });
  });

  test('somewhere else with a typed address but no pin: the address is looked up (it used to go without)', async () => {
    forwardGeocode.mockResolvedValue({ lat: 14.318, lng: 120.962 });
    await expect(coordsForSubmit({ houseNumber: '9', street: 'Rizal St.' }, null, true)).resolves.toEqual({ lat: 14.318, lng: 120.962 });
  });

  test('an account without a home pin falls back to the lookup', () => {
    sessionStorage.setItem('currentUser', JSON.stringify({ ...USER, homeLocation: null }));
    expect(registeredHomePin({ houseNumber: 'Blk 5 Lot 12', street: 'Sampaguita St.' })).toBeNull();
  });

  test('a saved report whose address is the home gets the home pin', () => {
    expect(homePinForLocation('Blk 5 Lot 12, Sampaguita St., Barangay Sta. Fe, Dasmariñas, Cavite, Philippines')).toEqual(HOME);
    expect(homePinForLocation('9, Rizal St., Barangay Sta. Fe')).toBeNull();
  });
});

describe('Your Reports on the Map', () => {
  const REPORTS = [
    { id: 1, type: 'Emergency', title: 'Fire Emergency', status: 'Received', location: 'Blk 5 Lot 12, Sampaguita St., Barangay Sta. Fe', latitude: '14.3210000', longitude: '120.9650000' },
    { id: 2, type: 'Assistance', title: 'Medical Aid', status: 'In Progress', location: 'Blk 5 Lot 12, Sampaguita St., Barangay Sta. Fe', latitude: null, longitude: null },
    { id: 3, type: 'Petty Crime', title: 'Theft', status: 'Resolved', location: '9, Rizal St., Barangay Sta. Fe', latitude: '14.3190000', longitude: '120.9630000' },
    { id: 4, type: 'Petty Crime', title: 'Vandalism', status: 'Dismissed', location: '9, Rizal St., Barangay Sta. Fe', latitude: '14.3190000', longitude: '120.9630000' }
  ];
  const renderMap = () => render(<LanguageProvider><ResidentReportsMap panel /></LanguageProvider>);

  test('only reports still being handled are on the map, each at its saved place', async () => {
    fetchMyReports.mockResolvedValue(REPORTS);
    renderMap();
    await waitFor(() => expect(within(screen.getByTestId('map')).getAllByRole('listitem')).toHaveLength(2));
    const items = Object.fromEntries(within(screen.getByTestId('map')).getAllByRole('listitem').map((li) => [li.textContent, li.dataset]));
    expect(items['Fire Emergency'].pos).toBe('14.321,120.965');
    expect(items['Medical Aid'].pos).toBe('14.3203,120.9648'); // saved without a position, at home: the home pin
    expect(items.Theft).toBeUndefined(); // resolved: off the map
    expect(items.Vandalism).toBeUndefined(); // dismissed: off the map
    expect(screen.queryByText('Resolved or dismissed')).not.toBeInTheDocument();
    expect(screen.getByText(/It disappears from the map once resolved/)).toBeInTheDocument();
    expect(screen.getByTestId('map').dataset.home).toBe('14.3203,120.9648'); // the saved home pin
    expect(screen.getByText('Your home')).toBeInTheDocument();
  });

  test('a report leaves the map as soon as it is marked resolved', async () => {
    fetchMyReports.mockResolvedValue(REPORTS);
    renderMap();
    await waitFor(() => expect(within(screen.getByTestId('map')).getAllByRole('listitem')).toHaveLength(2));
    fetchMyReports.mockResolvedValue(REPORTS.map((r) => (r.id === 1 ? { ...r, status: 'Resolved' } : r)));
    window.dispatchEvent(new Event(REPORTS_CHANGED_EVENT)); // what a live status update triggers
    await waitFor(() => expect(within(screen.getByTestId('map')).getAllByRole('listitem')).toHaveLength(1));
    expect(within(screen.getByTestId('map')).queryByText('Fire Emergency')).not.toBeInTheDocument();
  });
});
