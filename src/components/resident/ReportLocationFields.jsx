import React from 'react';
import LocationPickerMap from '../shared/location/LocationPickerMap';
import { forwardGeocode } from '../shared/location/geocode';
import { TextWarning } from './textWarnings';
import { registeredHomePin } from './useRegisteredAddress';

// The address of a new report, in the same parts as the sign-up form's home
// address: House / Lot / Block No., Street and the fixed Barangay Santa Fe
// line, plus an optional landmark. There is no Subdivision / Purok box; an
// `area` still in the form data (from a map pin) only helps find the pin.
//
// showMap: the map (and "Use my current location") only shows when the
// incident isn't at the resident's home. The map and the address boxes stay
// in step: pinning fills the address, typing an address moves the pin.
// location: what useLocationPin returns.

export const EMPTY_LOCATION = { houseNumber: '', street: '', area: '', landmark: '' };

const SERVICE_AREA_LINE = 'Barangay Sta. Fe, Dasmariñas, Cavite, Philippines';

// The report's location text, e.g. "Blk 5 Lot 12, Sampaguita St., Barangay
// Sta. Fe, Dasmariñas, Cavite, Philippines (Landmark: blue gate)".
export const composeLocation = (formData, gpsCoords) => {
  const line = [formData.houseNumber, formData.street]
    .map((part) => (part || '').trim())
    .filter(Boolean)
    .join(', ');
  const landmark = (formData.landmark || '').trim();
  return [line || (gpsCoords ? 'Pinned location' : ''), SERVICE_AREA_LINE].filter(Boolean).join(', ')
    + (landmark ? ` (Landmark: ${landmark})` : '');
};

// The coordinates sent with a report, so it shows on the maps:
//   1. the pin on the map, when there is one;
//   2. at home, the resident's home pin from sign-up (while the address
//      boxes still hold their registered address);
//   3. otherwise the typed address, looked up (given up after 4 seconds).
// The server also fills in the home pin for an "at my home" report that
// still has none (backend/utils/homeCoords.js).
export const coordsForSubmit = async (formData, gpsCoords, showMap) => {
  if (gpsCoords) return gpsCoords;
  if (!showMap) {
    const home = registeredHomePin(formData);
    if (home) return home;
  }
  try {
    return await Promise.race([
      forwardGeocode(formData),
      new Promise((resolve) => setTimeout(() => resolve(null), 4000))
    ]);
  } catch {
    return null;
  }
};

const ADDRESS_FIELDS = ['houseNumber', 'street', 'area'];

const SEARCH_NOTES = {
  searching: { icon: 'bi-search', key: 'reportForm.addressSearching', color: '#6b7280' },
  found: { icon: 'bi-geo-alt-fill', key: 'reportForm.addressFound', color: '#15803d' },
  notFound: { icon: 'bi-question-circle', key: 'reportForm.addressNotFound', color: '#b45309' }
};

export default function ReportLocationFields({
  t,
  formData,
  onChange,
  disabled,
  showMap,
  location,
  sectionRef,
  addressPrefilled,
  serviceAreaNote,
  warnings = {}, // { houseNumber, street, landmark }: text-check reasons
  // alwaysShowMap: the map shows even for a report at home (with the home
  // pin on it); typed addresses only move the pin when showMap (elsewhere).
  alwaysShowMap = false
}) {
  const {
    gpsCoords,
    isLocating,
    locationError,
    isOutsideSantaFe,
    outsideMessage,
    handleUseCurrentLocation,
    handlePickOnMap,
    pinFromAddress,
    addressSearch
  } = location;

  const handleChange = (e) => {
    onChange(e);
    const { name, value } = e.target;
    if (showMap && ADDRESS_FIELDS.includes(name)) {
      pinFromAddress({ ...formData, [name]: value });
    }
  };

  const mapVisible = showMap || alwaysShowMap;
  // With a pin, the house number and street are optional.
  const needsTypedAddress = !(mapVisible && gpsCoords);
  const searchNote = showMap ? SEARCH_NOTES[addressSearch] : null;

  return (
    <div className="rl-section">
      <style>{`
        .rl-section .rl-label-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
        .rl-section .rl-label { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #374151; font-size: 13px; margin: 0; }
        .rl-section .rl-required { color: #dc3545; }
        .rl-section .rl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .rl-section .rl-input {
          width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid #d1d5db;
          font-size: 14px; outline: none; background: #fff; font-family: inherit; transition: border 0.2s;
        }
        .rl-section .rl-input:focus { border-color: #dc3545; }
        .rl-section .rl-input:disabled { background: #f3f4f6; cursor: not-allowed; }
        .rl-section .rl-input[readonly] { background: #f9fafb; color: #4b5563; }
        .rl-section .rl-gap { margin-top: 10px; }
        .rl-section .rl-locate {
          display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px;
          border: 1px solid #dc3545; background: #fff; color: #dc3545; font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .rl-section .rl-locate:hover:not(:disabled) { background: #dc3545; color: #fff; }
        .rl-section .rl-locate:disabled { opacity: 0.6; cursor: not-allowed; }
        .rl-section .rl-note { margin-top: 6px; font-size: 12px; color: #6b7280; }
        .rl-section .rl-error { margin-top: 6px; font-size: 12px; color: #dc3545; }
        @media (max-width: 480px) {
          .rl-section .rl-grid { grid-template-columns: 1fr; }
          .rl-section .rl-input { padding: 8px 12px; font-size: 13px; border-radius: 6px; }
          .rl-section .rl-label { font-size: 12px; }
        }
      `}</style>

      <div className="rl-label-row">
        <label className="rl-label">
          <i className="bi bi-geo-alt-fill" style={{ color: '#6b7280', fontSize: '14px' }}></i>
          {t('reportForm.address')} <span className="rl-required">*</span>
        </label>
        {mapVisible && (
          <button type="button" className="rl-locate" onClick={handleUseCurrentLocation} disabled={isLocating || disabled}>
            {isLocating ? (
              <><i className="bi bi-arrow-repeat loading-spinner"></i> {t('reportForm.locating')}</>
            ) : (
              <><i className="bi bi-crosshair"></i> {t('reportForm.useCurrentLocation')}</>
            )}
          </button>
        )}
      </div>

      <div className="rl-grid">
        <div>
          <input
            type="text"
            name="houseNumber"
            value={formData.houseNumber}
            onChange={handleChange}
            placeholder={t('reportForm.houseNumberPlaceholder')}
            aria-label={t('reportForm.houseNumberPlaceholder')}
            required={needsTypedAddress}
            disabled={disabled}
            maxLength={60}
            className="rl-input"
            aria-invalid={Boolean(warnings.houseNumber) || undefined}
          />
          <TextWarning t={t} reason={warnings.houseNumber} />
        </div>
        <div>
          <input
            type="text"
            name="street"
            value={formData.street}
            onChange={handleChange}
            placeholder={t('reportForm.streetPlaceholder')}
            aria-label={t('reportForm.streetPlaceholder')}
            required={needsTypedAddress}
            disabled={disabled}
            maxLength={120}
            className="rl-input"
            aria-invalid={Boolean(warnings.street) || undefined}
          />
          <TextWarning t={t} reason={warnings.street} />
        </div>
      </div>
      <input
        type="text"
        value={t('reportForm.barangayFixed')}
        aria-label={t('reportForm.barangayFixed')}
        readOnly
        tabIndex={-1}
        className="rl-input rl-gap"
      />
      <input
        type="text"
        name="landmark"
        value={formData.landmark}
        onChange={onChange}
        placeholder={t('reportForm.landmarkPlaceholder')}
        aria-label={t('reportForm.landmarkPlaceholder')}
        disabled={disabled}
        maxLength={200}
        className="rl-input rl-gap"
        aria-invalid={Boolean(warnings.landmark) || undefined}
      />
      <TextWarning t={t} reason={warnings.landmark} />

      {locationError && (
        <div className="rl-error">
          <i className="bi bi-exclamation-triangle-fill"></i> {locationError}
        </div>
      )}
      {addressPrefilled && (
        <div className="registered-address-hint">
          <i className="bi bi-house-check-fill" aria-hidden="true"></i> {t('reportForm.addressPrefilled')}
        </div>
      )}
      <div className="rl-note">{serviceAreaNote || t('reportForm.serviceAreaNote')}</div>

      {mapVisible && (
        <div ref={sectionRef}>
          {searchNote && (
            <div className="rl-note" style={{ color: searchNote.color }} role="status">
              <i className={`bi ${searchNote.icon}`} aria-hidden="true"></i> {t(searchNote.key)}
            </div>
          )}
          <LocationPickerMap
            pin={gpsCoords}
            onPick={handlePickOnMap}
            isOutside={isOutsideSantaFe}
            outsideMessage={outsideMessage}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
