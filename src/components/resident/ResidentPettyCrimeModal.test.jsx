import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResidentPettyCrimeModal from './ResidentPettyCrimeModal';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { createPettyCrimeReport } from '../../Services/api';
import { showPopup } from '../shared/popup';


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
    handlePickOnMap: () => {},
    pinFromAddress: () => {},
    addressSearch: 'idle'
  };
  return () => pin;
});
jest.mock('../../Services/api', () => ({
  createPettyCrimeReport: jest.fn(() => Promise.resolve({ success: true, id: 1 })),
  updatePettyCrimeReport: jest.fn(() => Promise.resolve({ success: true }))
}));
jest.mock('../shared/popup', () => ({ showPopup: jest.fn() }));

const renderModal = () => {
  sessionStorage.setItem('currentUser', JSON.stringify({ id: 7, fullName: 'Juan Dela Cruz', contact: '09171234567' }));
  const utils = render(
    <LanguageProvider>
      <ResidentPettyCrimeModal show onClose={() => {}} />
    </LanguageProvider>
  );
  const form = utils.container.querySelector('form');
  const fileInput = utils.container.querySelector('input[type="file"]');
  const fill = (crimeType) => {
    fireEvent.change(utils.container.querySelector('select[name="crimeType"]'), { target: { value: crimeType } });
    fireEvent.change(utils.container.querySelector('textarea[name="description"]'), { target: { value: 'Something happened' } });
    fireEvent.click(utils.container.querySelector('input[name="consent"]'));
  };
  return { ...utils, form, fileInput, fill };
};


beforeEach(() => {
  createPettyCrimeReport.mockResolvedValue({ success: true, id: 1 });
});

test.each(['Theft', 'Suspicious Activity', 'Harassment'])('%s: photo is optional and the report submits without one', async (type) => {
  const { form, fileInput, fill } = renderModal();
  fill(type);
  expect(fileInput.required).toBe(false);
  expect(screen.getByText(/Optional for this crime type/)).toBeInTheDocument();
  fireEvent.submit(form);
  await waitFor(() => expect(createPettyCrimeReport).toHaveBeenCalledTimes(1));
  expect(createPettyCrimeReport.mock.calls[0][0]).toMatchObject({ crimeType: type, photoUrl: null, isAnonymous: false });
  expect(await screen.findByText('Report Submitted')).toBeInTheDocument();
});

test.each(['Vandalism', 'Public Disturbance', 'Trespassing', 'Other'])('%s: photo is required and submitting without one is blocked', async (type) => {
  const { form, fileInput, fill } = renderModal();
  fill(type);
  expect(fileInput.required).toBe(true);
  fireEvent.submit(form);
  await waitFor(() => expect(showPopup).toHaveBeenCalledWith(expect.objectContaining({
    type: 'warning',
    message: expect.stringMatching(/required for this crime type/)
  })));
  expect(createPettyCrimeReport).not.toHaveBeenCalled();
});

test('required type: attaching a JPG submits it as a base64 image', async () => {
  const { form, fileInput, fill } = renderModal();
  global.URL.createObjectURL = jest.fn(() => 'blob:preview');
  global.URL.revokeObjectURL = jest.fn();
  fill('Vandalism');
  const file = new File(['fake-jpeg'], 'wall.jpg', { type: 'image/jpeg' });
  fireEvent.change(fileInput, { target: { files: [file] } });
  expect(await screen.findByAltText('Selected attachment preview')).toBeInTheDocument();
  fireEvent.submit(form);
  await waitFor(() => expect(createPettyCrimeReport).toHaveBeenCalledTimes(1));
  const sent = createPettyCrimeReport.mock.calls[0][0];
  expect(sent.photoUrl).toMatch(/^data:image\/jpeg;base64,/);
  expect(sent.mediaType).toBe('image');
  expect(await screen.findByText('Report Submitted')).toBeInTheDocument();
});

test('rejects files that are not JPG or a supported video', () => {
  const { fileInput, fill } = renderModal();
  fill('Vandalism');
  fireEvent.change(fileInput, { target: { files: [new File(['x'], 'shot.png', { type: 'image/png' })] } });
  expect(showPopup).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }));
  expect(screen.queryByAltText('Selected attachment preview')).not.toBeInTheDocument();
});

test('before a crime type is picked, the hint explains which types need a photo', () => {
  const { fileInput } = renderModal();
  expect(fileInput.required).toBe(false);
  expect(screen.getByText(/Optional for Theft, Suspicious Activity and Harassment; required for all other/)).toBeInTheDocument();
});

test('report anonymously: checkbox sends isAnonymous', async () => {
  const { form, fill } = renderModal();
  fill('Harassment');
  fireEvent.click(screen.getByLabelText(/Report anonymously/));
  fireEvent.submit(form);
  await waitFor(() => expect(createPettyCrimeReport).toHaveBeenCalledTimes(1));
  expect(createPettyCrimeReport.mock.calls[0][0].isAnonymous).toBe(true);
  expect(await screen.findByText('Report Submitted')).toBeInTheDocument();
});

describe('where the incident happened', () => {
  const ADDRESS = { houseNumber: 'Blk 5 Lot 12', street: 'Sampaguita St.', area: 'Villa Santa Fe' };
  const renderWithAddress = () => {
    sessionStorage.setItem('currentUser', JSON.stringify({ id: 7, fullName: 'Juan Dela Cruz', address: ADDRESS }));
    const utils = render(
      <LanguageProvider>
        <ResidentPettyCrimeModal show onClose={() => {}} />
      </LanguageProvider>
    );
    return { ...utils, $: (sel) => utils.container.querySelector(sel) };
  };

  test('"At my home" fills in the registered address, without the map', async () => {
    const { $ } = renderWithAddress();
    expect(screen.getByRole('button', { name: /At my home/i })).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect($('input[name="houseNumber"]').value).toBe('Blk 5 Lot 12'));
    expect($('input[name="street"]').value).toBe('Sampaguita St.');
    expect($('input[name="area"]').value).toBe('Villa Santa Fe');
    expect(screen.queryByRole('button', { name: /Use my current location/i })).not.toBeInTheDocument();
  });

  test('"Somewhere else" empties the address and shows the map tools', async () => {
    const { $ } = renderWithAddress();
    await waitFor(() => expect($('input[name="houseNumber"]').value).toBe('Blk 5 Lot 12'));
    fireEvent.click(screen.getByRole('button', { name: /Somewhere else/i }));
    await waitFor(() => expect($('input[name="houseNumber"]').value).toBe(''));
    expect($('input[name="area"]').value).toBe('');
    expect(screen.getByRole('button', { name: /Use my current location/i })).toBeInTheDocument();
  });
});

test('closing the form clears it; reopening starts fresh with the registered address', async () => {
  const ADDRESS = { houseNumber: 'Blk 5 Lot 12', street: 'Sampaguita St.', area: '' };
  sessionStorage.setItem('currentUser', JSON.stringify({ id: 7, fullName: 'Juan Dela Cruz', address: ADDRESS }));
  const view = (show) => (
    <LanguageProvider>
      <ResidentPettyCrimeModal show={show} onClose={() => {}} />
    </LanguageProvider>
  );
  const { container, rerender } = render(view(true));
  const $ = (sel) => container.querySelector(sel);
  await waitFor(() => expect($('input[name="houseNumber"]').value).toBe('Blk 5 Lot 12'));

  fireEvent.click(screen.getByRole('button', { name: /Somewhere else/i }));
  fireEvent.change($('input[name="street"]'), { target: { value: 'Rizal St.' } });
  fireEvent.change($('textarea[name="description"]'), { target: { value: 'Bike stolen' } });

  rerender(view(false));
  rerender(view(true));
  await waitFor(() => expect($('input[name="houseNumber"]').value).toBe('Blk 5 Lot 12'));
  expect($('input[name="street"]').value).toBe('Sampaguita St.');
  expect($('textarea[name="description"]').value).toBe('');
  expect(screen.getByRole('button', { name: /At my home/i })).toHaveAttribute('aria-pressed', 'true');
});
