import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateAnnouncementView from './CreateAnnouncementView';
import { createAnnouncement } from '../../../Services/api';

// Types into the Message box (an editable area, not a textarea).
const typeMessage = (html) => {
  const box = screen.getByLabelText(/Message/);
  box.innerHTML = html;
  fireEvent.input(box);
  return box;
};

beforeEach(() => localStorage.clear());

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
  typeMessage('Walang pasok bukas.');
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

test('what was typed is kept when the form is closed and opened again, until Start over', () => {
  const first = render(<CreateAnnouncementView onCreated={() => {}} onCancel={() => {}} />);
  fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Draft title' } });
  typeMessage('Line one<br><br>Line two');
  first.unmount();

  render(<CreateAnnouncementView onCreated={() => {}} onCancel={() => {}} />);
  expect(screen.getByLabelText(/Title/)).toHaveValue('Draft title');
  expect(screen.getByLabelText(/Message/).innerHTML).toBe('Line one<br><br>Line two');
  expect(screen.getByText('Your unsaved draft was restored.')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Start over' }));
  expect(screen.getByLabelText(/Title/)).toHaveValue('');
});

test('Bold makes the selected text bold in the Message box itself, not with symbols', () => {
  render(<CreateAnnouncementView onCreated={() => {}} onCancel={() => {}} />);
  const box = typeMessage('Stay safe');
  const range = document.createRange();
  range.setStart(box.firstChild, 0);
  range.setEnd(box.firstChild, 4);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  fireEvent.click(screen.getByRole('button', { name: 'Bold' }));

  expect(box.querySelector('strong, b').textContent).toBe('Stay');
  expect(box.textContent).toBe('Stay safe'); // no ** in the box
  expect(screen.getByText('Stay', { selector: '.anf-card-text strong' })).toBeInTheDocument(); // the preview
});
