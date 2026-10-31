import { render, screen, fireEvent, act } from '@testing-library/react';
import { PopupHost, confirmPopup, showPopup } from './popup';
import { LanguageProvider } from '../../i18n/LanguageContext';

const renderHost = () => render(<LanguageProvider><PopupHost /></LanguageProvider>);

beforeEach(() => localStorage.setItem('sf_language', 'en'));

const ask = () => {
  let answer;
  act(() => {
    confirmPopup({
      type: 'danger',
      title: 'Delete this report?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete'
    }).then((a) => { answer = a; });
  });
  return () => answer;
};

test('shows a styled confirmation with Cancel and the confirm button', () => {
  renderHost();
  ask();
  const dialog = screen.getByRole('alertdialog', { name: 'Delete this report?' });
  expect(dialog).toHaveTextContent('This cannot be undone.');
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  expect(dialog.querySelector('.bi-trash3-fill')).not.toBeNull();
  
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
});

test.each([
  ['Delete', () => fireEvent.click(screen.getByRole('button', { name: 'Delete' })), true],
  ['Cancel', () => fireEvent.click(screen.getByRole('button', { name: 'Cancel' })), false],
  ['Escape', () => fireEvent.keyDown(document, { key: 'Escape' }), false],
  ['clicking outside', () => fireEvent.click(screen.getByRole('alertdialog').parentElement), false]
])('%s resolves %s and closes the popup', async (_, act_, expected) => {
  renderHost();
  const answer = ask();
  await act(async () => { act_(); });
  expect(answer()).toBe(expected);
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});

test('ordinary popups still have a single button', () => {
  renderHost();
  act(() => showPopup({ type: 'success', title: 'Report Deleted', message: 'Done.' }));
  expect(screen.getAllByRole('button')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
});
