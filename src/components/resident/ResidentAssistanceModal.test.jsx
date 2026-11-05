import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResidentAssistanceModal from './ResidentAssistanceModal';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { createAssistanceRequest, updateAssistanceRequest } from '../../Services/api';
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
  createAssistanceRequest: jest.fn(),
  updateAssistanceRequest: jest.fn()
}));
jest.mock('../shared/popup', () => ({ showPopup: jest.fn() }));


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
    const people = $('#as-people');
    if (people && !people.value) fireEvent.change(people, { target: { value: '3' } });
    const consent = $('input[name="consent"]');
    if (consent && !consent.checked) fireEvent.click(consent);
  };
  const attachPhoto = () => fireEvent.change($('input[type="file"]'), {
    target: { files: [new File(['jpeg'], 'house.jpg', { type: 'image/jpeg' })] }
  });
  return { ...utils, $, fill, attachPhoto, form: $('form'), fileInput: $('input[type="file"]') };
};

test('shows "Victim of What Emergency?" and the photo field beside it, both required', () => {
  const { $, fileInput } = renderModal();
  expect(screen.getByText('Victim of What Emergency?')).toBeInTheDocument();
  expect($('select[name="emergency"]').required).toBe(true);
  expect(screen.getByText('Photo or Video (Proof)')).toBeInTheDocument();
  expect(fileInput.required).toBe(true);
  expect(screen.getByText(/^Required. It helps the barangay verify your request/)).toBeInTheDocument();
  // Same grid row
  expect($('select[name="emergency"]').closest('.rf-2col')).toBe(fileInput.closest('.rf-2col'));
});

test('lists the Report Emergency types plus Other', () => {
  const { $ } = renderModal();
  const values = [...$('select[name="emergency"]').options].map((o) => o.value);
  expect(values).toEqual(['', 'Fire Emergency', 'Flood Emergency', 'Earthquake', 'Typhoon', 'Other']);
});

test('submitting without a photo is blocked', async () => {
  const { form, fill } = renderModal();
  fill('Flood Emergency');
  fireEvent.submit(form);
  await waitFor(() => expect(showPopup).toHaveBeenCalledWith(expect.objectContaining({
    type: 'warning', message: expect.stringMatching(/^Please attach a photo or video of your situation/)
  })));
  expect(createAssistanceRequest).not.toHaveBeenCalled();
});

test('submits the chosen emergency with the photo', async () => {
  const { form, fill, attachPhoto } = renderModal();
  fill('Flood Emergency');
  attachPhoto();
  fireEvent.submit(form);
  await waitFor(() => expect(createAssistanceRequest).toHaveBeenCalledTimes(1));
  expect(createAssistanceRequest.mock.calls[0][0]).toMatchObject({ victimOfEmergency: 'Flood Emergency', mediaType: 'image' });
  expect(await screen.findByText('Request Submitted')).toBeInTheDocument();
});

test('Other: typed emergency is what gets saved', async () => {
  const { $, form, fill, attachPhoto } = renderModal();
  fill('Other');
  attachPhoto();
  fireEvent.change($('input[name="emergencyOther"]'), { target: { value: '  Landslide ' } });
  fireEvent.submit(form);
  await waitFor(() => expect(createAssistanceRequest).toHaveBeenCalledTimes(1));
  expect(createAssistanceRequest.mock.calls[0][0].victimOfEmergency).toBe('Landslide');
});

test('Other with nothing typed is blocked', async () => {
  const { form, fill, attachPhoto } = renderModal();
  fill('Other');
  attachPhoto();
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
    victim_of_emergency: 'Landslide', has_media: 1, peopleAffected: 4
  };
  const { $, form } = renderModal({ editingReport });
  expect($('select[name="emergency"]').value).toBe('Other');
  expect($('input[name="emergencyOther"]').value).toBe('Landslide');
  expect(screen.getByText(/Attach a new file only if you want to replace/)).toBeInTheDocument();
  expect($('input[type="file"]').required).toBe(false); // the photo on file counts
  fireEvent.submit(form);
  await waitFor(() => expect(updateAssistanceRequest).toHaveBeenCalledTimes(1));
  const sent = updateAssistanceRequest.mock.calls[0][0];
  expect(sent.victimOfEmergency).toBe('Landslide');
  expect(sent.people).toBe(4);
  expect(sent).not.toHaveProperty('photoUrl'); // keeps the photo on file
});

test('the number of people needing help is required and sent', async () => {
  const { $, form, fill, attachPhoto } = renderModal();
  fill('Flood Emergency');
  attachPhoto();
  fireEvent.change($('#as-people'), { target: { value: '' } });
  fireEvent.submit(form);
  await waitFor(() => expect(showPopup).toHaveBeenCalledWith(expect.objectContaining({
    message: 'Please enter how many people need help (1 to 500).'
  })));
  expect(createAssistanceRequest).not.toHaveBeenCalled();

  fireEvent.change($('#as-people'), { target: { value: '6' } });
  fireEvent.submit(form);
  await waitFor(() => expect(createAssistanceRequest).toHaveBeenCalledTimes(1));
  expect(createAssistanceRequest.mock.calls[0][0].people).toBe(6);
});

test('a ticked special need asks how many, and both are saved', async () => {
  const { $, form, fill, attachPhoto } = renderModal();
  fill('Flood Emergency');
  attachPhoto();
  expect($('#as-special-count-elderly')).toBeNull();
  fireEvent.click(screen.getByLabelText('Elderly'));
  fireEvent.click(screen.getByLabelText('Children'));
  expect($('#as-special-count-elderly')).not.toBeNull();

  fireEvent.change($('#as-special-count-elderly'), { target: { value: '2' } });
  fireEvent.submit(form);
  await waitFor(() => expect(showPopup).toHaveBeenCalledWith(expect.objectContaining({
    message: 'Please enter how many for "Children" (1 to 999).'
  })));
  expect(createAssistanceRequest).not.toHaveBeenCalled();

  fireEvent.change($('#as-special-count-children'), { target: { value: '3' } });
  fireEvent.submit(form);
  await waitFor(() => expect(createAssistanceRequest).toHaveBeenCalledTimes(1));
  expect(createAssistanceRequest.mock.calls[0][0].special).toBe('Elderly (2), Children (3)');
});

test('editing restores each special need with its number', () => {
  const editingReport = {
    id: 6, title: 'Medical Aid', location: 'Somewhere, Sta. Fe', description: 'help',
    victim_of_emergency: 'Flood Emergency', has_media: 1, peopleAffected: 4,
    specialNeeds: 'Elderly (2), Pets'
  };
  const { $ } = renderModal({ editingReport });
  expect($('#as-people').value).toBe('4');
  expect(screen.getByLabelText('Elderly')).toBeChecked();
  expect($('#as-special-count-elderly').value).toBe('2');
  expect(screen.getByLabelText('Pets')).toBeChecked();
  expect($('#as-special-count-pets').value).toBe('');
});

describe('registered address', () => {
  const ADDRESS = { houseNumber: 'Blk 5 Lot 12', street: 'Sampaguita St.', area: 'Villa Santa Fe' };
  const renderWithAddress = (address = ADDRESS) => {
    sessionStorage.setItem('currentUser', JSON.stringify({ id: 7, fullName: 'Juan Dela Cruz', address }));
    const utils = render(
      <LanguageProvider>
        <ResidentAssistanceModal show onClose={() => {}} />
      </LanguageProvider>
    );
    return { ...utils, $: (sel) => utils.container.querySelector(sel) };
  };
  const HINT = 'Filled in from your registered address. You can change it.';

  test('reporting for yourself fills it in, with a note', async () => {
    const { $ } = renderWithAddress();
    await waitFor(() => expect($('input[name="houseNumber"]').value).toBe('Blk 5 Lot 12'));
    expect($('input[name="street"]').value).toBe('Sampaguita St.');
    expect($('input[name="area"]').value).toBe('Villa Santa Fe');
    expect(screen.getByText(HINT)).toBeInTheDocument();
  });

  test('for someone else the boxes are emptied for their address; back to yourself refills them', async () => {
    const { $ } = renderWithAddress();
    await waitFor(() => expect($('input[name="houseNumber"]').value).toBe('Blk 5 Lot 12'));
    fireEvent.click(screen.getByRole('button', { name: /Someone Else/i }));
    await waitFor(() => expect($('input[name="houseNumber"]').value).toBe(''));
    expect($('input[name="street"]').value).toBe('');
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();

    fireEvent.change($('input[name="houseNumber"]'), { target: { value: '9' } });
    fireEvent.change($('input[name="street"]'), { target: { value: 'Rizal St.' } });
    fireEvent.click(screen.getByRole('button', { name: /Myself/i }));
    // what was typed for the other person isn't replaced
    expect($('input[name="houseNumber"]').value).toBe('9');
  });

  test('a changed address is kept when switching to someone else', async () => {
    const { $ } = renderWithAddress();
    await waitFor(() => expect($('input[name="houseNumber"]').value).toBe('Blk 5 Lot 12'));
    fireEvent.change($('input[name="houseNumber"]'), { target: { value: 'Blk 6 Lot 1' } });
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Someone Else/i }));
    expect($('input[name="houseNumber"]').value).toBe('Blk 6 Lot 1');
  });

  test('no registered address: the boxes start empty', () => {
    const { $ } = renderWithAddress(null);
    expect($('input[name="houseNumber"]').value).toBe('');
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
  });
});
