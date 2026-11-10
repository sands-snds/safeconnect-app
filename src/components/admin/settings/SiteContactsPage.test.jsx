import { render, screen, fireEvent, within } from '@testing-library/react';
import SiteContactsPage from './SiteContactsPage';
import { fetchSiteContent } from '../../../Services/api';

jest.mock('../../../Services/api', () => ({ fetchSiteContent: jest.fn(), updateSiteContent: jest.fn() }));
jest.mock('../../shared/popup', () => ({ showPopup: jest.fn(), confirmPopup: jest.fn(() => Promise.resolve(true)) }));
jest.mock('../../shared/useSiteContent', () => ({ setSiteContent: jest.fn(), officialName: (o) => [o.position, o.firstName, o.lastName].filter(Boolean).join(' ') }));
jest.mock('../../shared/EmergencyContactList', () => () => null);
jest.mock('../../shared/DonationFooter', () => () => null);

const CONTENT = {
  emergencyContacts: [
    { id: 'c911', label: '911 Emergency', description: 'National Emergency Hotline', number: '911', icon: 'bi-shield-fill-exclamation', color: '#dc2626' },
    { id: 'brgy', label: 'Barangay Sta. Fe', description: 'Barangay line', number: '+639171234567', numberType: 'mobile', icon: 'bi-house-fill', color: '#6B2C3E',
      choices: [{ name: 'PB Juan', number: '+639181234567', numberType: 'mobile' }] }
  ],
  officials: [{ position: 'PB', firstName: 'Emmanuel', middleName: 'B.', lastName: 'Noora', number: '+639354984838', numberType: 'mobile' }],
  footerHotlines: [{ label: '911 Emergency', number: '911' }],
  socials: { email: 'a@b.com', facebookLabel: 'Sta. Fe', facebookUrl: 'https://www.facebook.com/x' }
};

beforeEach(() => {
  fetchSiteContent.mockResolvedValue({ content: CONTENT, options: { icons: ['bi-shield-fill-exclamation', 'bi-house-fill'], colors: ['#dc2626', '#6B2C3E'] } });
});

const tables = async () => {
  render(<SiteContactsPage />);
  await screen.findByText('Emergency Contacts');
  return screen.getAllByRole('table');
};

test('call button, officials and hotline are tables with the columns in order', async () => {
  const [contacts, officials, hotlines] = await tables();
  const heads = (t) => within(t).getAllByRole('columnheader').map((h) => h.textContent);
  expect(heads(contacts)).toEqual(['Color', 'Icon', 'Name', 'Description', 'Number', 'People to choose from', 'Shown', 'Order']);
  expect(heads(officials)).toEqual(['Position', 'First name', 'Middle name (optional)', 'Last name', 'Number type', 'Number', 'Order']);
  expect(heads(hotlines)).toEqual(['Name', 'Number', 'Order']);
  // the socials stay as they were (not a table)
  expect(screen.getAllByRole('table')).toHaveLength(3);
  expect(screen.getByDisplayValue('a@b.com')).toBeInTheDocument();
});

test('911 has the On / Off switch and no Remove; other contacts can be removed', async () => {
  const [contacts] = await tables();
  const [row911, rowBrgy] = within(contacts).getAllByRole('row').slice(1);
  expect(within(row911).getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  expect(within(row911).queryByRole('button', { name: 'Remove' })).toBeNull();
  expect(within(rowBrgy).getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  expect(within(rowBrgy).getByText('Always')).toBeInTheDocument();
});

test('"People to choose from" opens a row under the contact', async () => {
  const [contacts] = await tables();
  expect(screen.queryByDisplayValue('PB Juan')).toBeNull();
  fireEvent.click(within(contacts).getByRole('button', { name: /1 people/ }));
  expect(screen.getByDisplayValue('PB Juan')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Add person/ })).toBeInTheDocument();
});

test("the color dot opens the colors and picking one changes the contact's color", async () => {
  const [contacts] = await tables();
  const rowBrgy = within(contacts).getAllByRole('row')[2];
  fireEvent.click(within(rowBrgy).getByRole('button', { name: /Barangay Sta\. Fe color/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Color #dc2626' }));
  expect(within(rowBrgy).getByRole('button', { name: /Barangay Sta\. Fe color/ })).toHaveStyle({ background: '#dc2626' });
  expect(screen.getByText('You have unsaved changes.')).toBeInTheDocument();
});

test("an official's number type and number are separate columns that work together", async () => {
  const [, officials] = await tables();
  const row = within(officials).getAllByRole('row')[1];
  const type = within(row).getByRole('combobox');
  fireEvent.change(type, { target: { value: 'landline' } });
  expect(within(row).getByDisplayValue('935498483')).toBeInTheDocument(); // landline keeps 9 digits
});
