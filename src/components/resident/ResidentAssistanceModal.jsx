import React, { useState, useEffect } from 'react';
import { createAssistanceRequest, updateAssistanceRequest } from '../../Services/api';
const SERVICE_AREA = {
  barangay: 'Santa Fe',
  city: 'Dasmariñas',
  province: 'Cavite',
  country: 'Philippines',
  lat: 14.3198,
  lng: 120.9644
};
const SPECIAL_NEEDS_OPTIONS = [
  'Elderly',
  'Children',
  'Persons with disabilities',
  'Pregnant',
  'Pets'
];
const URGENCY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const REPORT_COOLDOWN_KEY = 'sf_lastReportTimestamp_assistance';
const REPORT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

const getCurrentUser = () => {
  let raw = {};
  try {
    raw = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  } catch {
    raw = {};
  }
  const source = raw && raw.user ? raw.user : raw;
  const id =
    source.id ??
    source.user_id ??
    source.userId ??
    source.ID ??
    null;
  return { ...source, id };
};

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
function ResidentAssistanceModal({ show, type, serviceId, onClose, editingReport, onUpdated }) {
  const isEditing = Boolean(editingReport);
  const [formData, setFormData] = useState({
    assistanceType: '',
    houseNumber: '',
    street: '',
    floorUnit: '',
    location: '',
    situation: '',
    special: [],
    urgency: '',
    consent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [mapQuery, setMapQuery] = useState(`${SERVICE_AREA.lat},${SERVICE_AREA.lng}`);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [reportFor, setReportFor] = useState('self');
  const [victimName, setVictimName] = useState('');
  const [victimContact, setVictimContact] = useState('');
  const [victimRelationship, setVictimRelationship] = useState('');

  useEffect(() => {
    if (!editingReport) return;
    setFormData((prev) => ({
      ...prev,
      assistanceType: editingReport.title || '',
      location: editingReport.location || '',
      situation: editingReport.description || '',
      urgency: editingReport.urgency || '',
      special: editingReport.specialNeeds
        ? editingReport.specialNeeds.split(',').map((s) => s.trim()).filter(Boolean)
        : []
    }));
    if (editingReport.latitude != null && editingReport.longitude != null) {
      setGpsCoords({ lat: editingReport.latitude, lng: editingReport.longitude });
    }
  }, [editingReport]);
  useEffect(() => {
    document.body.style.overflow = show ? 'hidden' : 'auto';
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
      const composed = `${formData.houseNumber} ${formData.street}`.trim();
      const query = composed
        ? `${composed}, Barangay ${SERVICE_AREA.barangay}, ${SERVICE_AREA.city}, ${SERVICE_AREA.province}, ${SERVICE_AREA.country}`
        : `${SERVICE_AREA.lat},${SERVICE_AREA.lng}`;
      setMapQuery(query);
    }, 700);
    return () => clearTimeout(timer);
  }, [formData.houseNumber, formData.street, formData.location, gpsCoords, isEditing]);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'houseNumber' || name === 'street') {
      setGpsCoords(null);
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  const handleSpecialToggle = (option) => {
    setFormData(prev => {
      const alreadySelected = prev.special.includes(option);
      return {
        ...prev,
        special: alreadySelected
          ? prev.special.filter(item => item !== option)
          : [...prev.special, option]
      };
    });
  };
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
        alert(`Please wait ${formatRemaining(remaining)} before submitting another assistance request.`);
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
    if (reportFor === 'others' && !victimName.trim()) {
      alert('Please enter the name of the person you are requesting for.');
      return;
    }
    if (reportFor === 'others' && !victimRelationship) {
      alert('Please select your relationship to them.');
      return;
    }
    const currentUser = getCurrentUser();
    if (!currentUser.id) {
      console.warn(
        'No user id found in sessionStorage("currentUser"). This request will be saved without a user_id and will not appear in "My Reports".'
      );
    }
    setIsSubmitting(true);
    try {
      if (isEditing) {
        const result = await updateAssistanceRequest({
          id: editingReport.id,
          type: formData.assistanceType || 'General Assistance',
          location: formData.location.trim(),
          latitude: gpsCoords ? gpsCoords.lat : null,
          longitude: gpsCoords ? gpsCoords.lng : null,
          situation: formData.situation,
          special: formData.special.join(', ') || null,
          urgency: formData.urgency || null
        });
        if (!result.success) {
          throw new Error(result.message || 'Failed to update request');
        }
        alert('Assistance request updated successfully.');
        onUpdated && onUpdated();
        onClose();
        return;
      }
      const fullName = currentUser.fullName || currentUser.full_name || 'Anonymous Resident';
      const contact = currentUser.contact || currentUser.contact_number || 'Not provided';
      const email = currentUser.email || currentUser.email_address || '';
      const composedAddress = [formData.houseNumber.trim(), formData.street.trim()]
        .filter(Boolean)
        .join(' ');
      const floorUnitPart = formData.floorUnit.trim() ? `${formData.floorUnit.trim()}, ` : '';
      const fullLocation = `${floorUnitPart}${composedAddress}, Barangay ${SERVICE_AREA.barangay}, ${SERVICE_AREA.city}, ${SERVICE_AREA.province}, ${SERVICE_AREA.country}`;
      const result = await createAssistanceRequest({
        type: formData.assistanceType || 'General Assistance',
        userId: currentUser.id || null,
        fullname: fullName,
        contact,
        email,
        location: fullLocation,
        latitude: gpsCoords ? gpsCoords.lat : null,
        longitude: gpsCoords ? gpsCoords.lng : null,
        situation: formData.situation,
        special: formData.special.join(', ') || null,
        urgency: formData.urgency || null,
        reportFor,
        victimName: reportFor === 'others' ? victimName.trim() : null,
        victimContact: reportFor === 'others' ? victimContact.trim() : null,
        victimRelationship: reportFor === 'others' ? victimRelationship : null
      });
      if (!result.success) {
        throw new Error(result.message || 'Failed to submit request');
      }
      localStorage.setItem(getCooldownStorageKey(), Date.now().toString());
      setCooldownRemaining(REPORT_COOLDOWN_MS);
      setFormData({
        assistanceType: '',
        houseNumber: '',
        street: '',
        floorUnit: '',
        location: '',
        situation: '',
        special: [],
        urgency: '',
        consent: false
      });
      setReportFor('self');
      setVictimName(''); setVictimContact(''); setVictimRelationship('');
      setGpsCoords(null);
      setLocationError('');
      setMapQuery(`${SERVICE_AREA.lat},${SERVICE_AREA.lng}`);
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your request. Please try again.');
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
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        padding: '20px',
        overflowY: 'auto'
      }}
>
<div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
>
<div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
<div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: '#dc3545',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
<i className="bi bi-life-preserver" style={{
              fontSize: '22px',
              color: 'white'
            }}></i>
</div>
<h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '700',
            color: '#1f2937',
            flex: 1
          }}>{isEditing ? 'Edit Assistance Request' : 'Request Assistance'}</h2>
<button
            onClick={onClose}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#1f2937'}
            onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
>
<i className="bi bi-x-lg"></i>
</button>
</div>
<form onSubmit={handleSubmit} style={{ padding: '24px' }}>

          {/* ── ADDED: Reporting For toggle ── */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Who are you requesting for?
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button"
                onClick={() => { setReportFor('self'); setVictimName(''); setVictimContact(''); setVictimRelationship(''); }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${reportFor === 'self' ? '#dc3545' : '#d1d5db'}`, background: reportFor === 'self' ? '#fef2f2' : '#fff', color: reportFor === 'self' ? '#dc3545' : '#374151', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                <i className="bi bi-person-fill" style={{ marginRight: '6px' }}></i>Myself
              </button>
              <button type="button"
                onClick={() => setReportFor('others')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${reportFor === 'others' ? '#dc3545' : '#d1d5db'}`, background: reportFor === 'others' ? '#fef2f2' : '#fff', color: reportFor === 'others' ? '#dc3545' : '#374151', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                <i className="bi bi-people-fill" style={{ marginRight: '6px' }}></i>Someone Else
              </button>
            </div>
          </div>
          {reportFor === 'others' && (
            <div style={{ marginBottom: '16px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontWeight: '600', color: '#dc3545', fontSize: '13px' }}>
                <i className="bi bi-person-exclamation"></i> Person You Are Requesting For
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
          {/* ── END ADDED ── */}

<div style={{ marginBottom: '16px' }}>
<div style={{ marginBottom: '16px' }}>
<label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '13px'
            }}>
<i
                className="bi bi-list-check"
                style={{ color: '#374151', fontSize: '14px' }}
></i>
              Assistance Type <span style={{ color: '#dc3545' }}>*</span>
</label>
<select
              name="assistanceType"
              value={formData.assistanceType}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                outline: 'none'
              }}
>
<option value="">Select assistance type</option>
<option value="Food and Water">
                Food and Water
</option>
<option value="Medical Aid">
                Medical Aid
</option>
</select>
</div>
<div style={{ marginBottom: '16px' }}>
<label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '13px'
            }}>
<i
                className="bi bi-exclamation-diamond-fill"
                style={{ color: '#374151', fontSize: '14px' }}
></i>
              Urgency
</label>
<select
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                outline: 'none'
              }}
>
<option value="">Select urgency (optional)</option>
              {URGENCY_OPTIONS.map((opt) => (
<option key={opt} value={opt}>{opt}</option>
              ))}
</select>
</div>
<div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '8px'
            }}>
<label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '13px',
                margin: 0
              }}>
<i className="bi bi-geo-alt-fill" style={{ color: '#374151', fontSize: '14px' }}></i>
                Current Address <span style={{ color: '#dc3545' }}>*</span>
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
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Full address"
                  required
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#dc3545'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              ) : (
<>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
<input
                type="text"
                name="houseNumber"
                value={formData.houseNumber}
                onChange={handleChange}
                placeholder="House / Lot / Block No."
                required
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#dc3545'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
<input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                placeholder="Street"
                required
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#dc3545'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
</div>
<input
              type="text"
              name="floorUnit"
              value={formData.floorUnit}
              onChange={handleChange}
              placeholder="Floor / Unit / Room (Optional)"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                outline: 'none',
                marginTop: '10px'
              }}
              onFocus={(e) => e.target.style.borderColor = '#dc3545'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
</>
              )}
            {locationError && (
<div style={{ marginTop: '6px', fontSize: '12px', color: '#dc3545' }}>
<i className="bi bi-exclamation-triangle-fill"></i> {locationError}
</div>
            )}
<div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
              Requests are limited to Barangay Santa Fe, Dasmariñas, Cavite, Philippines
</div>
<div style={{
              marginTop: '10px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #d1d5db'
            }}>
<iframe
                key={mapQuery}
                src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`}
                title="Map of the entered location within Barangay Santa Fe"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                style={{
                  display: 'block',
                  width: '100%',
                  height: '180px',
                  border: 0
                }}
></iframe>
<a
                href={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '8px 10px',
                  fontSize: '12px',
                  color: '#dc3545',
                  textDecoration: 'none',
                  backgroundColor: '#fff',
                  borderTop: '1px solid #e5e7eb'
                }}
>
<i className="bi bi-box-arrow-up-right"></i> Open this location in Google Maps
</a>
</div>
            {gpsCoords && (
<div style={{ marginTop: '6px', fontSize: '11px', color: '#6b7280' }}>
<i className="bi bi-geo-alt-fill"></i> Pinned using your device's GPS ({gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)})
</div>
            )}
</div>
<div style={{ marginBottom: '16px' }}>
<label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '13px'
            }}>
<i className="bi bi-chat-left-text-fill" style={{ color: '#374151', fontSize: '14px' }}></i>
              Describe Your Situation <span style={{ color: '#dc3545' }}>*</span>
</label>
<textarea
              name="situation"
              value={formData.situation}
              onChange={handleChange}
              rows="4"
              placeholder="Please provide details about what kind of help you need..."
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#dc3545'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
></textarea>
</div>
<div style={{ marginBottom: '16px' }}>
<label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '13px'
            }}>
<i className="bi bi-info-circle-fill" style={{ color: '#374151', fontSize: '14px' }}></i>
              Special Needs / Considerations
</label>
<div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px'
            }}>
              {SPECIAL_NEEDS_OPTIONS.map((option) => (
<label
                  key={option}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#374151',
                    cursor: 'pointer',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px 10px'
                  }}
>
<input
                    type="checkbox"
                    checked={formData.special.includes(option)}
                    onChange={() => handleSpecialToggle(option)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      accentColor: '#dc3545'
                    }}
                  />
                  {option}
</label>
              ))}
</div>
</div>
<div style={{ marginBottom: '20px' }}>
<label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#374151',
              lineHeight: '1.5'
            }}>
<input
                type="checkbox"
                name="consent"
                checked={formData.consent}
                onChange={handleChange}
                required
                style={{
                  marginTop: '2px',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  accentColor: '#dc3545'
                }}
              />
<span>
                I confirm that the information provided is accurate and consent to be contacted by the response team.
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
              marginBottom: '8px'
            }}>
<i className="bi bi-clock-history"></i> You can submit another assistance request in {formatRemaining(cooldownRemaining)}.
</div>
          )}
<div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginTop: '24px'
          }}>
<button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '12px 20px',
                borderRadius: '24px',
                border: 'none',
                background: '#6b7280',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                color: 'white',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isSubmitting ? 0.5 : 1
              }}
              onMouseEnter={(e) => !isSubmitting && (e.target.style.background = '#4b5563')}
              onMouseLeave={(e) => e.target.style.background = '#6b7280'}
>
<i className="bi bi-x-circle-fill"></i> Cancel
</button>
<button
              type="submit"
              disabled={isSubmitting || (!isEditing && cooldownRemaining > 0)}
              style={{
                padding: '12px 20px',
                borderRadius: '24px',
                border: 'none',
                background: (isSubmitting || (!isEditing && cooldownRemaining > 0)) ? '#9ca3af' : '#dc3545',
                color: 'white',
                cursor: (isSubmitting || (!isEditing && cooldownRemaining > 0)) ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isSubmitting ? 0.7 : 1
              }}
              onMouseEnter={(e) => !isSubmitting && (isEditing || cooldownRemaining === 0) && (e.target.style.background = '#bb2d3b')}
              onMouseLeave={(e) => { if (!isSubmitting && (isEditing || cooldownRemaining === 0)) e.target.style.background = '#dc3545'; }}
>
              {isSubmitting ? (
<>
<i className="bi bi-hourglass-split"></i> {isEditing ? 'Saving...' : 'Submitting...'}
</>
              ) : (
<>
<i className="bi bi-send-fill"></i> {isEditing ? 'Save Changes' : 'Submit Request'}
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
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
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
        Request Submitted
      </h3>
      <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#4b5563', lineHeight: 1.5 }}>
        Your assistance request has been submitted successfully. Our team will contact you soon.
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
export default ResidentAssistanceModal;