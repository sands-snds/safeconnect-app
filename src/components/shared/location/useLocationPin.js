import { useState, useRef, useCallback } from 'react';
import { isWithinSantaFe, OUTSIDE_SANTA_FE_MESSAGE } from './santaFeArea';









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

  
  const pinAt = useCallback(async (lat, lng, { accuracy } = {}) => {
    setGpsCoords({ lat, lng });

    if (!isWithinSantaFe(lat, lng)) {
      setLocationError('');
      return; 
    }

    setLocationError(
      accuracy && accuracy > 100
        ? `Location accuracy is low (~${Math.round(accuracy)}m). Please check the pin and drag it if needed.`
        : ''
    );

    
    const id = ++lookupId.current;
    try {
      const address = await reverseGeocode(lat, lng);
      if (id === lookupId.current && onAddress) onAddress(address);
    } catch (err) {
      console.error('Reverse geocoding error:', err);
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
