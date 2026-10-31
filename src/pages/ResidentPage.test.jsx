import { render, screen, fireEvent } from '@testing-library/react';
import ResidentPage from './ResidentPage';

// The page's own sections aren't under test.
jest.mock('../components/resident/ResidentNavbar', () => () => null);
jest.mock('../components/resident/ResidentHero', () => () => null);
jest.mock('../components/resident/EmergencyReportSection', () => () => null);
jest.mock('../components/shared/DonationFooter', () => () => null);
jest.mock('../components/resident/ResidentPettyCrimeModal', () => () => null);


jest.mock('../components/resident/ResidentEmergencyModal', () => ({ onRequestAssistance }) => (
  <button onClick={() => onRequestAssistance({ location: 'Pinned', latitude: 14.32, longitude: 120.94 })}>
    Request Assistance
  </button>
));
jest.mock('../components/resident/ResidentAssistanceModal', () => ({ show, prefill }) => (
  show ? <p>Assistance form open{prefill ? ` at ${prefill.latitude},${prefill.longitude}` : ''}</p> : null
));

test('"Request Assistance" after an emergency report opens the assistance form with that location', () => {
  render(<ResidentPage />);
  expect(screen.queryByText(/Assistance form open/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Request Assistance' }));
  expect(screen.getByText('Assistance form open at 14.32,120.94')).toBeInTheDocument();
});
