import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SettingsPage from './SettingsPage';
import { LanguageProvider } from '../../i18n/LanguageContext';
import {
  fetchUserProfile, updateFullName, updateUsername, updateContact, updateEmail, changePassword, uploadProfilePhoto
} from '../../Services/api';

jest.mock('../../Services/api', () => ({
  fetchUserProfile: jest.fn(),
  updateFullName: jest.fn(),
  updateUsername: jest.fn(),
  updateContact: jest.fn(),
  updateEmail: jest.fn(),
  changePassword: jest.fn(),
  uploadProfilePhoto: jest.fn()
}));

const ROW = {
  id: 7, full_name: 'Juan Dela Cruz', username: 'juandc', contact_number: '+639171234567',
  email_address: 'juan@example.com', role: 'resident', status: 'Active', created_at: '2026-01-15T00:00:00Z', photoUrl: null
};

// jsdom can't decode images or draw on canvases; stand-ins for the photo editor.
class FakeImage {
  constructor() { this.naturalWidth = 1200; this.naturalHeight = 800; }
  set src(v) { this._src = v; setTimeout(() => this.onload && this.onload(), 0); }
  get src() { return this._src; }
}

let onProfileUpdate;
beforeEach(() => {
  localStorage.setItem('sf_language', 'en');
  fetchUserProfile.mockResolvedValue(ROW);
  onProfileUpdate = jest.fn();
  global.URL.createObjectURL = jest.fn(() => 'blob:photo');
  global.URL.revokeObjectURL = jest.fn();
  global.Image = FakeImage;
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({ fillRect: jest.fn(), drawImage: jest.fn(), set fillStyle(v) {}, set imageSmoothingQuality(v) {} }));
  HTMLCanvasElement.prototype.toBlob = function (cb, type) { cb(new Blob(['jpeg'], { type })); };
});

const renderSettings = async () => {
  const utils = render(
    <LanguageProvider>
      <SettingsPage isOpen user={{ id: 7, fullName: 'Juan Dela Cruz' }} onProfileUpdate={onProfileUpdate} onClose={() => {}} />
    </LanguageProvider>
  );
  await waitFor(() => expect(screen.getByLabelText('Full name')).toHaveValue('Juan Dela Cruz'));
  return utils;
};

test('shows a profile summary and section navigation', async () => {
  await renderSettings();
  expect(screen.getByText('juandc')).toBeInTheDocument();
  expect(screen.getByText('juan@example.com')).toBeInTheDocument();
  for (const name of ['Profile', 'Contact details', 'Password & security', 'Account']) {
    expect(screen.getByRole('button', { name: new RegExp(name) })).toBeInTheDocument();
  }
  fireEvent.click(screen.getByRole('button', { name: /Account/ }));
  expect(screen.getByText('Active')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Account/ })).toHaveAttribute('aria-current', 'page');
});

describe('Full name', () => {
  test('Save is disabled until something changes', async () => {
    await renderSettings();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Juan P. Dela Cruz' } });
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  });

  test('saves the new name (tidied), updates the summary and the signed-in user', async () => {
    updateFullName.mockResolvedValue({ success: true, fullName: 'Ma. Clara Dela Cruz-Santos' });
    await renderSettings();
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: '  Ma.  Clara Dela Cruz-Santos ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(updateFullName).toHaveBeenCalledWith(7, 'Ma. Clara Dela Cruz-Santos'));
    expect(await screen.findByText('Your profile has been updated.')).toBeInTheDocument();
    expect(screen.getByText('Ma. Clara Dela Cruz-Santos', { selector: '.st-summary-name' })).toBeInTheDocument();
    expect(onProfileUpdate).toHaveBeenCalledWith({ fullName: 'Ma. Clara Dela Cruz-Santos' });
    expect(updateUsername).not.toHaveBeenCalled();
  });

  test('rejects names with invalid characters without calling the server', async () => {
    await renderSettings();
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Juan <script>' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText(/Full name can only contain letters/)).toBeInTheDocument();
    expect(updateFullName).not.toHaveBeenCalled();
  });

  test('accepts names with letters like ñ', async () => {
    updateFullName.mockResolvedValue({ success: true, fullName: 'José Niño' });
    await renderSettings();
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'José Niño' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(updateFullName).toHaveBeenCalledWith(7, 'José Niño'));
  });

  test('Cancel puts the saved values back', async () => {
    await renderSettings();
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Someone Else' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByLabelText('Full name')).toHaveValue('Juan Dela Cruz');
  });

  test('changing only the username calls only the username endpoint', async () => {
    updateUsername.mockResolvedValue({ success: true, username: 'juan2026' });
    await renderSettings();
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'juan2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(updateUsername).toHaveBeenCalledWith(7, 'juan2026'));
    expect(updateFullName).not.toHaveBeenCalled();
  });
});

describe('Contact details', () => {
  const openContact = async () => {
    await renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /Contact details/ }));
  };

  test('loads the phone number into the +63 field', async () => {
    await openContact();
    expect(screen.getByLabelText('Phone number')).toHaveValue('9171234567');
  });

  test('changing the email asks for the current password first', async () => {
    await openContact();
    expect(screen.queryByLabelText(/Enter your current password to change your email/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'new@example.com' } });
    expect(screen.getByLabelText(/Enter your current password to change your email/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Enter your current password to confirm this change.')).toBeInTheDocument();
    expect(updateEmail).not.toHaveBeenCalled();
  });

  test('saves phone and email together', async () => {
    updateContact.mockResolvedValue({ success: true });
    updateEmail.mockResolvedValue({ success: true });
    await openContact();
    fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '9987654321' } });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/Enter your current password to change your email/), { target: { value: 'Secret123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(updateEmail).toHaveBeenCalledWith(7, 'new@example.com', 'Secret123!'));
    expect(updateContact).toHaveBeenCalledWith(7, '+639987654321');
    expect(await screen.findByText('Your contact details have been updated.')).toBeInTheDocument();
  });
});

describe('Password', () => {
  const openSecurity = async () => {
    await renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /Password & security/ }));
  };

  test('a weak new password is blocked with the same rules as Sign Up', async () => {
    await openSecurity();
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'OldPass1!' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'weakpass' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'weakpass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByText('Your new password must meet all the requirements below.')).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  test('a strong password is saved and the fields are cleared', async () => {
    changePassword.mockResolvedValue({ success: true });
    await openSecurity();
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'OldPass1!' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'NewPass2@' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'NewPass2@' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
    await waitFor(() => expect(changePassword).toHaveBeenCalledWith(7, 'OldPass1!', 'NewPass2@'));
    expect(await screen.findByText('Password updated.')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toHaveValue('');
  });
});

describe('Profile photo', () => {
  const choosePhoto = async (container) => {
    const file = new File(['img'], 'me.png', { type: 'image/png' });
    fireEvent.change(container.querySelector('[data-testid="photo-input"]'), { target: { files: [file] } });
    return screen.findByRole('dialog', { name: 'Adjust your photo' });
  };

  test('choosing a photo opens the editor on top of the page (not inside the Settings panel)', async () => {
    const { container } = await renderSettings();
    const dialog = await choosePhoto(container);
    expect(dialog.closest('.settings-fullscreen')).toBeNull();
    expect(screen.getByRole('slider', { name: 'Zoom' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Recenter/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Profile' })).toBeInTheDocument(); // live preview
    expect(uploadProfilePhoto).not.toHaveBeenCalled();
  });

  test('zoom controls change the zoom; Recenter resets it', async () => {
    const { container } = await renderSettings();
    await choosePhoto(container);
    const slider = screen.getByRole('slider', { name: 'Zoom' });
    await waitFor(() => expect(slider).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(Number(slider.value)).toBeCloseTo(1.4);
    fireEvent.change(slider, { target: { value: '3' } });
    expect(Number(slider.value)).toBe(3);
    fireEvent.click(screen.getByRole('button', { name: /Recenter/ }));
    expect(Number(slider.value)).toBe(1);
  });

  test('Save uploads the cropped JPEG and shows the new photo', async () => {
    uploadProfilePhoto.mockResolvedValue({ success: true, photoUrl: 'http://localhost:5000/uploads/new.jpg' });
    const { container } = await renderSettings();
    await choosePhoto(container);
    const save = screen.getByRole('button', { name: 'Save Photo' });
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);
    await waitFor(() => expect(uploadProfilePhoto).toHaveBeenCalledTimes(1));
    const [userId, uploaded] = uploadProfilePhoto.mock.calls[0];
    expect(userId).toBe(7);
    expect(uploaded.type).toBe('image/jpeg');
    expect(await screen.findByText('Profile photo updated successfully.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Adjust your photo' })).not.toBeInTheDocument();
    expect(container.querySelector('.st-avatar img')).toHaveAttribute('src', 'http://localhost:5000/uploads/new.jpg');
    expect(onProfileUpdate).toHaveBeenCalledWith({ photoUrl: 'http://localhost:5000/uploads/new.jpg' });
  });

  test('Cancel closes the editor without uploading', async () => {
    const { container } = await renderSettings();
    await choosePhoto(container);
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel' }).pop());
    expect(screen.queryByRole('dialog', { name: 'Adjust your photo' })).not.toBeInTheDocument();
    expect(uploadProfilePhoto).not.toHaveBeenCalled();
  });

  test('rejects files that are not images', async () => {
    const { container } = await renderSettings();
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.change(container.querySelector('[data-testid="photo-input"]'), { target: { files: [file] } });
    expect(await screen.findByText('Please choose a JPG, PNG, or WEBP image.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Adjust your photo' })).not.toBeInTheDocument();
  });
});
