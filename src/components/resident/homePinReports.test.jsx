import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResidentPettyCrimeModal from './ResidentPettyCrimeModal';
import ResidentAssistanceModal from './ResidentAssistanceModal';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { createPettyCrimeReport, createAssistanceRequest } from '../../Services/api';

// Request Assistance and Report Petty Crime, for a report made at home: the
// map shows the home pin saved at sign-up / in Settings, nothing to pin again.
// Moving the pin makes it "Somewhere else" and that spot is what is sent.
// Uses the real pin hook, Santa Fe boundary check and address-to-position
// code; only the map picture and the online address lookup are stand-ins.

jest.setTimeout(30000);
jest.mock('../shared/media/mediaCheck', () => ({
  ...jest.requireActual('../shared/media/mediaCheck'),
  checkMediaFile: () => Promise.resolve({ ok: true, takenAt: new Date(), dayOld: false })
}));
jest.mock('../shared/location/LocationPickerMap', () => ({ pin, onPick }) => (
  <div data-testid="map" data-pin={pin ? `${pin.lat},${pin.lng}` : 'none'}>
    <button type="button" onClick={() => onPick(14.3210, 120.9645)}>move pin</button>
  </div>
));
jest.mock('../shared/location/geocode', () => ({
  reverseGeocode: () => Promise.resolve({ houseNumber: '7', street: 'Mabini St.', area: '', fullAddress: '7 Mabini St., Barangay Sta. Fe' }),
  forwardGeocode: () => Promise.resolve(null)
}));
jest.mock('../../Services/api', () => ({
  createPettyCrimeReport: jest.fn(),
  updatePettyCrimeReport: jest.fn(),
  createAssistanceRequest: jest.fn(),
  updateAssistanceRequest: jest.fn()
}));
jest.mock('../shared/popup', () => ({ showPopup: jest.fn() }));

const HOME = { lat: 14.3195, lng: 120.964 };

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('sf_language', 'en');
  sessionStorage.setItem('currentUser', JSON.stringify({
    id: 7, fullName: 'Juan Dela Cruz', contact: '09171234567',
    address: { houseNumber: 'Blk 5 Lot 12', street: 'Sampaguita St.' }, homeLocation: HOME
  }));
  createPettyCrimeReport.mockResolvedValue({ success: true, id: 1 });
  createAssistanceRequest.mockResolvedValue({ success: true, id: 1 });
  global.URL.createObjectURL = jest.fn(() => 'blob:preview');
  global.URL.revokeObjectURL = jest.fn();
});

const mapPin = () => screen.getByTestId('map').getAttribute('data-pin');
const send = (container) => {
  fireEvent.click(container.querySelector('input[name="consent"]'));
  fireEvent.submit(container.querySelector('form'));
};

describe('Report Petty Crime', () => {
  const toStep3 = () => {
    const view = render(<LanguageProvider><ResidentPettyCrimeModal show onClose={() => {}} /></LanguageProvider>);
    fireEvent.click(screen.getByRole('button', { name: /^Theft/ }));
    fireEvent.change(view.container.querySelector('textarea[name="description"]'), { target: { value: 'Bike stolen from the gate' } });
    fireEvent.click(screen.getByRole('button', { name: /^Next/ }));
    return view;
  };

  test('"At my home": the map already shows the saved home pin, and that is what is sent', async () => {
    const { container } = toStep3();
    expect(screen.getByRole('button', { name: /At my home/i })).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(mapPin()).toBe('14.3195,120.964'));
    expect(container.querySelector('input[name="houseNumber"]').value).toBe('Blk 5 Lot 12');
    send(container);
    await waitFor(() => expect(createPettyCrimeReport).toHaveBeenCalledTimes(1));
    const sent = createPettyCrimeReport.mock.calls[0][0];
    expect(sent).toMatchObject({ latitude: 14.3195, longitude: 120.964 });
    expect(sent.location).toMatch(/^Blk 5 Lot 12, Sampaguita St\./);
  });

  test('moving the pin makes it "Somewhere else"; the new spot and its address are sent', async () => {
    const { container } = toStep3();
    await waitFor(() => expect(mapPin()).toBe('14.3195,120.964'));
    fireEvent.click(screen.getByRole('button', { name: 'move pin' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Somewhere else/i })).toHaveAttribute('aria-pressed', 'true'));
    expect(mapPin()).toBe('14.321,120.9645');
    await waitFor(() => expect(container.querySelector('input[name="street"]').value).toBe('Mabini St.'));
    send(container);
    await waitFor(() => expect(createPettyCrimeReport).toHaveBeenCalledTimes(1));
    const sent = createPettyCrimeReport.mock.calls[0][0];
    expect(sent).toMatchObject({ latitude: 14.321, longitude: 120.9645 });
    expect(sent.location).toMatch(/Mabini St\./);
  });

  test('back to "At my home" puts the home pin back', async () => {
    toStep3();
    await waitFor(() => expect(mapPin()).toBe('14.3195,120.964'));
    fireEvent.click(screen.getByRole('button', { name: 'move pin' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Somewhere else/i })).toHaveAttribute('aria-pressed', 'true'));
    fireEvent.click(screen.getByRole('button', { name: /At my home/i }));
    await waitFor(() => expect(mapPin()).toBe('14.3195,120.964'));
  });
});

describe('Request Assistance', () => {
  const toStep3 = async () => {
    const view = render(<LanguageProvider><ResidentAssistanceModal show onClose={() => {}} /></LanguageProvider>);
    const $ = (sel) => view.container.querySelector(sel);
    fireEvent.click(screen.getByRole('button', { name: /^Medical Aid/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Flood' }));
    fireEvent.change($('textarea[name="situation"]'), { target: { value: 'Water inside the house' } });
    fireEvent.change($('input[type="file"]'), { target: { files: [new File(['jpeg'], 'house.jpg', { type: 'image/jpeg' })] } });
    await screen.findByAltText('Selected attachment preview');
    fireEvent.click(screen.getByRole('button', { name: /^Next/ }));
    return view;
  };

  test('for myself at home: the home pin is on the map and is sent with the request', async () => {
    const { container } = await toStep3();
    await waitFor(() => expect(mapPin()).toBe('14.3195,120.964'));
    send(container);
    await waitFor(() => expect(createAssistanceRequest).toHaveBeenCalledTimes(1));
    expect(createAssistanceRequest.mock.calls[0][0]).toMatchObject({ latitude: 14.3195, longitude: 120.964 });
  });

  test('a moved pin is sent instead', async () => {
    const { container } = await toStep3();
    await waitFor(() => expect(mapPin()).toBe('14.3195,120.964'));
    fireEvent.click(screen.getByRole('button', { name: 'move pin' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Somewhere else/i })).toHaveAttribute('aria-pressed', 'true'));
    send(container);
    await waitFor(() => expect(createAssistanceRequest).toHaveBeenCalledTimes(1));
    expect(createAssistanceRequest.mock.calls[0][0]).toMatchObject({ latitude: 14.321, longitude: 120.9645 });
  });
});
