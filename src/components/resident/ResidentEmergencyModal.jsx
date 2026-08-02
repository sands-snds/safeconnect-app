import React, { useState, useEffect, useRef } from 'react';
import { createEmergencyReport, updateEmergencyReport } from '../../Services/api';
 
 
// Fixed service area — form only accepts reports from this barangay
const SERVICE_AREA = {
  barangay: 'Santa Fe',
  city: 'Dasmariñas',
  province: 'Cavite',
  country: 'Philippines',
  lat: 14.3198,
  lng: 120.9644
};
 
const PEOPLE_AFFECTED_OPTIONS = ['1-10', '11-20', '21-30', '31-40'];
 
const SPECIAL_NEEDS_OPTIONS = [
  'Elderly',
  'Children',
  'Persons with disabilities',
  'Pregnant',
  'Pets'
];
 
// Accepted media for the required photo/video attachment.
// Images are restricted to JPG/JPEG only.
const ALLOWED_MEDIA_TYPES = [
  'image/jpeg', 'image/jpg',
  'video/mp4', 'video/quicktime', 'video/webm'
];
const ALLOWED_MEDIA_EXTENSIONS = /\.(jpe?g|mp4|mov|webm)$/i;
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
 
// Anti-spam: minimum time a resident must wait between EMERGENCY report
// submissions. Each modal (Emergency / Assistance / Petty Crime) tracks its
// own cooldown independently, so submitting one doesn't block the others.
const REPORT_COOLDOWN_KEY = 'sf_lastReportTimestamp_emergency';
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
 
function ResidentEmergencyModal({ show, type, onClose, onRequestAssistance, editingReport, onUpdated }) {
  const isEditing = Boolean(editingReport);
  const [formData, setFormData] = useState({
    emergencyType: '',
    houseNumber: '',
    street: '',
    floorUnit: '',
    location: '', // single editable address field, used only when editing
    details: '',
    people: '',
    special: [],
    media: null,
    mediaPreviewUrl: null,
    mediaType: null
   
  });
 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAssistancePrompt, setShowAssistancePrompt] = useState(false);
  const [submittedLocation, setSubmittedLocation] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
 
  // Location / map state
  const [mapQuery, setMapQuery] = useState(`${SERVICE_AREA.lat},${SERVICE_AREA.lng}`);
  const [gpsCoords, setGpsCoords] = useState(null); // exact GPS pin, takes priority over typed address
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
 
  const fileInputRef = useRef(null);
 
   useEffect(() => {
    if (!editingReport) return;
 
    setFormData(prev => ({
      ...prev,
      emergencyType: editingReport.title || '',
      location: editingReport.location || '',
      details: editingReport.description || '',
      people: editingReport.peopleAffected || '',
      special: editingReport.specialNeeds
        ? editingReport.specialNeeds.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      media: null,
      mediaPreviewUrl: null,
      mediaType: null
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
    document.body.style.overflow = show ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [show]);
 
  // Tick the cooldown countdown while the modal is open
  useEffect(() => {
    if (!show) return;
    setCooldownRemaining(getCooldownRemainingMs());
    const interval = setInterval(() => {
      setCooldownRemaining(getCooldownRemainingMs());
    }, 1000);
    return () => clearInterval(interval);
  }, [show]);
 
  // Debounce the typed address so the map updates a moment after typing stops.
  // Skipped while a GPS pin is active, since that's already exact.
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
 
  // Revoke the object URL used for the media preview when it changes/unmounts
  useEffect(() => {
    return () => {
      if (formData.mediaPreviewUrl) URL.revokeObjectURL(formData.mediaPreviewUrl);
    };
  }, [formData.mediaPreviewUrl]);
 
  const handleChange = (e) => {
    const { name, value, files } = e.target;
 
    if (name === 'media') {
      const file = files[0];
 
      if (formData.mediaPreviewUrl) {
        URL.revokeObjectURL(formData.mediaPreviewUrl);
      }
 
      if (!file) {
        setFormData((prev) => ({ ...prev, media: null, mediaPreviewUrl: null, mediaType: null }));
        return;
      }
 
      const isAllowed =
        ALLOWED_MEDIA_TYPES.includes(file.type) || ALLOWED_MEDIA_EXTENSIONS.test(file.name);
 
      if (!isAllowed) {
        alert('Only JPG/JPEG images or MP4/MOV/WEBM videos are allowed.');
        e.target.value = '';
        setFormData((prev) => ({ ...prev, media: null, mediaPreviewUrl: null, mediaType: null }));
        return;
      }
 
      const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
 
      if (file.size > maxSize) {
        alert(`File is too large (max ${isVideo ? '50MB for videos' : '20MB for images'}).`);
        e.target.value = '';
        setFormData((prev) => ({ ...prev, media: null, mediaPreviewUrl: null, mediaType: null }));
        return;
      }
 
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        media: file,
        mediaPreviewUrl: previewUrl,
        mediaType: isVideo ? 'video' : 'image'
      }));
      return;
    }
 
    // Editing the address by hand overrides any GPS pin
    if (name === 'houseNumber' || name === 'street') {
      setGpsCoords(null);
    }
 
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
 
  // Removes the currently attached photo/video and resets the file input
  const removeMedia = () => {
    if (formData.mediaPreviewUrl) URL.revokeObjectURL(formData.mediaPreviewUrl);
    setFormData((prev) => ({ ...prev, media: null, mediaPreviewUrl: null, mediaType: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
 
  const handleSpecialToggle = (option) => {
    setFormData((prev) => {
      const alreadySelected = prev.special.includes(option);
      return {
        ...prev,
        special: alreadySelected
          ? prev.special.filter((item) => item !== option)
          : [...prev.special, option]
      };
    });
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
          // Non-fatal — the map pin itself is still accurate from GPS
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
 
  const uploadMedia = async (file) => {
    if (!file) return null;
 
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result); // data URL (Base64)
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Media conversion error:', error);
      return null;
    }
  };
 
  const getSeverity = (emergencyType) => {
    const severityMap = {
      'Flood Emergency': 'Critical',
      'Fire Emergency': 'Critical',
      'Earthquake': 'High',
      'Landslide': 'High',
      'Accident': 'Urgent',
      'Other Emergency': 'Variable'
    };
    return severityMap[emergencyType] || 'Medium';
  };
 
  const resetForm = () => {
    if (formData.mediaPreviewUrl) URL.revokeObjectURL(formData.mediaPreviewUrl);
 
    setFormData({
      emergencyType: '',
      houseNumber: '',
      street: '',
      floorUnit: '',
      location: '',
      details: '',
      people: '',
      special: [],
      media: null,
      mediaPreviewUrl: null,
      mediaType: null
    });
    setGpsCoords(null);
    setLocationError('');
    setMapQuery(`${SERVICE_AREA.lat},${SERVICE_AREA.lng}`);
 
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
 
    if (!isEditing) {
      const remaining = getCooldownRemainingMs();
      if (remaining > 0) {
        alert(`Please wait ${formatRemaining(remaining)} before submitting another emergency report.`);
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
 
    // Media is required when filing a new report, but an edit already has a
    // photo/video on file — only require a new one if the resident chooses
    // to replace it.
    if (!isEditing && !formData.media) {
      alert('Please attach a photo or video of the incident. This is required.');
      return;
    }
 
    const currentUser = getCurrentUser();
 
    // Not fatal — reports can still be submitted anonymously — but it means
    // this report will NOT show up under "My Reports" for anyone.
    if (!currentUser.id) {
      console.warn(
        'No user id found in sessionStorage("currentUser"). This report will be saved without a user_id and will not appear in "My Reports".'
      );
    }
 
    setIsSubmitting(true);
 
    try {
      if (isEditing) {
        let mediaUrl;
        if (formData.media) {
          mediaUrl = await uploadMedia(formData.media);
        }
        const result = await updateEmergencyReport({
          id: editingReport.id,
          emergencyType: formData.emergencyType,
          severity: getSeverity(formData.emergencyType),
          location: formData.location.trim(),
          latitude: gpsCoords ? gpsCoords.lat : null,
          longitude: gpsCoords ? gpsCoords.lng : null,
          details: formData.details,
          people: formData.people || 0,
          special: formData.special.join(', ') || null,
          // Only overwrite the saved photo/video if the resident attached a new one
          ...(mediaUrl ? { photoUrl: mediaUrl, mediaType: formData.mediaType || null } : {})
        });
        if (!result.success) {
          throw new Error(result.message || 'Failed to update report');
        }
        alert('Emergency report updated successfully.');
        onUpdated && onUpdated();
        onClose();
        return;
      }
 
      const reporterName = currentUser.fullName || currentUser.full_name || 'Anonymous Resident';
      const reporterContact = currentUser.contact || currentUser.contact_number || 'Not provided';
 
      let mediaUrl = '';
      const uploadedUrl = await uploadMedia(formData.media);
      if (uploadedUrl) {
        mediaUrl = uploadedUrl;
      } else {
        console.warn('Media upload/encoding failed');
      }
 
      const composedAddress = [formData.houseNumber.trim(), formData.street.trim()]
        .filter(Boolean)
        .join(' ');
      const floorUnitPart = formData.floorUnit.trim() ? `${formData.floorUnit.trim()}, ` : '';
      const fullLocation = `${floorUnitPart}${composedAddress}, Barangay ${SERVICE_AREA.barangay}, ${SERVICE_AREA.city}, ${SERVICE_AREA.province}, ${SERVICE_AREA.country}`;
 
      console.log({
      userId: currentUser.id,
      emergencyType: formData.emergencyType
    });
      const result = await createEmergencyReport({
        emergencyType: formData.emergencyType,
        severity: getSeverity(formData.emergencyType),
        userId: currentUser.id,
        name: reporterName,
        contact: reporterContact,
        location: fullLocation,
        latitude: gpsCoords ? gpsCoords.lat : null,
        longitude: gpsCoords ? gpsCoords.lng : null,
        details: formData.details,
        people: formData.people || 0,
        special: formData.special.join(', ') || null,
        // photoUrl kept for backend compatibility; mediaType distinguishes image vs video
        photoUrl: mediaUrl || null,
        mediaType: formData.mediaType || null
      });
 
      if (!result.success) {
        throw new Error(result.message || 'Failed to submit report');
      }
 
      // Start this modal's own 1-hour cooldown for the currently logged-in account
      localStorage.setItem(getCooldownStorageKey(), Date.now().toString());
      setCooldownRemaining(REPORT_COOLDOWN_MS);

      setSubmittedLocation({
        location: fullLocation,
        latitude: gpsCoords ? gpsCoords.lat : null,
        longitude: gpsCoords ? gpsCoords.lng : null
      });

      resetForm();
      setShowAssistancePrompt(true);
 
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again or call emergency hotline: 911');
    } finally {
      setIsSubmitting(false);
    }
  };
 
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };
 
  const closeAssistancePrompt = () => {
    setShowAssistancePrompt(false);
    onClose();
  };
 
  const acceptAssistancePrompt = () => {
    setShowAssistancePrompt(false);
    onClose();
    if (onRequestAssistance) onRequestAssistance(submittedLocation);
  };
 
  if (!show && !showAssistancePrompt) return null;
 
  return (
    <>
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.75);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          padding: 20px;
          overflow-y: auto;
        }
 
        @media (max-width: 480px) {
          .modal-overlay {
            padding: 10px;
            align-items: flex-start;
          }
        }
 
        .modal-container {
          background-color: white;
          border-radius: 12px;
          max-width: 820px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
 
        @media (max-width: 480px) {
          .modal-container {
            max-height: 95vh;
            border-radius: 8px;
          }
        }
 
        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
        }
 
        @media (max-width: 480px) {
          .modal-header {
            padding: 16px 20px;
            gap: 10px;
          }
        }
 
        .header-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: #dc3545;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
 
        @media (max-width: 480px) {
          .header-icon {
            width: 40px;
            height: 40px;
          }
        }
 
        .header-icon i {
          font-size: 22px;
          color: white;
        }
 
        @media (max-width: 480px) {
          .header-icon i {
            font-size: 20px;
          }
        }
 
        .modal-title {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: #1f2937;
          flex: 1;
        }
 
        @media (max-width: 480px) {
          .modal-title {
            font-size: 18px;
          }
        }
 
        .close-button {
          background: transparent;
          border: none;
          font-size: 22px;
          cursor: pointer;
          color: #9ca3af;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }
 
        @media (max-width: 480px) {
          .close-button {
            font-size: 20px;
          }
        }
 
        .close-button:hover {
          color: #1f2937;
        }
 
        .close-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
 
        .modal-form {
          padding: 24px;
        }
 
        @media (max-width: 480px) {
          .modal-form {
            padding: 20px;
          }
        }
 
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
 
        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
 
        .form-group {
          margin-bottom: 16px;
        }
 
        @media (max-width: 480px) {
          .form-group {
            margin-bottom: 12px;
          }
        }
 
        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
          font-size: 13px;
        }
 
        @media (max-width: 480px) {
          .form-label {
            font-size: 12px;
            margin-bottom: 6px;
          }
        }
 
        .required {
          color: #dc3545;
        }
 
        .form-input, .form-textarea, .form-file, .form-select {
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          font-size: 14px;
          outline: none;
          transition: border 0.2s;
          background-color: #fff;
          font-family: inherit;
        }
 
        @media (max-width: 480px) {
          .form-input, .form-textarea, .form-file, .form-select {
            padding: 8px 12px;
            font-size: 13px;
            border-radius: 6px;
          }
        }
 
        .form-input:focus, .form-textarea:focus, .form-file:focus, .form-select:focus {
          border-color: #dc3545;
        }
 
        .form-input:disabled, .form-textarea:disabled, .form-file:disabled, .form-select:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }
 
        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }
 
        @media (max-width: 480px) {
          .form-textarea {
            min-height: 80px;
          }
        }
 
        .form-file {
          cursor: pointer;
        }
 
        .form-select {
          cursor: pointer;
        }
 
        .checkbox-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
 
        @media (max-width: 480px) {
          .checkbox-grid {
            grid-template-columns: 1fr;
          }
        }
 
        .checkbox-option {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #374151;
          cursor: pointer;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 8px 10px;
        }
 
        .checkbox-option input {
          width: 16px;
          height: 16px;
          cursor: pointer;
          flex-shrink: 0;
          accent-color: #dc3545;
        }
 
        .address-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
 
        .btn-locate {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid #dc3545;
          background-color: #fff;
          color: #dc3545;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
 
        .btn-locate:hover:not(:disabled) {
          background-color: #dc3545;
          color: #fff;
        }
 
        .btn-locate:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
 
        .btn-remove-media {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 8px;
          padding: 5px 12px;
          border-radius: 16px;
          border: 1px solid #dc3545;
          background-color: #fff;
          color: #dc3545;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
 
        .btn-remove-media:hover:not(:disabled) {
          background-color: #dc3545;
          color: #fff;
        }
 
        .btn-remove-media:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
 
        .location-fixed-area {
          margin-top: 6px;
          font-size: 12px;
          color: #6b7280;
        }
 
        .location-error {
          margin-top: 6px;
          font-size: 12px;
          color: #dc3545;
        }
 
        .gps-note {
          margin-top: 6px;
          font-size: 11px;
          color: #6b7280;
        }
 
        .map-preview {
          margin-top: 10px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #d1d5db;
        }
 
        .map-preview iframe {
          display: block;
          width: 100%;
          height: 180px;
          border: 0;
        }
 
        @media (max-width: 480px) {
          .map-preview iframe {
            height: 150px;
          }
        }
 
        .map-preview-link {
          display: block;
          padding: 8px 10px;
          font-size: 12px;
          color: #dc3545;
          text-decoration: none;
          background-color: #fff;
          border-top: 1px solid #e5e7eb;
        }
 
        .map-preview-link:hover {
          text-decoration: underline;
        }
 
        .media-preview {
          margin-top: 10px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #d1d5db;
        }
 
        .media-preview img, .media-preview video {
          display: block;
          width: 100%;
          max-height: 220px;
          object-fit: cover;
          background: #000;
        }
 
        .media-hint {
          font-size: 11px;
          color: #6b7280;
          margin-top: 4px;
        }
 
        .cooldown-banner {
          grid-column: 1 / -1;
          text-align: center;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          font-size: 13px;
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 8px;
        }
 
        .button-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 24px;
        }
 
        @media (max-width: 480px) {
          .button-group {
            grid-template-columns: 1fr;
            gap: 10px;
            margin-top: 20px;
          }
        }
 
        .btn-cancel, .btn-submit {
          padding: 12px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
 
        @media (max-width: 480px) {
          .btn-cancel, .btn-submit {
            padding: 10px 16px;
            font-size: 13px;
            border-radius: 6px;
          }
        }
 
        .btn-cancel {
          background: #6b7280;
          color: white;
        }
 
        .btn-cancel:hover:not(:disabled) {
          background: #4b5563;
        }
 
        .btn-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
 
        .btn-submit {
          background: #dc3545;
          color: white;
        }
 
        .btn-submit:hover:not(:disabled) {
          background: #bb2d3b;
        }
 
        .btn-submit:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
 
        .loading-spinner {
          animation: spin 1s linear infinite;
        }
 
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
 
        .assistance-popup-card {
          background-color: white;
          border-radius: 12px;
          max-width: 420px;
          width: 100%;
          padding: 28px 24px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
 
        .assistance-popup-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-color: #16a34a;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin: 0 auto 16px;
        }
      `}</style>
 
      {show && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-icon">
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>
              <h2 className="modal-title">{isEditing ? `Edit ${type} Report` : `Report ${type}`}</h2>
              <button
                className="close-button"
                onClick={onClose}
                type="button"
                disabled={isSubmitting}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
 
            <form className="modal-form" onSubmit={handleSubmit}>
 
              <div className="form-group">
                <div className="form-group">
                  <label className="form-label">
                    <i
                      className="bi bi-exclamation-circle-fill"
                      style={{ color: '#6b7280', fontSize: '14px', marginRight: '6px' }}
                    ></i>
                    Emergency Type <span className="required">*</span>
                  </label>
 
                  <select
                    name="emergencyType"
                    value={formData.emergencyType}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="form-select"
                  >
                    <option value="">Select emergency type</option>
                    <option value="Fire Emergency">Fire</option>
                    <option value="Flood Emergency">Flood</option>
                    <option value="Earthquake">Earthquake</option>
                  </select>
                </div>
 
                <div className="address-label-row">
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    <i className="bi bi-geo-alt-fill" style={{ color: '#6b7280', fontSize: '14px', marginRight: '6px' }}></i>
                    Address <span className="required">*</span>
                  </label>
                  <button
                    type="button"
                    className="btn-locate"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating || isSubmitting}
                  >
                    {isLocating ? (
                      <>
                        <i className="bi bi-arrow-repeat loading-spinner"></i> Locating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-crosshair"></i> Use my current location
                      </>
                    )}
                  </button>
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
                    className="form-input"
                    style={{ marginTop: '8px' }}
                  />
                ) : (
                  <>
                    <div className="form-grid" style={{ marginTop: '8px', marginBottom: 0 }}>
                      <input
                        type="text"
                        name="houseNumber"
                        value={formData.houseNumber}
                        onChange={handleChange}
                        placeholder="House / Lot / Block No."
                        required
                        disabled={isSubmitting}
                        className="form-input"
                      />
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        placeholder="Street"
                        required
                        disabled={isSubmitting}
                        className="form-input"
                      />
                    </div>
 
                    <input
                      type="text"
                      name="floorUnit"
                      value={formData.floorUnit}
                      onChange={handleChange}
                      placeholder="Floor / Unit / Room (Optional)"
                      disabled={isSubmitting}
                      className="form-input"
                      style={{ marginTop: '10px' }}
                    />
                  </>
                )}
 
                {locationError && (
                  <div className="location-error">
                    <i className="bi bi-exclamation-triangle-fill"></i> {locationError}
                  </div>
                )}
 
                <div className="location-fixed-area">
                  Reports are limited to Barangay Santa Fe, Dasmariñas, Cavite, Philippines
                </div>
 
                <div className="map-preview">
                  <iframe
                    key={mapQuery}
                    src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`}
                    title="Map of the entered location within Barangay Santa Fe"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  ></iframe>
                  <a
                    className="map-preview-link"
                    href={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="bi bi-box-arrow-up-right"></i> Open this location in Google Maps
                  </a>
                </div>
 
                {gpsCoords && (
                  <div className="gps-note">
                    <i className="bi bi-geo-alt-fill"></i> Pinned using your device's GPS ({gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)})
                  </div>
                )}
              </div>
 
              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-card-text" style={{ color: '#6b7280', fontSize: '14px', marginRight: '6px' }}></i>
                  Incident Details <span className="required">*</span>
                </label>
                <textarea
                  name="details"
                  value={formData.details}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Describe the emergency situation..."
                  required
                  disabled={isSubmitting}
                  className="form-textarea"
                ></textarea>
              </div>
 
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <i className="bi bi-people-fill" style={{ color: '#6b7280', fontSize: '14px', marginRight: '6px' }}></i>
                    Number of People Affected
                  </label>
                  <select
                    name="people"
                    value={formData.people}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="form-select"
                  >
                    <option value="">Select range</option>
                    {PEOPLE_AFFECTED_OPTIONS.map((range) => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <i className="bi bi-camera-video-fill" style={{ color: '#6b7280', fontSize: '14px', marginRight: '6px' }}></i>
                    Photo or Video {!isEditing && <span className="required">*</span>}
                  </label>
                  <input
                    type="file"
                    name="media"
                    ref={fileInputRef}
                    onChange={handleChange}
                    accept="image/jpeg,image/jpg,video/mp4,video/quicktime,video/webm"
                    required={!isEditing}
                    disabled={isSubmitting}
                    className="form-file"
                  />
                  <div className="media-hint">
                    {isEditing
                      ? 'Optional. Attach a new file only if you want to replace the one already on record. JPG/JPEG image (max 20MB) or MP4/MOV/WEBM video (max 50MB).'
                      : 'Required. JPG/JPEG image (max 20MB) or MP4/MOV/WEBM video (max 50MB).'}
                  </div>
                  {formData.mediaPreviewUrl && (
                    <>
                      <div className="media-preview">
                        {formData.mediaType === 'video' ? (
                          <video src={formData.mediaPreviewUrl} controls />
                        ) : (
                          <img src={formData.mediaPreviewUrl} alt="Selected attachment preview" />
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-remove-media"
                        onClick={removeMedia}
                        disabled={isSubmitting}
                      >
                        <i className="bi bi-trash3-fill"></i> Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
 
              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-info-circle-fill" style={{ color: '#6b7280', fontSize: '14px', marginRight: '6px' }}></i>
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
 
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginTop: '24px'
              }}>
                {!isEditing && cooldownRemaining > 0 && (
                  <div className="cooldown-banner">
                    <i className="bi bi-clock-history"></i> You can submit another emergency report in {formatRemaining(cooldownRemaining)}.
                  </div>
                )}
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
                      <i className="bi bi-hourglass-split loading-spinner"></i> {isEditing ? 'Saving...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill"></i> {isEditing ? 'Save Changes' : 'Submit Report'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
 
      {showAssistancePrompt && (
        <div className="modal-overlay" style={{ zIndex: 10001 }} onClick={closeAssistancePrompt}>
          <div className="assistance-popup-card" onClick={(e) => e.stopPropagation()}>
            <div className="assistance-popup-icon">
              <i className="bi bi-check-lg"></i>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#1f2937' }}>
              Report Submitted
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#4b5563', lineHeight: 1.5 }}>
              Our team will respond shortly. Would you also like to request assistance
              (food, water, medical aid, etc.) related to this emergency? This step is optional.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={closeAssistancePrompt}
                style={{
                  padding: '12px 16px',
                  borderRadius: '24px',
                  border: 'none',
                  background: '#6b7280',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                No, thanks
              </button>
              <button
                type="button"
                onClick={acceptAssistancePrompt}
                style={{
                  padding: '12px 16px',
                  borderRadius: '24px',
                  border: 'none',
                  background: '#dc3545',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Request Assistance
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
 
export default ResidentEmergencyModal;