import { render, screen } from '@testing-library/react';
import Contact from './Contact';
import { LanguageProvider } from '../../i18n/LanguageContext';

jest.mock('../../Services/api', () => ({
  fetchSiteContent: () => new Promise(() => {}),
  resolveAssetUrl: (u) => u
}));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('sf_language', 'en');
});

test('lists every hotline beside the 911 card, Bureau of Fire Protection included', () => {
  render(<LanguageProvider><Contact /></LanguageProvider>);
  expect(screen.getByText('Bureau of Fire Protection')).toBeInTheDocument();
  const bfp = screen.getByText('Bureau of Fire Protection').closest('a');
  expect(bfp).toHaveAttribute('href', 'tel:+639953360534');
  expect(bfp).toHaveTextContent('+63 995 336 0534');
  ['Dasmariñas Police', 'CDRMC', 'DSWD'].forEach((name) => expect(screen.getByText(name)).toBeInTheDocument());
  // the barangay: one row for each person on call
  const barangay = screen.getAllByText('Barangay Sta. Fe').map((el) => el.closest('a').getAttribute('href'));
  expect(barangay).toEqual(['tel:+639354984838', 'tel:+639456355303']);
  // 911 has its own card, not a row
  expect(document.querySelectorAll('.ct-row[href="tel:911"]')).toHaveLength(0);
});
