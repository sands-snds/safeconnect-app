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
