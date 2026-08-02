import React, { useState, useEffect } from 'react';
import { createPettyCrimeReport, updatePettyCrimeReport } from '../../Services/api';
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
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [mapQuery, setMapQuery] = useState(`${SERVICE_AREA.lat},${SERVICE_AREA.lng}`);
  const [gpsCoords, setGpsCoords] = useState(null); // exact GPS pin, takes priority over typed address
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
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
  }, [editingReport]);
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
  useEffect(() => {
    if (gpsCoords) return;
    const timer = setTimeout(() => {
      if (isEditing) {
        setMapQuery(formData.location.trim() || `${SERVICE_AREA.lat},${SERVICE_AREA.lng}`);
        return;
      }
      const composed =
        `${formData.houseNumber} ${formData.street}`.trim();
      const query = composed
        ? `${composed}, Barangay ${SERVICE_AREA.barangay}, ${SERVICE_AREA.city}, ${SERVICE_AREA.province}, ${SERVICE_AREA.country}`
        : `${SERVICE_AREA.lat},${SERVICE_AREA.lng}`;
      setMapQuery(query);
    }, 700);
    return () => clearTimeout(timer);
  }, [formData.houseNumber, formData.street, formData.location, gpsCoords, isEditing]);
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
  // Uses the device's GPS to pin the map exactly, then best-effort fills
  // the house number / street fields via free reverse geocoding.
  const handleUseCurrentLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        setMapQuery(`${latitude},${longitude}`);
        if (accuracy && accuracy > 100) {
          setLocationError(
            `Location accuracy is low (~${Math.round(accuracy)}m). Please double-check the pin on the map.`
          );
        }
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            setFormData((prev) => ({
              ...prev,
              houseNumber: addr.house_number || prev.houseNumber,
              street: addr.road || addr.pedestrian || addr.suburb || prev.street
            }));
          }
        } catch (err) {
          console.error('Reverse geocoding error:', err);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location access was denied. Please allow it or enter your address manually.');
        } else {
          setLocationError('Unable to retrieve your location. Please enter your address manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
    if (isEditing) {
      if (!formData.location.trim()) {
        alert('Please provide a location.');
        return;
      }
    } else if (!formData.houseNumber.trim() || !formData.street.trim()) {
      alert('Please provide the house/lot number and street.');
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
        suspectInfo: formData.suspectInfo || null
      });
      if (!result.success) {
        throw new Error(result.message || 'Failed to submit report');
      }
      localStorage.setItem(getCooldownStorageKey(), Date.now().toString());
      setCooldownRemaining(REPORT_COOLDOWN_MS);
      alert(
        'Petty crime report submitted successfully.'
      );
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
      setGpsCoords(null);
      setLocationError('');
      setMapQuery(`${SERVICE_AREA.lat},${SERVICE_AREA.lng}`);
      onClose();
    } catch (error) {
      console.log(error);
      alert(
        'Error submitting report.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!show) return null;
  return (
<div
      className="modal-overlay"
      onClick={(e)=>{
        if(e.target===e.currentTarget){
          onClose();
        }
      }}
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
<div style={{
            marginBottom:'16px',
            borderRadius:'8px',
            overflow:'hidden',
            border:'1px solid #d1d5db'
          }}>
<iframe
              key={mapQuery}
              title="Location Map"
              src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`}
              style={{
                width:'100%',
                height:'180px',
                border:0
              }}
            />
<a
              href={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:'block',
                padding:'8px 10px',
                fontSize:'12px',
                color:'#dc3545',
                textDecoration:'none',
                borderTop:'1px solid #e5e7eb'
              }}
>
<i className="bi bi-box-arrow-up-right"></i>
              {" "}
              Open this location in Google Maps
</a>
</div>
          {gpsCoords && (
<div style={{ marginTop: '-10px', marginBottom: '16px', fontSize: '11px', color: '#6b7280' }}>
<i className="bi bi-geo-alt-fill"></i> Pinned using your device's GPS ({gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)})
</div>
          )}
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
  );
}
export default ResidentPettyCrimeModal;