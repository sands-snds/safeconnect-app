import { useState, useRef, useCallback } from 'react';
import { isWithinSantaFe, OUTSIDE_SANTA_FE_MESSAGE } from './santaFeArea';

// Shared location logic for the three resident report forms: the map pin
// (from GPS or from tapping / dragging on the map), filling the address
// fields from the pin, and the "outside Santa Fe" check.
//
// onAddress({ houseNumber, street, fullAddress }) is called after each new
// pin with whatever the free reverse-geocoder (OpenStreetMap Nominatim)
// found; fields it couldn't find come back as empty strings.

const reverseGeocode = async (lat, lng) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
  );
  const data = await res.json();
  const addr = data?.address || {};
  const houseNumber = addr.house_number || '';
  const street = addr.road || addr.pedestrian || addr.footway || addr.neighbourhood || '';
  const line = [houseNumber, street].filter(Boolean).join(' ');
  return {
    houseNumber,
    street,
    fullAddress: `${line ? line + ', ' : ''}Barangay Sta. Fe, Dasmariñas, Cavite, Philippines`
  };
};

// { lat, lng } as numbers, or null. Saved reports come back from MySQL with
// DECIMAL coordinates as strings ("14.3198000"); a string pin made Leaflet's
// bounds.contains() recurse until the stack overflowed, crashing the page
// whenever a report was opened for editing, and made the Santa Fe check
// compare strings.
const toCoords = (coords) => {
  if (!coords) return null;
  const lat = Number(coords.lat);
  const lng = Number(coords.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

export default function useLocationPin({ onAddress } = {}) {
  const [gpsCoords, setStoredCoords] = useState(null); // { lat, lng } numbers, or null
  const setGpsCoords = useCallback((coords) => setStoredCoords(toCoords(coords)), []);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const lookupId = useRef(0);

  const isOutsideSantaFe = Boolean(gpsCoords) && !isWithinSantaFe(gpsCoords.lat, gpsCoords.lng);

  // Pin a spot, then (unless it's outside Santa Fe) fill the address from it.
  const pinAt = useCallback(async (lat, lng, { accuracy } = {}) => {
    setGpsCoords({ lat, lng });

    if (!isWithinSantaFe(lat, lng)) {
      setLocationError('');
      return; // the map shows OUTSIDE_SANTA_FE_MESSAGE; don't fill in an address from outside
    }

    setLocationError(
      accuracy && accuracy > 100
        ? `Location accuracy is low (~${Math.round(accuracy)}m). Please check the pin and drag it if needed.`
        : ''
    );

    // Only the latest pin's lookup may fill the form (pins can move quickly).
    const id = ++lookupId.current;
    try {
      const address = await reverseGeocode(lat, lng);
      if (id === lookupId.current && onAddress) onAddress(address);
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      // Non-fatal: the pin itself is still exact; the resident can type the address.
    }
  }, [onAddress, setGpsCoords]);

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
    handlePickOnMap
  };
}
