import { render } from '@testing-library/react';
import L from 'leaflet';
import { LimitToSantaFe } from './mapLimits';
import { SANTA_FE_BOUNDARY, SANTA_FE_CENTER } from './santaFeArea';

// A stand-in for the Leaflet map that records what the limit sets.
const fakeMap = { options: {} };
jest.mock('react-leaflet', () => ({ useMap: () => fakeMap }));

beforeEach(() => {
  Object.assign(fakeMap, {
    options: {},
    setMaxBounds: jest.fn(),
    getBoundsZoom: jest.fn(() => 15),
    setMinZoom: jest.fn(),
    getZoom: jest.fn(() => 14),
    setZoom: jest.fn(),
    panInsideBounds: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  });
});

const area = () => fakeMap.setMaxBounds.mock.calls.at(-1)[0];
const FAR = [14.5995, 120.9842]; // Manila, well outside the barangay

test('the map cannot be dragged away from Santa Fe (a hard edge)', () => {
  render(<LimitToSantaFe />);
  expect(fakeMap.options.maxBoundsViscosity).toBe(1);
  expect(area().contains(L.latLngBounds(SANTA_FE_BOUNDARY))).toBe(true);
  expect(area().contains([SANTA_FE_CENTER.lat, SANTA_FE_CENTER.lng])).toBe(true);
  expect(area().contains(FAR)).toBe(false);
  expect(fakeMap.panInsideBounds).toHaveBeenCalled();
});

test('zooming out stops when the whole barangay fits; zooming in is not limited', () => {
  render(<LimitToSantaFe />);
  expect(fakeMap.setMinZoom).toHaveBeenCalledWith(15);
  expect(fakeMap.setZoom).toHaveBeenCalledWith(15); // was zoomed out further
  expect(fakeMap.options.maxZoom).toBeUndefined();
});
