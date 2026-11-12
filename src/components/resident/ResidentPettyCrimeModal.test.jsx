import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResidentPettyCrimeModal from './ResidentPettyCrimeModal';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { createPettyCrimeReport } from '../../Services/api';
import { showPopup } from '../shared/popup';

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
  createPettyCrimeReport: jest.fn(() => Promise.resolve({ success: true, id: 1 })),
  updatePettyCrimeReport: jest.fn(() => Promise.resolve({ success: true }))
}));
jest.setTimeout(20000); // the first render of this form is slow on a busy test run
jest.mock('../shared/popup', () => ({ showPopup: jest.fn() }));

const renderModal = () => {
  sessionStorage.setItem('currentUser', JSON.stringify({ id: 7, fullName: 'Juan Dela Cruz', contact: '09171234567' }));
  const utils = render(
    <LanguageProvider>
      <ResidentPettyCrimeModal show onClose={() => {}} />
    </LanguageProvider>
  );
  const $ = (sel) => utils.container.querySelector(sel);
  // Step 1: tapping a crime type goes on to step 2.
  const pick = (crimeType) => fireEvent.click(screen.getByRole('button', { name: new RegExp('^' + crimeType) }));
  const back = () => fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  // Step 2: the details.
  const fill = (crimeType) => {
    pick(crimeType);
    if (crimeType === 'Other') {
      fireEvent.change($('input[name="crimeOther"]'), { target: { value: 'Illegal gambling' } });
    }
    fireEvent.change($('textarea[name="description"]'), { target: { value: 'Something happened' } });
  };
  const attachPhoto = async () => {
    global.URL.createObjectURL = jest.fn(() => 'blob:preview');
    global.URL.revokeObjectURL = jest.fn();
    fireEvent.change($('input[type="file"]'), { target: { files: [new File(['fake-jpeg'], 'scene.jpg', { type: 'image/jpeg' })] } });
    await screen.findByAltText('Selected attachment preview');
  };
  // Step 2 → 3, then the confirmation box.
  const next = () => fireEvent.click(screen.getByRole('button', { name: /^Next/ }));
  const finish = () => {
    next();
    fireEvent.click($('input[name="consent"]'));
  };
  return {
    ...utils, $, pick, back, fill, attachPhoto, next, finish,
    get form() { return $('form'); },
    get fileInput() { return $('input[type="file"]'); }
  };
};
const sectionTitles = () => [...document.querySelectorAll('.qr-sec > .qr-lead')].map((n) => n.firstChild.textContent);


beforeEach(() => {
  createPettyCrimeReport.mockResolvedValue({ success: true, id: 1 });
});

test.each(['Theft', 'Suspicious Activity', 'Harassment'])('%s: photo is optional and the report submits without one', async (type) => {
  const view = renderModal();
  view.fill(type);
  expect(view.fileInput.required).toBe(false);
  expect(screen.getByText('Photo or video').closest('.qr-lead')).toHaveTextContent('(optional)');
  expect(screen.getByText(/Optional for this crime type/)).toBeInTheDocument();
  view.finish();
  expect(screen.getByRole('button', { name: /Send report/ })).not.toBeDisabled();
  fireEvent.submit(view.form);
  await waitFor(() => expect(createPettyCrimeReport).toHaveBeenCalledTimes(1));
  expect(createPettyCrimeReport.mock.calls[0][0]).toMatchObject({ crimeType: type, photoUrl: null });
  expect(await screen.findByText('Report Submitted')).toBeInTheDocument();
});

test.each(['Vandalism', 'Public Disturbance', 'Trespassing', 'Other'])('%s: photo is required; without one the report cannot go on', async (type) => {
  const view = renderModal();
  view.fill(type);
  expect(view.fileInput).toBeTruthy();
  expect(screen.getByText('Photo or video').closest('.qr-lead')).toHaveTextContent('*');
  expect(screen.getByRole('button', { name: /^Next/ })).toBeDisabled();
  expect(screen.getByText('Add a photo or video. It is required for this crime type.')).toBeInTheDocument();
  fireEvent.submit(view.form); // Enter in a box
  expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  expect(createPettyCrimeReport).not.toHaveBeenCalled();
});

describe('Other: the kind of incident in its own box', () => {
  test('the box shows only for Other, and goes (emptied) when another type is picked', () => {
    const { $, pick, back } = renderModal();
    const box = () => $('input[name="crimeOther"]');
    pick('Theft');
    expect(box()).toBeNull();
    back();
    pick('Other');
    expect(screen.getByLabelText(/Type of incident/)).toBe(box());
    expect(box()).toBeRequired();
    fireEvent.change(box(), { target: { value: 'Stray dogs' } });
    back();
    pick('Vandalism');
    expect(box()).toBeNull();
    back();
    pick('Other');
    expect(box().value).toBe('');
  });

  test('left empty: Next stays off and says what is missing; nothing is sent', async () => {
    const view = renderModal();
    view.pick('Other');
    fireEvent.change(view.$('textarea[name="description"]'), { target: { value: 'Something happened' } });
    await view.attachPhoto();
    expect(screen.getByText('Say what kind of incident it was.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Next/ })).toBeDisabled();
    fireEvent.submit(view.form);
    expect(createPettyCrimeReport).not.toHaveBeenCalled();
  });

  test('the typed kind of incident is saved as the crime type', async () => {
    const view = renderModal();
    view.fill('Other');
    await view.attachPhoto();
    view.finish();
    fireEvent.submit(view.form);
    await waitFor(() => expect(createPettyCrimeReport).toHaveBeenCalledTimes(1));
    expect(createPettyCrimeReport.mock.calls[0][0]).toMatchObject({ crimeType: 'Illegal gambling', description: 'Something happened' });
  });

  test('editing a report typed under Other puts it back in the box', () => {
    sessionStorage.setItem('currentUser', JSON.stringify({ id: 7, fullName: 'Juan Dela Cruz' }));
    const { container } = render(
      <LanguageProvider>
        <ResidentPettyCrimeModal show onClose={() => {}} editingReport={{ id: 3, title: 'Illegal gambling', description: 'Cards at night', location: 'Blk 1, Barangay Sta. Fe' }} />
      </LanguageProvider>
    );
    expect(screen.getByRole('heading', { name: /^Other/ })).toBeInTheDocument(); // opens on step 2
    expect(container.querySelector('input[name="crimeOther"]').value).toBe('Illegal gambling');
  });
});

test('required type: attaching a JPG submits it as a base64 image', async () => {
  const view = renderModal();
  view.fill('Vandalism');
  await view.attachPhoto();
  view.finish();
  fireEvent.submit(view.form);
  await waitFor(() => expect(createPettyCrimeReport).toHaveBeenCalledTimes(1));
  const sent = createPettyCrimeReport.mock.calls[0][0];
  expect(sent.photoUrl).toMatch(/^data:image\/jpeg;base64,/);
  expect(sent.mediaType).toBe('image');
  expect(await screen.findByText('Report Submitted')).toBeInTheDocument();
});

test('rejects files that are not JPG or a supported video', () => {
  const view = renderModal();
  view.fill('Vandalism');
  fireEvent.change(view.fileInput, { target: { files: [new File(['x'], 'shot.png', { type: 'image/png' })] } });
  expect(showPopup).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }));
  expect(screen.queryByAltText('Selected attachment preview')).not.toBeInTheDocument();
});

test('three steps, as on Report Emergency: who and what happened, the details, then where and confirm', async () => {
  const { $, pick, back, attachPhoto, next } = renderModal();
  expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Me' })).toHaveAttribute('aria-pressed', 'true');
  // nothing else to fill in, and no Next or Send, until a crime type is chosen
  expect($('textarea[name="description"]')).toBeNull();
  expect(screen.queryByRole('button', { name: /^Next|Send report/ })).not.toBeInTheDocument();

  pick('Vandalism');
  expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Vandalism/ })).toBeInTheDocument();
  expect(sectionTitles()).toEqual(['About the incident', 'Photo or video']);

  // Back keeps what was typed and the chosen type stays marked
  fireEvent.change($('textarea[name="description"]'), { target: { value: 'Paint on the wall' } });
  back();
  expect(screen.getByRole('button', { name: /^Vandalism/ })).toHaveAttribute('aria-pressed', 'true');
  pick('Trespassing');
  expect($('textarea[name="description"]').value).toBe('Paint on the wall');

  await attachPhoto();
  expect(screen.getByText('Next: where and confirm.')).toBeInTheDocument();
  next();
  expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
  expect(sectionTitles()).toEqual(['Where did the incident happen?', 'Confirm and send']);
  expect(screen.getByRole('button', { name: /Send report/ })).toBeDisabled();
  expect(screen.getByText('Tick the confirmation box to send.')).toBeInTheDocument();
  back();
  expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
});

test('there is no anonymous option; new reports carry the reporter', async () => {
  const view = renderModal();
  expect(screen.queryByLabelText(/Report anonymously/)).not.toBeInTheDocument();
  view.fill('Harassment');
  view.finish();
  fireEvent.submit(view.form);
  await waitFor(() => expect(createPettyCrimeReport).toHaveBeenCalledTimes(1));
  expect(createPettyCrimeReport.mock.calls[0][0].isAnonymous).toBeFalsy();
  expect(await screen.findByText('Report Submitted')).toBeInTheDocument();
});

describe('where the incident happened (step 3)', () => {
  const ADDRESS = { houseNumber: 'Blk 5 Lot 12', street: 'Sampaguita St.', area: 'Villa Santa Fe' };
  const renderWithAddress = () => {
    sessionStorage.setItem('currentUser', JSON.stringify({ id: 7, fullName: 'Juan Dela Cruz', address: ADDRESS }));
    const utils = render(
      <LanguageProvider>
        <ResidentPettyCrimeModal show onClose={() => {}} />
      </LanguageProvider>
    );
    const $ = (sel) => utils.container.querySelector(sel);
    // Theft needs no photo, so a description is enough to reach step 3.
    const toStep3 = () => {
      fireEvent.click(screen.getByRole('button', { name: /^Theft/ }));
      fireEvent.change($('textarea[name="description"]'), { target: { value: 'Bike stolen' } });
      fireEvent.click(screen.getByRole('button', { name: /^Next/ }));
    };
    return { ...utils, $, toStep3 };
  };

  test('"At my home" fills in the registered address, and the map is there to adjust the spot', async () => {
    const { $, toStep3 } = renderWithAddress();
    toStep3();
    expect(screen.getByRole('button', { name: /At my home/i })).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect($('input[name="houseNumber"]').value).toBe('Blk 5 Lot 12'));
    expect($('input[name="street"]').value).toBe('Sampaguita St.');
    expect(screen.getByRole('button', { name: /Use my current location/i })).toBeInTheDocument();
  });

  test('"Somewhere else" empties the address and shows the map tools', async () => {
    const { $, toStep3 } = renderWithAddress();
    toStep3();
    await waitFor(() => expect($('input[name="houseNumber"]').value).toBe('Blk 5 Lot 12'));
    fireEvent.click(screen.getByRole('button', { name: /Somewhere else/i }));
    await waitFor(() => expect($('input[name="houseNumber"]').value).toBe(''));
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
  fireEvent.click(screen.getByRole('button', { name: /^Theft/ }));
  fireEvent.change($('textarea[name="description"]'), { target: { value: 'Bike stolen' } });
  fireEvent.click(screen.getByRole('button', { name: /^Next/ }));
  await waitFor(() => expect($('input[name="houseNumber"]').value).toBe('Blk 5 Lot 12'));

  fireEvent.click(screen.getByRole('button', { name: /Somewhere else/i }));
  fireEvent.change($('input[name="street"]'), { target: { value: 'Rizal St.' } });

  rerender(view(false));
  rerender(view(true));
  expect(screen.getByText('Step 1 of 3')).toBeInTheDocument(); // starts over
  fireEvent.click(screen.getByRole('button', { name: /^Theft/ }));
  expect($('textarea[name="description"]').value).toBe('');
  fireEvent.change($('textarea[name="description"]'), { target: { value: 'Phone stolen' } });
  fireEvent.click(screen.getByRole('button', { name: /^Next/ }));
  await waitFor(() => expect($('input[name="houseNumber"]').value).toBe('Blk 5 Lot 12'));
  expect($('input[name="street"]').value).toBe('Sampaguita St.');
  expect(screen.getByRole('button', { name: /At my home/i })).toHaveAttribute('aria-pressed', 'true');
});

test('a photo or video too large for the server gets its own message', async () => {
  createPettyCrimeReport.mockResolvedValueOnce({ success: false, code: 'MEDIA_TOO_LARGE', message: 'too large' });
  const view = renderModal();
  view.fill('Theft');
  view.finish();
  fireEvent.submit(view.form);
  await waitFor(() => expect(showPopup).toHaveBeenCalledWith(expect.objectContaining({
    type: 'warning',
    title: 'Photo or video too large'
  })));
  expect(showPopup).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  expect(screen.queryByText('Report Submitted')).not.toBeInTheDocument();
});

test('seven crime types as buttons, in the saved order', () => {
  renderModal();
  const names = Array.from(document.querySelectorAll('.qr-tile b')).map((b) => b.textContent);
  expect(names).toEqual(['Theft', 'Vandalism', 'Public Disturbance', 'Suspicious Activity', 'Trespassing', 'Harassment', 'Other']);
});

test('editing opens on step 2 with the saved type; Save is on step 3', () => {
  sessionStorage.setItem('currentUser', JSON.stringify({ id: 7, fullName: 'Juan Dela Cruz' }));
  render(
    <LanguageProvider>
      <ResidentPettyCrimeModal show onClose={() => {}} editingReport={{ id: 3, title: 'Theft', description: 'Bike', location: 'Blk 1, Barangay Sta. Fe' }} />
    </LanguageProvider>
  );
  expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Theft/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /^Next/ }));
  expect(screen.getByRole('button', { name: /Save changes/ })).toBeInTheDocument();
});

describe('text checks', () => {
  test('keyboard spam in the description: a warning under it, and Next stays off until it is fixed', async () => {
    const { container, fill } = renderModal();
    fill('Theft');
    const description = container.querySelector('textarea[name="description"]');
    fireEvent.change(description, { target: { value: 'asdfghjkl' } });
    expect(await screen.findByText('Avoid using repeated or random characters.')).toBeInTheDocument();
    expect(screen.getByText('Fix the text marked in red to send.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Next/ })).toBeDisabled();

    fireEvent.change(description, { target: { value: 'Ninakaw ang bisikleta sa harap ng bahay' } });
    await waitFor(() => expect(screen.queryByText('Avoid using repeated or random characters.')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: /^Next/ })).not.toBeDisabled();
  });

  test('offensive words in the suspect details get their own warning', async () => {
    const { container, fill } = renderModal();
    fill('Theft');
    fireEvent.change(container.querySelector('textarea[name="suspectInfo"]'), { target: { value: 'yung gago na naka itim' } });
    expect(await screen.findByText('Please remove inappropriate or offensive language.')).toBeInTheDocument();
  });

  test('a TEXT_INVALID answer from the backend goes back to step 2 and shows under its field', async () => {
    createPettyCrimeReport.mockResolvedValueOnce({ success: false, code: 'TEXT_INVALID', fields: { description: 'meaningless' } });
    const view = renderModal();
    view.fill('Theft');
    view.finish();
    fireEvent.submit(view.form);
    expect(await screen.findByText('Please provide meaningful information about your report.')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });
});
