import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FacebookCardControl from './FacebookCardControl';
import { fetchFacebookCard, setFacebookCardEnabled, uploadFacebookCardImage } from '../../../Services/api';

jest.mock('../../../Services/api', () => ({
  fetchFacebookCard: jest.fn(),
  setFacebookCardEnabled: jest.fn(),
  uploadFacebookCardImage: jest.fn()
}));

const CARD = { enabled: true, imageUrl: '/images/facebook-page.jpg', pageUrl: 'https://www.facebook.com/profile.php?id=100080219150790' };

beforeEach(() => {
  fetchFacebookCard.mockResolvedValue(CARD);
});

test('shows the card with a link to the page, and no way to delete it', async () => {
  render(<FacebookCardControl />);
  const visit = await screen.findByRole('link', { name: /Visit page/ });
  expect(visit).toHaveAttribute('href', CARD.pageUrl);
  expect(screen.queryByRole('button', { name: /Delete|Remove/ })).toBeNull();
});

test('the switch turns it off and on', async () => {
  setFacebookCardEnabled.mockResolvedValue({ success: true, card: { ...CARD, enabled: false } });
  render(<FacebookCardControl />);
  const toggle = await screen.findByRole('switch');
  expect(toggle).toHaveAttribute('aria-checked', 'true');
  fireEvent.click(toggle);
  await waitFor(() => expect(setFacebookCardEnabled).toHaveBeenCalledWith(false));
  await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false'));
});

test('Change picture uploads the chosen image', async () => {
  uploadFacebookCardImage.mockResolvedValue({ success: true, card: { ...CARD, imageUrl: 'http://x/uploads/new.jpg' } });
  const { container } = render(<FacebookCardControl />);
  await screen.findByRole('switch');
  const file = new File(['img'], 'new.jpg', { type: 'image/jpeg' });
  fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });
  await waitFor(() => expect(uploadFacebookCardImage).toHaveBeenCalledWith(file));
});
