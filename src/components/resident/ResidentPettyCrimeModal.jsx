import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPettyCrimeReport, updatePettyCrimeReport } from '../../Services/api';
import LocationPickerMap from './location/LocationPickerMap';
import useLocationPin from './location/useLocationPin';
const CRIME_TYPES = [
  'Theft',
  'Vandalism',
  'Public Disturbance',
  'Suspicious Activity',
  'Trespassing',
  'Harassment',
  'Other'
];
const SERVICE_AREA = {
  barangay: 'Santa Fe',
  city: 'Dasmariñas',
  province: 'Cavite',
  country: 'Philippines',
  lat: 14.3198,
  lng: 120.9644
};
// Anti-spam: minimum time a resident must wait between report submissions.
const REPORT_COOLDOWN_KEY = 'sf_lastReportTimestamp_pettycrime';
const REPORT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

// Reads the currently logged-in resident's name/contact, set at sign-in.
// Tries several common shapes for the id field since different sign-in
// implementations name it differently (id / user_id / userId), and some
// store the whole { success, user } response instead of just the user object.
const getCurrentUser = () => {
  let raw = {};
  try {
    raw = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  } catch {
    raw = {};
  }
  // Unwrap if the whole signin response ({ success, user, ... }) was stored
  const source = raw && raw.user ? raw.user : raw;
  const id =
    source.id ??
    source.user_id ??
    source.userId ??
    source.ID ??
    null;
  return { ...source, id };
};

// Cooldown is tracked per-account, not per-browser: the localStorage key is
// suffixed with the currently logged-in user's id (or "guest" when nobody
// is signed in) so switching accounts on the same device/browser doesn't
// inherit someone else's cooldown timer.
const getCooldownStorageKey = () => {
  const currentUser = getCurrentUser();
  return `${REPORT_COOLDOWN_KEY}_${currentUser.id ?? 'guest'}`;
};
const getCooldownRemainingMs = () => {
  const last = localStorage.getItem(getCooldownStorageKey());
  if (!last) return 0;
  const elapsed = Date.now() - parseInt(last, 10);
  return Math.max(0, REPORT_COOLDOWN_MS - elapsed);
};
const formatRemaining = (ms) => {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};
function ResidentPettyCrimeModal({ show, type, onClose, editingReport, onUpdated }) {
  const isEditing = Boolean(editingReport);
  const [formData, setFormData] = useState({
    houseNumber: '',
    street: '',
    floorUnit: '',
    location: '', // single editable address field, used only when editing
    crimeType: '',
    description: '',
    suspectInfo: '',
    consent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  // Map pin, "Use my current location" and the Santa Fe boundary check
  // (./location/useLocationPin.js). A new pin fills in the address.
  const fillAddressFromPin = useCallback(({ houseNumber, street, fullAddress }) => {
    setFormData((prev) => (isEditing
      ? { ...prev, location: fullAddress }
      : { ...prev, houseNumber: houseNumber || prev.houseNumber, street: street || prev.street }));
  }, [isEditing]);
  const {
    gpsCoords,
    setGpsCoords,
    isLocating,
    locationError,
    setLocationError,
    isOutsideSantaFe,
    outsideMessage,
    handleUseCurrentLocation,
    handlePickOnMap
  } = useLocationPin({ onAddress: fillAddressFromPin });
  const locationSectionRef = useRef(null);
  const [reportFor, setReportFor] = useState('self');
  const [victimName, setVictimName] = useState('');
  const [victimContact, setVictimContact] = useState('');
  const [victimRelationship, setVictimRelationship] = useState('');
  useEffect(() => {
    if (!editingReport) return;
    setFormData((prev) => ({
      ...prev,
      crimeType: editingReport.title || '',
      description: editingReport.description || '',
      suspectInfo: editingReport.suspectInfo || '',
      location: editingReport.location || ''
    }));
    // Only house#/street were ever collected separately at create time — the
    // backend only stores the merged address string, so on edit we restore
    // that string as-is into a single "Location" field rather than trying
    // to (unreliably) split it back into house#/street.
    if (editingReport.latitude != null && editingReport.longitude != null) {
      setGpsCoords({ lat: editingReport.latitude, lng: editingReport.longitude });
    }
  }, [editingReport, setGpsCoords]);
  useEffect(() => {
    document.body.style.overflow =
      show ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [show]);
  useEffect(() => {
    if (!show) return;
    setCooldownRemaining(getCooldownRemainingMs());
    const interval = setInterval(() => {
      setCooldownRemaining(getCooldownRemainingMs());
    }, 1000);
    return () => clearInterval(interval);
  }, [show]);
  const handleChange = (e) => {
    const { name, value, type, checked } =
      e.target;
    if (name === 'houseNumber' || name === 'street') {
      setGpsCoords(null);
    }
    setFormData(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : value
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing) {
      const remaining = getCooldownRemainingMs();
      if (remaining > 0) {
        alert(`Please wait ${formatRemaining(remaining)} before submitting another report.`);
        return;
      }
    }
    // The map already shows why; bring it into view.
    if (isOutsideSantaFe) {
      locationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (isEditing) {
      if (!formData.location.trim()) {
        alert('Please provide a location.');
        return;
      }
    } else if (!formData.houseNumber.trim() || !formData.street.trim()) {
      alert('Please provide the house/lot number and street.');
      return;
    }
    if (reportFor === 'others' && !victimName.trim()) {
      alert('Please enter the name of the person you are reporting for.');
      return;
    }
    if (reportFor === 'others' && !victimRelationship) {
      alert('Please select your relationship to them.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditing) {
        const result = await updatePettyCrimeReport({
          id: editingReport.id,
          crimeType: formData.crimeType,
          location: formData.location.trim(),
          latitude: gpsCoords ? gpsCoords.lat : null,
          longitude: gpsCoords ? gpsCoords.lng : null,
          description: formData.description,
          suspectInfo: formData.suspectInfo || null
        });
        if (!result.success) {
          throw new Error(result.message || 'Failed to update report');
        }
        alert('Petty crime report updated successfully.');
        onUpdated && onUpdated();
        onClose();
        return;
      }
      const currentUser = getCurrentUser();
      const fullName = currentUser.fullName || currentUser.full_name || 'Anonymous Resident';
      const contact = currentUser.contact || currentUser.contact_number || null;
      const composedAddress = [formData.houseNumber.trim(), formData.street.trim()]
        .filter(Boolean)
        .join(' ');
      const floorUnitPart = formData.floorUnit.trim() ? `${formData.floorUnit.trim()}, ` : '';
      const fullLocation =
        `${floorUnitPart}${composedAddress}, Barangay ${SERVICE_AREA.barangay}, ${SERVICE_AREA.city}, ${SERVICE_AREA.province}, ${SERVICE_AREA.country}`;
      const result = await createPettyCrimeReport({
        crimeType: formData.crimeType,
        userId: currentUser.id || null,
        fullname: fullName,
        contact,
        location: fullLocation,
        latitude: gpsCoords ? gpsCoords.lat : null,
        longitude: gpsCoords ? gpsCoords.lng : null,
        description: formData.description,
        suspectInfo: formData.suspectInfo || null,
        reportFor,
        victimName: reportFor === 'others' ? victimName.trim() : null,
        victimContact: reportFor === 'others' ? victimContact.trim() : null,
        victimRelationship: reportFor === 'others' ? victimRelationship : null
      });
      if (!result.success) {
        throw new Error(result.message || 'Failed to submit report');
      }
      localStorage.setItem(getCooldownStorageKey(), Date.now().toString());
      setCooldownRemaining(REPORT_COOLDOWN_MS);
      setFormData({
        houseNumber: '',
        street: '',
        floorUnit: '',
        location: '',
        crimeType: '',
        description: '',
        suspectInfo: '',
        consent: false
      });
      setReportFor('self');
      setVictimName('');
      setVictimContact('');
      setVictimRelationship('');
      setGpsCoords(null);
      setLocationError('');
      setShowSuccessPopup(true);
    } catch (error) {
      console.log(error);
      alert(
        'Error submitting report.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
    onClose();
  };
  if (!show && !showSuccessPopup) return null;
  return (
<>
{show && (
<div
      className="modal-overlay"
      style={{
        position:'fixed',
        top:0,
        left:0,
        right:0,
        bottom:0,
        width:'100vw',
        height:'100vh',
        backgroundColor:'rgba(0,0,0,.75)',
        display:'flex',
        justifyContent:'center',
        alignItems:'center',
        zIndex:10000,
        padding:'20px',
        overflowY:'auto'
      }}
>
<div
        onClick={(e)=>e.stopPropagation()}
        style={{
          backgroundColor:'white',
          borderRadius:'12px',
          maxWidth:'800px',
          width:'100%',
          maxHeight:'90vh',
          overflowY:'auto',
          position:'relative',
          boxShadow:'0 20px 60px rgba(0,0,0,.3)'
        }}
>
<div style={{
          padding:'20px 24px',
          borderBottom:'1px solid #e5e7eb',
          display:'flex',
          alignItems:'center',
          gap:'12px'
        }}>
<div style={{
            width:'44px',
            height:'44px',
            borderRadius:'50%',
            backgroundColor:'#dc3545',
            display:'flex',
            alignItems:'center',
            justifyContent:'center'
          }}>
<i
              className="bi bi-shield-exclamation"
              style={{
                fontSize:'22px',
                color:'white'
              }}
></i>
</div>
<h2 style={{
            margin:0,
            fontSize:'20px',
            fontWeight:'700',
            color:'#1f2937',
            flex:1
          }}>
            Report Petty Crime
</h2>
<button
            onClick={onClose}
            type="button"
            style={{
              background:'transparent',
              border:'none',
              fontSize:'22px',
              cursor:'pointer',
              color:'#9ca3af',
              padding:'4px'
            }}
>
<i className="bi bi-x-lg"></i>
</button>
</div>
<form
          onSubmit={handleSubmit}
          style={{ padding:'24px' }}
>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Who are you reporting for?
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button"
                onClick={() => { setReportFor('self'); setVictimName(''); setVictimContact(''); setVictimRelationship(''); }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${reportFor === 'self' ? '#dc3545' : '#d1d5db'}`, background: reportFor === 'self' ? '#fef2f2' : '#fff', color: reportFor === 'self' ? '#dc3545' : '#374151', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                <i className="bi bi-person-fill" style={{ marginRight: '6px' }}></i>Reporting for Myself
              </button>
              <button type="button"
                onClick={() => setReportFor('others')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${reportFor === 'others' ? '#dc3545' : '#d1d5db'}`, background: reportFor === 'others' ? '#fef2f2' : '#fff', color: reportFor === 'others' ? '#dc3545' : '#374151', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                <i className="bi bi-people-fill" style={{ marginRight: '6px' }}></i>Reporting for Others
              </button>
            </div>
          </div>
          {reportFor === 'others' && (
            <div style={{ marginBottom: '16px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontWeight: '600', color: '#dc3545', fontSize: '13px' }}>
                <i className="bi bi-person-exclamation"></i> Person You Are Reporting For
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>Their Name <span style={{ color: '#dc3545' }}>*</span></label>
                  <input type="text" placeholder="Full name" value={victimName} onChange={e => setVictimName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>Their Contact <span style={{ color: '#6b7280', fontWeight: 400 }}>(optional)</span></label>
                  <input type="text" placeholder="+63 9XX XXX XXXX" value={victimContact} onChange={e => setVictimContact(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }} />
                </div>
              </div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>Your Relationship <span style={{ color: '#dc3545' }}>*</span></label>
              <select value={victimRelationship} onChange={e => setVictimRelationship(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }}>
                <option value="">Select relationship</option>
                <option value="Family Member">Family Member</option>
                <option value="Friend">Friend</option>
                <option value="Neighbor">Neighbor</option>
                <option value="Colleague">Colleague</option>
                <option value="Stranger">Stranger</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

<div style={{ marginBottom:'16px' }}>
<label style={{
              display:'flex',
              alignItems:'center',
              gap:'6px',
              marginBottom:'8px',
              fontWeight:'600',
              color:'#374151',
              fontSize:'13px'
            }}>
<i className="bi bi-shield-fill-exclamation"></i>
              Crime Type
<span style={{color:'#dc3545'}}>*</span>
</label>
<select
              name="crimeType"
              required
              value={formData.crimeType}
              onChange={handleChange}
              style={{
                width:'100%',
                padding:'10px 14px',
                borderRadius:'6px',
                border:'1px solid #d1d5db'
              }}
>
<option value="">
                Select Type
</option>
              {CRIME_TYPES.map(item=>(
<option
                  key={item}
                  value={item}
>
                  {item}
</option>
              ))}
</select>
</div>
<div style={{ marginTop:'20px', marginBottom:'16px' }}>
<div style={{
              display:'flex',
              justifyContent:'space-between',
              alignItems:'center',
              flexWrap:'wrap',
              gap:'8px',
              marginBottom:'8px'
            }}>
<label style={{
                display:'flex',
                alignItems:'center',
                gap:'6px',
                fontWeight:'600',
                color:'#374151',
                fontSize:'13px',
                margin: 0
              }}>
<i className="bi bi-geo-alt-fill"></i>
                Current Address
<span style={{color:'#dc3545'}}>*</span>
</label>
{!isEditing && (
<button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating || isSubmitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid #dc3545',
                  background: '#fff',
                  color: '#dc3545',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: (isLocating || isSubmitting) ? 'not-allowed' : 'pointer',
                  opacity: (isLocating || isSubmitting) ? 0.6 : 1,
                  whiteSpace: 'nowrap'
                }}
>
                {isLocating ? (
<>
<i className="bi bi-arrow-repeat"></i> Locating...
</>
                ) : (
<>
<i className="bi bi-crosshair"></i> Use my current location
</>
                )}
</button>
              )}
</div>
              {isEditing ? (
<input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Full address"
                  style={{
                    width:'100%',
                    padding:'10px 14px',
                    borderRadius:'6px',
                    border:'1px solid #d1d5db',
                    fontSize:'14px',
                    outline:'none'
                  }}
                />
              ) : (
<>
<div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
<input
                type="text"
                name="houseNumber"
                required
                value={formData.houseNumber}
                onChange={handleChange}
                placeholder="House / Lot / Block No."
                style={{
                  width:'100%',
                  padding:'10px 14px',
                  borderRadius:'6px',
                  border:'1px solid #d1d5db',
                  fontSize:'14px',
                  outline:'none'
                }}
              />
<input
                type="text"
                name="street"
                required
                value={formData.street}
                onChange={handleChange}
                placeholder="Street"
                style={{
                  width:'100%',
                  padding:'10px 14px',
                  borderRadius:'6px',
                  border:'1px solid #d1d5db',
                  fontSize:'14px',
                  outline:'none'
                }}
              />
</div>
<input
              type="text"
              name="floorUnit"
              value={formData.floorUnit}
              onChange={handleChange}
              placeholder="Floor / Unit / Room (Optional)"
              style={{
                width:'100%',
                padding:'10px 14px',
                borderRadius:'6px',
                border:'1px solid #d1d5db',
                fontSize:'14px',
                outline:'none',
                marginTop:'10px'
              }}
            />
</>
              )}
            {locationError && (
<div style={{ marginTop:'6px', fontSize:'12px', color:'#dc3545' }}>
<i className="bi bi-exclamation-triangle-fill"></i> {locationError}
</div>
            )}
<div style={{
              marginTop:'6px',
              fontSize:'12px',
              color:'#6b7280'
            }}>
              Reports are limited to Barangay Santa Fe, Dasmariñas, Cavite, Philippines
</div>
</div>
<div ref={locationSectionRef}>
  <LocationPickerMap
    pin={gpsCoords}
    onPick={handlePickOnMap}
    isOutside={isOutsideSantaFe}
    outsideMessage={outsideMessage}
    disabled={isSubmitting}
  />
</div>
<div style={{marginBottom:'16px'}}>
<label style={{
              display:'flex',
              alignItems:'center',
              gap:'6px',
              marginBottom:'8px',
              fontWeight:'600',
              color:'#374151',
              fontSize:'13px'
            }}>
<i className="bi bi-chat-left-text-fill"></i>
              Description
<span style={{color:'#dc3545'}}>*</span>
</label>
<textarea
              name="description"
              rows="4"
              required
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what happened..."
              style={{
                width:'100%',
                padding:'10px 14px',
                borderRadius:'6px',
                border:'1px solid #d1d5db'
              }}
            />
</div>
<div style={{marginBottom:'16px'}}>
<label style={{
              display:'flex',
              alignItems:'center',
              gap:'6px',
              marginBottom:'8px',
              fontWeight:'600',
              color:'#374151',
              fontSize:'13px'
            }}>
<i className="bi bi-person-fill"></i>
              Suspect Information
</label>
<textarea
              name="suspectInfo"
              rows="3"
              value={formData.suspectInfo}
              onChange={handleChange}
              placeholder="Appearance, clothing, vehicle..."
              style={{
                width:'100%',
                padding:'10px 14px',
                borderRadius:'6px',
                border:'1px solid #d1d5db'
              }}
            />
</div>
<div style={{marginBottom:'20px'}}>
<label style={{
              display:'flex',
              alignItems:'flex-start',
              gap:'10px',
              cursor:'pointer',
              fontSize:'12px',
              color:'#374151'
            }}>
<input
                type="checkbox"
                name="consent"
                checked={formData.consent}
                onChange={handleChange}
                required
                style={{
                  accentColor:'#dc3545'
                }}
              />
<span>
                I confirm that this report is accurate and consent to submit this petty crime report for review and action.
</span>
</label>
</div>
          {!isEditing && cooldownRemaining > 0 && (
<div style={{
              textAlign: 'center',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '13px',
              padding: '8px 12px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
<i className="bi bi-clock-history"></i> You can submit another report in {formatRemaining(cooldownRemaining)}.
</div>
          )}
<div style={{
            display:'grid',
            gridTemplateColumns:'1fr 1fr',
            gap:'12px'
          }}>
<button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding:'12px 20px',
                borderRadius:'24px',
                border:'none',
                background:'#6b7280',
                color:'white',
                fontWeight:'600'
              }}
>
<i className="bi bi-x-circle-fill"></i> Cancel
</button>
<button
              type="submit"
              disabled={isSubmitting || (!isEditing && cooldownRemaining > 0)}
              style={{
                padding:'12px 20px',
                borderRadius:'24px',
                border:'none',
                background: (isSubmitting || (!isEditing && cooldownRemaining > 0)) ? '#9ca3af' : '#dc3545',
                color:'white',
                fontWeight:'600',
                cursor: (isSubmitting || (!isEditing && cooldownRemaining > 0)) ? 'not-allowed' : 'pointer'
              }}
>
              {isSubmitting ? (
<>
<i className="bi bi-hourglass-split"></i>
                  {" "}{isEditing ? 'Saving...' : 'Submitting...'}
</>
              ) : (
<>
<i className="bi bi-send-fill"></i>
                  {" "}{isEditing ? 'Save Changes' : 'Submit Crime Report'}
</>
              )}
</button>
</div>
</form>
</div>
</div>
)}

{showSuccessPopup && (
  <div
    className="modal-overlay"
    onClick={(e) => { if (e.target === e.currentTarget) closeSuccessPopup(); }}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,.75)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10001,
      padding: '20px'
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '420px',
        width: '100%',
        padding: '28px 24px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,.3)'
      }}
    >
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: '#16a34a',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        margin: '0 auto 16px'
      }}>
        <i className="bi bi-check-lg"></i>
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#1f2937' }}>
        Report Submitted
      </h3>
      <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#4b5563', lineHeight: 1.5 }}>
        Your petty crime report has been submitted successfully. Our team will review it shortly.
      </p>
      <button
        type="button"
        onClick={closeSuccessPopup}
        style={{
          padding: '12px 20px',
          borderRadius: '24px',
          border: 'none',
          background: '#dc3545',
          color: 'white',
          fontWeight: 600,
          fontSize: '14px',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        Done
      </button>
    </div>
  </div>
)}
</>
  );
}
export default ResidentPettyCrimeModal;