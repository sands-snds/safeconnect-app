import { useEffect, useRef, useState } from 'react';

// The home address the resident gave when signing up (or in Settings), as
// the report forms' two address boxes: House / Lot / Block No. and Street
// (with the subdivision or purok, when given).
export const registeredAddress = () => {
  try {
    const raw = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const user = raw && raw.user ? raw.user : raw;
    const address = user && user.address;
    if (!address || (!address.houseNumber && !address.street)) return null;
    return {
      houseNumber: address.houseNumber || '',
      street: [address.street, address.area].filter(Boolean).join(', ')
    };
  } catch {
    return null;
  }
};

// For a new report: reporting for yourself fills the address boxes with
// your registered address (still editable); switching to "someone else"
// empties them again, unless you changed them, so you type that person's
// address. A pinned map location still fills the boxes as before.
// Returns true while the boxes hold the registered address.
export default function useRegisteredAddressFill({ active, reportFor, formData, setFormData }) {
  const filled = useRef(null);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (!active) {
      filled.current = null;
      setPrefilled(false);
      return;
    }
    if (reportFor === 'self') {
      const home = registeredAddress();
      if (!home) return;
      setFormData((prev) => {
        if (prev.houseNumber.trim() || prev.street.trim()) return prev;
        filled.current = home;
        return { ...prev, houseNumber: home.houseNumber, street: home.street };
      });
    } else {
      // Read now: the updater below runs later, after this is cleared.
      const home = filled.current;
      filled.current = null;
      if (!home) return;
      setFormData((prev) => (prev.houseNumber !== home.houseNumber || prev.street !== home.street
        ? prev
        : { ...prev, houseNumber: '', street: '' }));
    }
  }, [active, reportFor, setFormData]);

  // The hint goes away once the boxes no longer hold the registered address.
  useEffect(() => {
    const home = filled.current;
    setPrefilled(Boolean(active && reportFor === 'self' && home
      && formData.houseNumber === home.houseNumber && formData.street === home.street));
  }, [active, reportFor, formData.houseNumber, formData.street]);

  return prefilled;
}
