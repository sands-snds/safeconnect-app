import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuickEmergencyReport from './QuickEmergencyReport';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { createEmergencyReport } from '../../Services/api';
import { showPopup } from '../shared/popup';

jest.mock('../shared/location/LocationPickerMap', () => () => <div data-testid="map" />);
// GPS: a pin inside Santa Fe unless a test turns it off.
let mockPinned = true;
jest.mock('../shared/location/useLocationPin', () => () => ({
  gpsCoords: mockPinned ? { lat: 14.32, lng: 120.965 } : null,
  setGpsCoords: () => {},
  isLocating: false,
  locationError: '',
  setLocationError: () => {},
  isOutsideSantaFe: false,
  outsideMessage: '',
  handleUseCurrentLocation: () => {},
  handlePickOnMap: () => {},
  pinFromAddress: () => {},
  addressSearch: 'idle'
}));
jest.mock('./ReportLocationFields', () => ({
  EMPTY_LOCATION: { houseNumber: '', street: '', area: '', landmark: '' },
  composeLocation: (a) => [a.houseNumber, a.street].filter(Boolean).join(', ') || 'Pinned location',
  coordsForSubmit: async () => ({ lat: 14.321, lng: 120.964 })
}));
jest.mock('../../Services/api', () => ({ createEmergencyReport: jest.fn() }));
jest.mock('../shared/popup', () => ({ showPopup: jest.fn(), confirmPopup: jest.fn() }));

beforeEach(() => {
  mockPinned = true;
  localStorage.setItem('sf_language', 'en');
  sessionStorage.setItem('currentUser', JSON.stringify({
    id: 7, fullName: 'Juan Dela Cruz', contact: '09171234567',
    address: { houseNumber: 'Blk 5 Lot 12', street: 'Sampaguita St.' }
  }));
  createEmergencyReport.mockReset().mockResolvedValue({ success: true, id: 1, reportReference: 'SC-2026-000301' });
  showPopup.mockReset();
  global.URL.createObjectURL = jest.fn(() => 'blob:preview');
  global.URL.revokeObjectURL = jest.fn();
});

const renderForm = (props = {}) => render(
  <LanguageProvider><QuickEmergencyReport show onClose={jest.fn()} {...props} /></LanguageProvider>
);
const photo = () => new File(['jpeg'], 'fire.jpg', { type: 'image/jpeg' });
const attach = (container) => fireEvent.change(container.querySelector('input[type="file"][capture]'), { target: { files: [photo()] } });
const sendButton = () => screen.getByRole('button', { name: /Send report/ });

test('step 1: who needs help (Me already chosen) and four emergency types; no Medical or Other', () => {
  renderForm();
  expect(screen.getByRole('button', { name: 'Me' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Someone else' })).toHaveAttribute('aria-pressed', 'false');
  const tiles = [...document.querySelectorAll('.qr-tile b')].map((b) => b.textContent);
  expect(tiles).toEqual(['Fire', 'Flood', 'Earthquake', 'Typhoon']);
  expect(screen.queryByText(/Medical/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Other emergency/)).not.toBeInTheDocument();
  // the Filipino name under each tile
  expect(screen.getByText('Sunog')).toBeInTheDocument();
});

test('for me: tap Fire, add a photo, send (3 taps)', async () => {
  const { container } = renderForm();
  fireEvent.click(screen.getByText('Fire').closest('button'));
  expect(screen.getByText('Step 2 of 2')).toBeInTheDocument();
  expect(sendButton()).toBeDisabled();
  expect(screen.getByText('Add a photo or video to send.')).toBeInTheDocument();
  attach(container);
  expect(await screen.findByText('Photo added')).toBeInTheDocument();
  expect(screen.getByText('Using your location')).toBeInTheDocument();
  fireEvent.click(sendButton());
  await waitFor(() => expect(createEmergencyReport).toHaveBeenCalledTimes(1));
  const sent = createEmergencyReport.mock.calls[0][0];
  expect(sent).toMatchObject({ emergencyType: 'Fire Emergency', severity: 'Critical', userId: 7, reportFor: 'self', latitude: 14.32, longitude: 120.965, mediaType: 'image', details: '' });
  expect(sent.people).toBeUndefined();
  expect(sent.photoUrl).toMatch(/^data:image\/jpeg;base64,/);
  expect(await screen.findByText('Report sent')).toBeInTheDocument();
  expect(screen.getByText('SC-2026-000301')).toBeInTheDocument();
  expect(screen.getByText(/emergency call button is ready now/)).toBeInTheDocument();
});

test('for someone else: how you know them is required; name and number are optional', async () => {
  const { container } = renderForm();
  fireEvent.click(screen.getByRole('button', { name: 'Someone else' }));
  fireEvent.click(screen.getByText('Flood').closest('button'));
  expect(screen.getByText('For someone else')).toBeInTheDocument();
  expect(screen.getByText('Where are they?')).toBeInTheDocument();
  attach(container);
  await screen.findByText('Photo added');
  expect(sendButton()).toBeDisabled();
  expect(screen.getByText('Choose how you know them to send.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Neighbor' }));
  expect(sendButton()).not.toBeDisabled();
  fireEvent.click(sendButton());
  await waitFor(() => expect(createEmergencyReport).toHaveBeenCalledTimes(1));
  expect(createEmergencyReport.mock.calls[0][0]).toMatchObject({
    emergencyType: 'Flood Emergency', reportFor: 'others', victimRelationship: 'Neighbor', victimName: null, victimContact: null
  });
  expect(await screen.findByText(/for Neighbor/)).toBeInTheDocument();
});

test('no GPS: for me, the registered home address is used', async () => {
  mockPinned = false;
  const { container } = renderForm();
  fireEvent.click(screen.getByText('Earthquake').closest('button'));
  expect(screen.getByText('Your home address')).toBeInTheDocument();
  expect(screen.getByText('Blk 5 Lot 12, Sampaguita St.')).toBeInTheDocument();
  attach(container);
  await screen.findByText('Photo added');
  fireEvent.click(sendButton());
  await waitFor(() => expect(createEmergencyReport).toHaveBeenCalledTimes(1));
  expect(createEmergencyReport.mock.calls[0][0]).toMatchObject({ location: 'Blk 5 Lot 12, Sampaguita St.', latitude: 14.321, longitude: 120.964 });
});

test('no GPS and reporting for someone else: the map opens to pin the spot', () => {
  mockPinned = false;
  renderForm();
  fireEvent.click(screen.getByRole('button', { name: 'Someone else' }));
  fireEvent.click(screen.getByText('Typhoon').closest('button'));
  expect(screen.getByTestId('map')).toBeInTheDocument();
  expect(screen.getByText('Tap the map to pin the spot.')).toBeInTheDocument();
});

test('optional details are sent when filled in', async () => {
  const { container } = renderForm();
  fireEvent.click(screen.getByText('Fire').closest('button'));
  attach(container);
  await screen.findByText('Photo added');
  fireEvent.change(container.querySelector('#qr-people'), { target: { value: '4' } });
  fireEvent.change(container.querySelector('#qr-details'), { target: { value: 'Smoke from the second floor' } });
  fireEvent.click(sendButton());
  await waitFor(() => expect(createEmergencyReport).toHaveBeenCalledTimes(1));
  expect(createEmergencyReport.mock.calls[0][0]).toMatchObject({ people: 4, details: 'Smoke from the second floor' });
});

test('a file type that is not allowed is turned away', () => {
  const { container } = renderForm();
  fireEvent.click(screen.getByText('Fire').closest('button'));
  fireEvent.change(container.querySelector('input[type="file"][capture]'), { target: { files: [new File(['x'], 'a.gif', { type: 'image/gif' })] } });
  expect(showPopup).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }));
  expect(screen.queryByText('Photo added')).not.toBeInTheDocument();
});

test('Back returns to the emergency types; Request assistance hands over the location', async () => {
  const onRequestAssistance = jest.fn();
  const onClose = jest.fn();
  const { container } = renderForm({ onRequestAssistance, onClose });
  fireEvent.click(screen.getByText('Flood').closest('button'));
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByText('What is happening?')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Flood').closest('button'));
  attach(container);
  await screen.findByText('Photo added');
  fireEvent.click(sendButton());
  fireEvent.click(await screen.findByRole('button', { name: /Request assistance/ }));
  expect(onClose).toHaveBeenCalled();
  expect(onRequestAssistance).toHaveBeenCalledWith(expect.objectContaining({ reportFor: 'self', latitude: 14.32 }));
});

test('only the X closes the form: a tap outside it or Escape does nothing', () => {
  const onClose = jest.fn();
  const { container } = renderForm({ onClose });
  const overlay = container.querySelector('.qr-overlay');
  fireEvent.mouseDown(overlay);
  fireEvent.click(overlay);
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
