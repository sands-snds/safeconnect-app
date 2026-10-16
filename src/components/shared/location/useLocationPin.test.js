import { renderHook, act } from '@testing-library/react';
import useLocationPin from './useLocationPin';

// Regression: saved reports return MySQL DECIMAL coordinates as strings.
// A string pin sent Leaflet's bounds.contains() into infinite recursion
// ("Maximum call stack size exceeded"), crashing the page on Edit.
test('stores coordinates from the database as numbers', () => {
  const { result } = renderHook(() => useLocationPin());
  act(() => result.current.setGpsCoords({ lat: '14.3198000', lng: '120.9644000' }));
  expect(result.current.gpsCoords).toEqual({ lat: 14.3198, lng: 120.9644 });
  expect(typeof result.current.gpsCoords.lat).toBe('number');
  expect(result.current.isOutsideSantaFe).toBe(false);
});

test('missing or invalid coordinates mean no pin', () => {
  const { result } = renderHook(() => useLocationPin());
  act(() => result.current.setGpsCoords({ lat: 'abc', lng: null }));
  expect(result.current.gpsCoords).toBeNull();
  act(() => result.current.setGpsCoords(null));
  expect(result.current.gpsCoords).toBeNull();
});

test('setGpsCoords keeps the same identity across renders', () => {
  const { result, rerender } = renderHook(() => useLocationPin());
  const first = result.current.setGpsCoords;
  rerender();
  expect(result.current.setGpsCoords).toBe(first);
});
