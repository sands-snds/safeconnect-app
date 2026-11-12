import { useEffect, useRef, useState } from 'react';

// The home address the resident gave when signing up (or in Settings), in the
// same three parts the report forms use: House / Lot / Block No., Street and
// Subdivision / Purok.
export const registeredAddress = () => {
  try {
    const raw = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const user = raw && raw.user ? raw.user : raw;
    const address = user && user.address;
    if (!address || (!address.houseNumber && !address.street)) return null;
    return {
      houseNumber: address.houseNumber || '',
      street: address.street || '',
      area: address.area || ''
    };
  } catch {
    return null;
  }
};

// The home pin from the sign-up map, when the address boxes still hold the
// registered home address (house and street, ignoring case and spacing).
// Reports made at home use it as their map position.
const tidy = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
export const registeredHomePin = (formData) => {
  try {
    const raw = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const user = raw && raw.user ? raw.user : raw;
    const pin = user && user.homeLocation;
    const address = user && user.address;
    const lat = Number(pin && pin.lat);
    const lng = Number(pin && pin.lng);
    if (!pin || !address || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (!formData || tidy(formData.houseNumber) !== tidy(address.houseNumber) || tidy(formData.street) !== tidy(address.street)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
};

// The resident's saved home pin (sign-up map / Settings), or null. Every
// map and report form reads it from here, so they all show the same spot.
export const savedHomePin = () => {
  try {
    const raw = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const user = raw && raw.user ? raw.user : raw;
    const pin = user && user.homeLocation;
    const lat = Number(pin && pin.lat);
    const lng = Number(pin && pin.lng);
    return pin && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
};

// Two pins at the same spot (within about 10 cm).
export const samePin = (a, b) => Boolean(a && b)
  && Math.abs(Number(a.lat) - Number(b.lat)) < 1e-6 && Math.abs(Number(a.lng) - Number(b.lng)) < 1e-6;

// A report form's map, for a report made at home: the resident's saved home
// pin (sign-up / Settings) is put on the map as soon as the form opens or
// "at home" is chosen, so they never pin it again. Moving it (drag, tap,
// "Use my current location") means the report is somewhere else: onMovedAway
// is called, and the form switches over. Leaving "at home" takes the home pin
// off again. Returns the saved home pin, or null (older accounts).
export function useHomePinOnMap({ active, atHome, gpsCoords, setGpsCoords, onMovedAway }) {
  const home = savedHomePin();
  const homeKey = home ? `${home.lat},${home.lng}` : '';
  const gpsRef = useRef(gpsCoords);
  gpsRef.current = gpsCoords;
  const movedRef = useRef(onMovedAway);
  movedRef.current = onMovedAway;
  // Read through a ref: a setter that changes identity must not re-run this.
  const setRef = useRef(setGpsCoords);
  setRef.current = setGpsCoords;

  useEffect(() => {
    if (!active) return;
    const saved = savedHomePin();
    if (!saved) return;
    if (atHome) setRef.current(saved);
    else if (samePin(gpsRef.current, saved)) setRef.current(null);
  }, [active, atHome, homeKey]);

  // Runs only when the pin itself moves (not when "at home" is chosen again,
  // while the home pin is still on its way back).
  const activeRef = useRef(active);
  activeRef.current = active;
  const atHomeRef = useRef(atHome);
  atHomeRef.current = atHome;
  useEffect(() => {
    if (!activeRef.current || !atHomeRef.current || !gpsCoords) return;
    const saved = savedHomePin();
    if (saved && !samePin(gpsCoords, saved) && movedRef.current) movedRef.current();
  }, [gpsCoords]);

  return home;
}

// The home pin for a saved report's address text, when that address is the
// resident's registered home (an older report saved without a position).
export const homePinForLocation = (location) => {
  try {
    const raw = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const user = raw && raw.user ? raw.user : raw;
    const pin = user && user.homeLocation;
    const address = user && user.address;
    const lat = Number(pin && pin.lat);
    const lng = Number(pin && pin.lng);
    const text = tidy(location);
    if (!pin || !address || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (!tidy(address.houseNumber) || !tidy(address.street)) return null;
    return text.includes(tidy(address.houseNumber)) && text.includes(tidy(address.street)) ? { lat, lng } : null;
  } catch {
    return null;
  }
};

const sameAddress = (a, b) => a.houseNumber === b.houseNumber && a.street === b.street && (a.area || '') === (b.area || '');

// For a new report: while the incident is at the resident's home (reporting
// for yourself, or "At my home" for a petty crime) the address boxes hold the
// registered address (still editable). Switching away empties them again,
// unless you changed them, so you type where it happened.
// Returns true while the boxes hold the registered address.
export default function useRegisteredAddressFill({ active, atHome, formData, setFormData }) {
  const filled = useRef(null);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (!active) {
      filled.current = null;
      setPrefilled(false);
      return;
    }
    if (atHome) {
      const home = registeredAddress();
      if (!home) return;
      setFormData((prev) => {
        if (prev.houseNumber.trim() || prev.street.trim()) return prev;
        filled.current = home;
        return { ...prev, ...home };
      });
    } else {
      // Read now: the updater below runs later, after this is cleared.
      const home = filled.current;
      filled.current = null;
      if (!home) return;
      setFormData((prev) => (sameAddress(prev, home)
        ? { ...prev, houseNumber: '', street: '', area: '' }
        : prev));
    }
  }, [active, atHome, setFormData]);

  // The hint goes away once the boxes no longer hold the registered address.
  useEffect(() => {
    const home = filled.current;
    setPrefilled(Boolean(active && atHome && home && sameAddress(formData, home)));
  }, [active, atHome, formData]);

  return prefilled;
}
