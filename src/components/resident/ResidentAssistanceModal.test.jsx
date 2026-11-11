import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ResidentAssistanceModal from './ResidentAssistanceModal';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { createAssistanceRequest, updateAssistanceRequest } from '../../Services/api';
import { showPopup } from '../shared/popup';

jest.setTimeout(20000); // some of these tests take ~4.5 s alone, near Jest's 5 s default, and time out on a busy run

// The photo / video date check has its own tests (mediaCheck.test.js); here
// every attachment counts as taken today.
jest.mock('../shared/media/mediaCheck', () => ({
  ...jest.requireActual('../shared/media/mediaCheck'),
  checkMediaFile: () => Promise.resolve({ ok: true, takenAt: new Date(), dayOld: false })
}));


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
  // Step 1: tapping a kind of help goes on to step 2.
  const pick = (kind = 'Medical Aid') => fireEvent.click(screen.getByRole('button', { name: new RegExp('^' + kind) }));
  const fill = (emergency) => {
    if (!$('textarea[name="situation"]')) pick();
    if (emergency) fireEvent.click(within(screen.getByRole('group', { name: 'Victim of what emergency?' })).getByRole('button', { name: EMERGENCY_LABEL[emergency] }));
    const situation = $('textarea[name="situation"]');
    if (situation) fireEvent.change(situation, { target: { value: 'We need help' } });
    const people = $('#as-people');
    if (people && !people.value) fireEvent.change(people, { target: { value: '3' } });
    const consent = $('input[name="consent"]');
    if (consent && !consent.checked) fireEvent.click(consent);
  };
  // Picking a file checks its details first, so wait for the preview.
  const attachPhoto = async () => {
    fireEvent.change($('input[type="file"]'), {
      target: { files: [new File(['jpeg'], 'house.jpg', { type: 'image/jpeg' })] }
    });
    await screen.findByAltText('Selected attachment preview');
  };
  return {
    ...utils, $, pick, fill, attachPhoto,
    get form() { return $('form'); },
    get fileInput() { return $('input[type="file"]'); }
  };
};
const EMERGENCY_LABEL = { 'Fire Emergency': 'Fire', 'Flood Emergency': 'Flood', Earthquake: 'Earthquake', Typhoon: 'Typhoon', Other: 'Other' };

test('two steps, as on Report Emergency: who and the kind of help, then the rest in sections', async () => {
  const { pick, $ } = renderModal();
  expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Me' })).toHaveAttribute('aria-pressed', 'true');
  const help = within(screen.getByRole('group', { name: /What help do you need\?/ })).getAllByRole('button').map((b) => b.querySelector('b').textContent);
  expect(help).toEqual(['Food & Water', 'Medical Aid', 'Transport Vehicle']);
  // nothing else to fill in, and no Send, until a kind of help is chosen
  expect($('textarea[name="situation"]')).toBeNull();
  expect(screen.queryByRole('button', { name: /Send request/ })).not.toBeInTheDocument();

  pick('Medical Aid');
  expect(screen.getByText('Step 2 of 2')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Medical Aid/ })).toBeInTheDocument();
  const titles = [...document.querySelectorAll('.qr-sec > .qr-lead')].map((n) => n.firstChild.textContent);
  expect(titles).toEqual(['About the request', 'Photo or video (proof)', 'Where should help go?', 'Confirm and send']);
  expect(screen.getByText('Photo or video (proof)').closest('.qr-lead')).toHaveTextContent('*');
  expect(screen.getByText(/^Required. It helps the barangay verify your request/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Take a photo/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Gallery/ })).toBeInTheDocument();
});

test('lists the Report Emergency types plus Other', async () => {
  const { pick } = renderModal();
  pick();
  const names = within(screen.getByRole('group', { name: 'Victim of what emergency?' })).getAllByRole('button').map((b) => b.textContent);
  expect(names).toEqual(['Fire', 'Flood', 'Earthquake', 'Typhoon', 'Other']);
});

test('Send stays off and says what is missing until the request is complete', async () => {
  const { pick, fill, attachPhoto } = renderModal();
  pick();
  const send = screen.getByRole('button', { name: /Send request/ });
  expect(send).toBeDisabled();
  expect(screen.getByRole('status')).not.toHaveTextContent('Ready to send.');
  fill('Flood Emergency');
  expect(screen.getByText('Add a photo or video as proof.')).toBeInTheDocument();
  await attachPhoto();
  expect(send).not.toBeDisabled();
  expect(screen.getByText('Ready to send.')).toBeInTheDocument();
});

test('Back goes to step 1 and keeps what was typed; another kind of help can be chosen', async () => {
  const { pick, $ } = renderModal();
  pick('Medical Aid');
  fireEvent.change($('textarea[name="situation"]'), { target: { value: 'We need help' } });
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^Medical Aid/ })).toHaveAttribute('aria-pressed', 'true');
  pick('Food & Water');
  expect(screen.getByRole('heading', { name: /Food & Water/ })).toBeInTheDocument();
  expect($('textarea[name="situation"]').value).toBe('We need help');
});

test('for someone else, step 2 says so and asks about them first', () => {
  const { pick, $ } = renderModal();
  fireEvent.click(screen.getByRole('button', { name: /Someone Else/i }));
  pick();
  expect($('.qr-head .qr-forchip')).toBeInTheDocument();
  expect($('.qr-body > .qr-forbox')).toBe($('.qr-body').firstElementChild);
});

test('people needing help: starts at 1, − and + change it', async () => {
  const { $, pick } = renderModal();
  pick();
  expect($('#as-people').value).toBe('1');
  fireEvent.click(screen.getByRole('button', { name: 'More people' }));
  fireEvent.click(screen.getByRole('button', { name: 'More people' }));
  expect($('#as-people').value).toBe('3');
  fireEvent.click(screen.getByRole('button', { name: 'Fewer people' }));
  expect($('#as-people').value).toBe('2');
});

test('only the X closes the form; a tap outside it does nothing', async () => {
  const onClose = jest.fn();
  const { container } = renderModal({ onClose });
  fireEvent.mouseDown(container.querySelector('.qr-overlay'));
  fireEvent.click(container.querySelector('.qr-overlay'));
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onClose).toHaveBeenCalledTimes(1);
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
  await attachPhoto();
  fireEvent.submit(form);
  await waitFor(() => expect(createAssistanceRequest).toHaveBeenCalledTimes(1));
  expect(createAssistanceRequest.mock.calls[0][0]).toMatchObject({ victimOfEmergency: 'Flood Emergency', mediaType: 'image' });
  expect(await screen.findByText('Request Submitted')).toBeInTheDocument();
});

test('Other: typed emergency is what gets saved', async () => {
  const { $, form, fill, attachPhoto } = renderModal();
  fill('Other');
  await attachPhoto();
  fireEvent.change($('input[name="emergencyOther"]'), { target: { value: '  Landslide ' } });
  fireEvent.submit(form);
  await waitFor(() => expect(createAssistanceRequest).toHaveBeenCalledTimes(1));
  expect(createAssistanceRequest.mock.calls[0][0].victimOfEmergency).toBe('Landslide');
});

test('Other with nothing typed is blocked', async () => {
  const { form, fill, attachPhoto } = renderModal();
  fill('Other');
  await attachPhoto();
  fireEvent.submit(form);
  await waitFor(() => expect(showPopup).toHaveBeenCalledWith(expect.objectContaining({
    type: 'warning', message: 'Please specify the emergency you experienced.'
  })));
  expect(createAssistanceRequest).not.toHaveBeenCalled();
});

test('attached photo is sent as base64', async () => {
  const { form, fill, $ } = renderModal();
  fill('Fire Emergency');
  fireEvent.change($('input[type="file"]'), { target: { files: [new File(['jpeg'], 'house.jpg', { type: 'image/jpeg' })] } });
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
  expect(screen.getByText('Step 2 of 2')).toBeInTheDocument(); // editing opens on step 2
  expect(within(screen.getByRole('group', { name: 'Victim of what emergency?' })).getByRole('button', { name: 'Other' })).toHaveAttribute('aria-pressed', 'true');
  expect($('input[name="emergencyOther"]').value).toBe('Landslide');
  expect(screen.getByText(/Attach a new file only if you want to replace/)).toBeInTheDocument();
  expect(screen.getByText('Photo or video (proof)').closest('.qr-lead')).toHaveTextContent('(optional)'); // the photo on file counts
  fireEvent.click($('input[name="consent"]'));
  expect(screen.getByRole('button', { name: /Save changes/ })).not.toBeDisabled();
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
  await attachPhoto();
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

test('special needs: + and − set how many, and 0 leaves the category out', async () => {
  const { $, form, fill, attachPhoto } = renderModal();
  fill('Flood Emergency');
  await attachPhoto();
  expect($('#as-special-count-elderly').value).toBe('');

  fireEvent.click(screen.getByRole('button', { name: 'One more: Elderly' }));
  fireEvent.click(screen.getByRole('button', { name: 'One more: Elderly' }));
  expect($('#as-special-count-elderly').value).toBe('2');

  fireEvent.change($('#as-special-count-children'), { target: { value: '3' } });
  fireEvent.click(screen.getByRole('button', { name: 'One more: Pets' }));
  fireEvent.click(screen.getByRole('button', { name: 'One less: Pets' }));
  expect($('#as-special-count-pets').value).toBe('');

  fireEvent.submit(form);
  await waitFor(() => expect(createAssistanceRequest).toHaveBeenCalledTimes(1));
  expect(createAssistanceRequest.mock.calls[0][0].special).toBe('Elderly (2), Children (3)');
}, 15000); // many taps, plus the attachment check

test('editing restores each special need with its number', async () => {
  const editingReport = {
    id: 6, title: 'Medical Aid', location: 'Somewhere, Sta. Fe', description: 'help',
    victim_of_emergency: 'Flood Emergency', has_media: 1, peopleAffected: 4,
    specialNeeds: 'Elderly (2), Pets'
  };
  const { $ } = renderModal({ editingReport });
  expect($('#as-people').value).toBe('4');
  expect($('#as-special-count-elderly').value).toBe('2');
  expect($('#as-special-count-elderly').closest('.sn-row')).toHaveClass('checked');
  // saved without a number (older reports): still selected, asking how many
  expect($('#as-special-count-pets').closest('.sn-row')).toHaveClass('checked');
  expect($('#as-special-count-pets').placeholder).toBe('?');
  expect($('#as-special-count-children').closest('.sn-row')).not.toHaveClass('checked');
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
  // The address boxes are on step 2; who it is for is on step 1.
  const toStep2 = () => fireEvent.click(screen.getByRole('button', { name: /^Medical Aid/ }));
  const backToStep1 = () => fireEvent.click(screen.getByRole('button', { name: 'Back' }));

  test('reporting for yourself fills it in, with a note', async () => {
    const { $ } = renderWithAddress();
    toStep2();
    await waitFor(() => expect($('input[name="houseNumber"]').value).toBe('Blk 5 Lot 12'));
    expect($('input[name="street"]').value).toBe('Sampaguita St.');
    expect(screen.getByText(HINT)).toBeInTheDocument();
  });

  test('for someone else the boxes are emptied for their address; back to yourself refills them', async () => {
    const { $ } = renderWithAddress();
    toStep2();
    await waitFor(() => expect($('input[name="houseNumber"]').value).toBe('Blk 5 Lot 12'));
    backToStep1();
    fireEvent.click(screen.getByRole('button', { name: /Someone Else/i }));
    toStep2();
    await waitFor(() => expect($('input[name="houseNumber"]').value).toBe(''));
    expect($('input[name="street"]').value).toBe('');
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();

    fireEvent.change($('input[name="houseNumber"]'), { target: { value: '9' } });
    fireEvent.change($('input[name="street"]'), { target: { value: 'Rizal St.' } });
    backToStep1();
    fireEvent.click(screen.getByRole('button', { name: 'Me' }));
    toStep2();
    // what was typed for the other person isn't replaced
    expect($('input[name="houseNumber"]').value).toBe('9');
  });

  test('a changed address is kept when switching to someone else', async () => {
    const { $ } = renderWithAddress();
    toStep2();
    await waitFor(() => expect($('input[name="houseNumber"]').value).toBe('Blk 5 Lot 12'));
    fireEvent.change($('input[name="houseNumber"]'), { target: { value: 'Blk 6 Lot 1' } });
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
    backToStep1();
    fireEvent.click(screen.getByRole('button', { name: /Someone Else/i }));
    toStep2();
    expect($('input[name="houseNumber"]').value).toBe('Blk 6 Lot 1');
  });

  test('no registered address: the boxes start empty', async () => {
    const { $ } = renderWithAddress(null);
    toStep2();
    expect($('input[name="houseNumber"]').value).toBe('');
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
  });
});
