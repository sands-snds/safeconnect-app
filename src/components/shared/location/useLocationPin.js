import { useState, useRef, useCallback, useEffect } from 'react';
import { isWithinSantaFe, OUTSIDE_SANTA_FE_MESSAGE } from './santaFeArea';
import { reverseGeocode, forwardGeocode } from './geocode';

// How long typing has to pause before the typed address is looked up.
const ADDRESS_SEARCH_DELAY_MS = 900;

const toCoords = (coords) => {
  if (!coords) return null;
  const lat = Number(coords.lat);
  const lng = Number(coords.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

// The map pin of a report form, kept in step with its address boxes both ways:
// pinning the map fills the address (onAddress), and typing an address moves
// the pin there (pinFromAddress). addressSearch is 'idle', 'searching',
// 'found' or 'notFound'.
export default function useLocationPin({ onAddress } = {}) {
  const [gpsCoords, setStoredCoords] = useState(null); // { lat, lng } numbers, or null
  const setGpsCoords = useCallback((coords) => setStoredCoords(toCoords(coords)), []);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [addressSearch, setAddressSearch] = useState('idle');
  const lookupId = useRef(0);
  const searchTimer = useRef(null);

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const isOutsideSantaFe = Boolean(gpsCoords) && !isWithinSantaFe(gpsCoords.lat, gpsCoords.lng);

  // Any newer pin or search makes older lookups' answers stale.
  const nextLookup = useCallback(() => {
    clearTimeout(searchTimer.current);
    return ++lookupId.current;
  }, []);

  const pinAt = useCallback(async (lat, lng, { accuracy } = {}) => {
    setGpsCoords({ lat, lng });
    setAddressSearch('idle');
    const id = nextLookup();

    if (!isWithinSantaFe(lat, lng)) {
      setLocationError('');
      return;
    }

    setLocationError(
      accuracy && accuracy > 100
        ? `Location accuracy is low (~${Math.round(accuracy)}m). Please check the pin and drag it if needed.`
        : ''
    );

    try {
      const address = await reverseGeocode(lat, lng);
      if (id === lookupId.current && onAddress) onAddress(address);
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    }
  }, [onAddress, setGpsCoords, nextLookup]);

  // Typed address → pin, after typing pauses. Doesn't touch the typed text.
  const pinFromAddress = useCallback((parts) => {
    const id = nextLookup();
    if (!parts || (!String(parts.street || '').trim() && !String(parts.area || '').trim())) {
      setAddressSearch('idle');
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setAddressSearch('searching');
      try {
        const found = await forwardGeocode(parts);
        if (id !== lookupId.current) return;
        if (found) {
          setGpsCoords(found);
          setLocationError('');
        }
        setAddressSearch(found ? 'found' : 'notFound');
      } catch (err) {
        console.error('Address search error:', err);
        if (id === lookupId.current) setAddressSearch('notFound');
      }
    }, ADDRESS_SEARCH_DELAY_MS);
  }, [nextLookup, setGpsCoords]);

  const handleUseCurrentLocation = useCallback(() => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser. Tap the map to pin your location instead.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        await pinAt(latitude, longitude, { accuracy });
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access was denied. Tap the map to pin your location, or type your address.'
            : 'Unable to get your location. Tap the map to pin your location, or type your address.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [pinAt]);

  const handlePickOnMap = useCallback((lat, lng) => pinAt(lat, lng), [pinAt]);

  return {
    gpsCoords,
    setGpsCoords,
    isLocating,
    locationError,
    setLocationError,
    isOutsideSantaFe,
    outsideMessage: OUTSIDE_SANTA_FE_MESSAGE,
    handleUseCurrentLocation,
    handlePickOnMap,
    pinFromAddress,
    addressSearch
  };
}
