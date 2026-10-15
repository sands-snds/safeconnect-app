import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResidentAssistanceModal from './ResidentAssistanceModal';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { createAssistanceRequest, updateAssistanceRequest } from '../../Services/api';
import { showPopup } from '../shared/popup';

// The map needs a real browser; the form logic under test doesn't.
jest.mock('../shared/location/LocationPickerMap', () => () => null);
// Same object every render, like the real hook's stable state setters --
// a fresh setGpsCoords each render would re-run the edit prefill effect forever.
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
  createAssistanceRequest: jest.fn(),
  updateAssistanceRequest: jest.fn()
}));
jest.mock('../shared/popup', () => ({ showPopup: jest.fn() }));

// CRA resets mock implementations before each test, so set them here.
beforeEach(() => {
  createAssistanceRequest.mockResolvedValue({ success: true, id: 1 });
  updateAssistanceRequest.mockResolvedValue({ success: true });
  global.URL.createObjectURL = jest.fn(() => 'blob:preview');
  global.URL.revokeObjectURL = jest.fn();
});

const renderModal = (props = {}) => {
  sessionStorage.setItem('currentUser', JSON.stringify({ id: 7, fullName: 'Juan Dela Cruz', contact: '09171234567' }));
  const utils = render(
    <LanguageProvider>
      <ResidentAssistanceModal show onClose={() => {}} {...props} />
    </LanguageProvider>
  );
  const $ = (sel) => utils.container.querySelector(sel);
  const fill = (emergency) => {
    fireEvent.change($('select[name="assistanceType"]'), { target: { value: 'Medical Aid' } });
    if (emergency) fireEvent.change($('select[name="emergency"]'), { target: { value: emergency } });
    const situation = $('textarea[name="situation"]');
    if (situation) fireEvent.change(situation, { target: { value: 'We need help' } });
    const consent = $('input[name="consent"]');
    if (consent && !consent.checked) fireEvent.click(consent);
  };
  return { ...utils, $, fill, form: $('form'), fileInput: $('input[type="file"]') };
};

test('shows "Victim of What Emergency?" (required) with the photo field beside it (optional)', () => {
  const { $, fileInput } = renderModal();
  expect(screen.getByText('Victim of What Emergency?')).toBeInTheDocument();
  expect($('select[name="emergency"]').required).toBe(true);
  expect(screen.getByText('Photo or Video (Proof)')).toBeInTheDocument();
  expect(fileInput.required).toBe(false);
  // Same grid row
  expect($('select[name="emergency"]').closest('.rf-2col')).toBe(fileInput.closest('.rf-2col'));
});

test('lists the Report Emergency types plus Other', () => {
  const { $ } = renderModal();
  const values = [...$('select[name="emergency"]').options].map((o) => o.value);
  expect(values).toEqual(['', 'Fire Emergency', 'Flood Emergency', 'Earthquake', 'Other']);
});

test('submits the chosen emergency without a photo', async () => {
  const { form, fill } = renderModal();
  fill('Flood Emergency');
  fireEvent.submit(form);
  await waitFor(() => expect(createAssistanceRequest).toHaveBeenCalledTimes(1));
  expect(createAssistanceRequest.mock.calls[0][0]).toMatchObject({ victimOfEmergency: 'Flood Emergency', photoUrl: null, mediaType: null });
  expect(await screen.findByText('Request Submitted')).toBeInTheDocument();
});

test('Other: typed emergency is what gets saved', async () => {
  const { $, form, fill } = renderModal();
  fill('Other');
  fireEvent.change($('input[name="emergencyOther"]'), { target: { value: '  Landslide ' } });
  fireEvent.submit(form);
  await waitFor(() => expect(createAssistanceRequest).toHaveBeenCalledTimes(1));
  expect(createAssistanceRequest.mock.calls[0][0].victimOfEmergency).toBe('Landslide');
});

test('Other with nothing typed is blocked', async () => {
  const { form, fill } = renderModal();
  fill('Other');
  fireEvent.submit(form);
  await waitFor(() => expect(showPopup).toHaveBeenCalledWith(expect.objectContaining({
    type: 'warning', message: 'Please specify the emergency you experienced.'
  })));
  expect(createAssistanceRequest).not.toHaveBeenCalled();
});

test('attached photo is sent as base64', async () => {
  const { form, fill, fileInput } = renderModal();
  fill('Fire Emergency');
  fireEvent.change(fileInput, { target: { files: [new File(['jpeg'], 'house.jpg', { type: 'image/jpeg' })] } });
  expect(await screen.findByAltText('Selected attachment preview')).toBeInTheDocument();
  fireEvent.submit(form);
  await waitFor(() => expect(createAssistanceRequest).toHaveBeenCalledTimes(1));
  const sent = createAssistanceRequest.mock.calls[0][0];
  expect(sent.photoUrl).toMatch(/^data:image\/jpeg;base64,/);
  expect(sent.mediaType).toBe('image');
});

test('editing a request typed under Other restores it into the Other box', async () => {
  const editingReport = {
    id: 5, title: 'Medical Aid', location: 'Somewhere, Sta. Fe', description: 'help', urgency: 'High',
    victim_of_emergency: 'Landslide', photo_url: 'data:image/jpeg;base64,AAA'
  };
  const { $, form } = renderModal({ editingReport });
  expect($('select[name="emergency"]').value).toBe('Other');
  expect($('input[name="emergencyOther"]').value).toBe('Landslide');
  expect(screen.getByText(/Attach a new file only if you want to replace/)).toBeInTheDocument();
  fireEvent.submit(form);
  await waitFor(() => expect(updateAssistanceRequest).toHaveBeenCalledTimes(1));
  const sent = updateAssistanceRequest.mock.calls[0][0];
  expect(sent.victimOfEmergency).toBe('Landslide');
  expect(sent).not.toHaveProperty('photoUrl'); // keeps the photo on file
});
