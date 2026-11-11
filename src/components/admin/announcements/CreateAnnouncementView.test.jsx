import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateAnnouncementView from './CreateAnnouncementView';
import { createAnnouncement } from '../../../Services/api';

jest.mock('../../../Services/api', () => ({
  fetchLinkPreview: jest.fn(),
  createAnnouncement: jest.fn(),
  updateAnnouncement: jest.fn(),
  isSessionError: () => false
}));

test('category buttons, a live preview, and posting sends the same fields as before', async () => {
  createAnnouncement.mockResolvedValue({ success: true });
  const onCreated = jest.fn();
  render(<CreateAnnouncementView onCreated={onCreated} onCancel={() => {}} />);

  expect(screen.getByRole('status')).toHaveTextContent('Add a title and a message.');
  fireEvent.click(screen.getByRole('button', { name: 'Weather Advisory' }));
  expect(screen.getByRole('button', { name: 'Weather Advisory' })).toHaveAttribute('aria-pressed', 'true');

  fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Class suspension' } });
  fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Walang pasok bukas.' } });
  expect(screen.getByRole('heading', { name: 'Class suspension' })).toBeInTheDocument(); // the preview card
  expect(screen.getByRole('status')).toHaveTextContent('Ready to post');

  fireEvent.click(screen.getByRole('button', { name: 'Post announcement' }));
  await waitFor(() => expect(createAnnouncement).toHaveBeenCalledTimes(1));
  const sent = createAnnouncement.mock.calls[0][0];
  expect(sent.get('title')).toBe('Class suspension');
  expect(sent.get('category')).toBe('Weather Advisory');
  expect(sent.get('message')).toBe('Walang pasok bukas.');
  await waitFor(() => expect(onCreated).toHaveBeenCalled());
});

test('Photo / News link switch shows one at a time', () => {
  render(<CreateAnnouncementView onCreated={() => {}} onCancel={() => {}} />);
  expect(screen.getByText('Choose a photo')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: /News link/ }));
  expect(screen.getByLabelText('News article link')).toBeInTheDocument();
  expect(screen.queryByText('Choose a photo')).toBeNull();
});
