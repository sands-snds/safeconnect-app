import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createEmergencyReport, updateEmergencyReport } from '../../Services/api';
import { showPopup } from '../shared/popup';
import LocationPickerMap from '../shared/location/LocationPickerMap';
import useLocationPin from '../shared/location/useLocationPin';
import { useLanguage } from '../../i18n/LanguageContext';
 
 
// Fixed service area — form only accepts reports from this barangay
const SERVICE_AREA = {
  barangay: 'Sta. Fe',
  city: 'Dasmariñas',
  province: 'Cavite',
  country: 'Philippines',
  lat: 14.3198,
  lng: 120.9644
};
 
const PEOPLE_AFFECTED_OPTIONS = ['1-10', '11-20', '21-30', '31-40'];
 
const SPECIAL_NEEDS_OPTIONS = [
  { key: 'elderly', value: 'Elderly' },
  { key: 'children', value: 'Children' },
  { key: 'pwd', value: 'Persons with disabilities' },
  { key: 'pregnant', value: 'Pregnant' },
  { key: 'pets', value: 'Pets' }
];

// Not everyone in the barangay knows the person they're reporting for by
// name — these relationships make the name field optional instead of required.
const NAME_OPTIONAL_RELATIONSHIPS = ['Neighbor', 'Stranger', 'Other'];
 
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
  const { t } = useLanguage();
  const isEditing = Boolean(editingReport);
  const [formData, setFormData] = useState({
    emergencyType: '',
    houseNumber: '',
    street: '',
    floorUnit: '',
    landmark: '',
    location: '', // single editable address field, used only when editing
    details: '',
    people: '',
    special: [],
    media: null,
    mediaPreviewUrl: null,
    mediaType: null,
    consent: false

  });
 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAssistancePrompt, setShowAssistancePrompt] = useState(false);
  const [submittedLocation, setSubmittedLocation] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [reportFor, setReportFor] = useState('self');
  const [victimName, setVictimName] = useState('');
  const [victimContact, setVictimContact] = useState('');
  const [victimRelationship, setVictimRelationship] = useState('');
  const [victimRelationshipOther, setVictimRelationshipOther] = useState('');
  const [victimDetails, setVictimDetails] = useState('');
  const isVictimNameOptional = NAME_OPTIONAL_RELATIONSHIPS.includes(victimRelationship);

  // Map pin, "Use my current location" and the Santa Fe boundary check
  // (../shared/location/useLocationPin.js). A new pin fills in the address.
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
  }, [editingReport, setGpsCoords]);
 
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
 
 
  // Revoke the object URL used for the media preview when it changes/unmounts
  useEffect(() => {
    return () => {
      if (formData.mediaPreviewUrl) URL.revokeObjectURL(formData.mediaPreviewUrl);
    };
  }, [formData.mediaPreviewUrl]);
 
  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
 
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
        showPopup({ type: 'warning', message: t('reportForm.mediaTypeError') });
        e.target.value = '';
        setFormData((prev) => ({ ...prev, media: null, mediaPreviewUrl: null, mediaType: null }));
        return;
      }

      const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

      if (file.size > maxSize) {
        showPopup({ type: 'warning', message: isVideo ? t('reportForm.mediaTooLargeVideo') : t('reportForm.mediaTooLargeImage') });
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
 
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
      landmark: '',
      location: '',
      details: '',
      people: '',
      special: [],
      media: null,
      mediaPreviewUrl: null,
      mediaType: null,
      consent: false
    });
    setGpsCoords(null);
    setLocationError('');
    setReportFor('self');
    setVictimName('');
    setVictimContact('');
    setVictimRelationship('');
    setVictimRelationshipOther('');
    setVictimDetails('');

    if (fileInputRef.current) fileInputRef.current.value = '';
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
 
    if (!isEditing) {
      const remaining = getCooldownRemainingMs();
      if (remaining > 0) {
        showPopup({ type: 'warning', message: t('emergencyModal.cooldownAlert', { time: formatRemaining(remaining) }) });
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
        showPopup({ type: 'warning', message: t('reportForm.provideLocation') });
        return;
      }
    } else if (!gpsCoords && (!formData.houseNumber.trim() || !formData.street.trim())) {
      showPopup({ type: 'warning', message: t('reportForm.pinLocation') });
      return;
    }

    // Media is required when filing a new report, but an edit already has a
    // photo/video on file — only require a new one if the resident chooses
    // to replace it.
    if (!isEditing && !formData.media) {
      showPopup({ type: 'warning', message: t('emergencyModal.mediaRequired') });
      return;
    }

    if (reportFor === 'others' && !victimRelationship) {
      showPopup({ type: 'warning', message: t('reportForm.selectRelationship') });
      return;
    }
    if (reportFor === 'others' && victimRelationship === 'Other' && !victimRelationshipOther.trim()) {
      showPopup({ type: 'warning', message: t('reportForm.specifyRelationship') });
      return;
    }
    if (reportFor === 'others' && !isVictimNameOptional && !victimName.trim()) {
      showPopup({ type: 'warning', message: t('reportForm.enterName') });
      return;
    }
    if (reportFor === 'others' && !victimDetails.trim()) {
      showPopup({ type: 'warning', message: t('reportForm.provideDetails') });
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
          throw new Error(result.message || t('reportForm.updateFailed'));
        }
        showPopup({ type: 'success', title: t('popup.updatedTitle'), message: t('emergencyModal.updateSuccess') });
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
      // A pinned report may have no typed address -- the pin is the exact spot.
      // The landmark goes in the same text, so admins and exports see it too.
      const landmark = formData.landmark.trim();
      const fullLocation = [
        formData.floorUnit.trim(),
        composedAddress || (gpsCoords ? 'Pinned location' : ''),
        `Barangay ${SERVICE_AREA.barangay}, ${SERVICE_AREA.city}, ${SERVICE_AREA.province}, ${SERVICE_AREA.country}`
      ].filter(Boolean).join(', ') + (landmark ? ` (Landmark: ${landmark})` : '');
 
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
        mediaType: formData.mediaType || null,
        reportFor,
        victimName: reportFor === 'others' ? victimName.trim() : null,
        victimContact: reportFor === 'others' ? victimContact.trim() : null,
        victimRelationship: reportFor === 'others'
          ? (victimRelationship === 'Other' ? victimRelationshipOther.trim() : victimRelationship)
          : null,
        victimDetails: reportFor === 'others' ? victimDetails.trim() || null : null
      });
 
      if (!result.success) {
        throw new Error(result.message || t('reportForm.submitFailed'));
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
      showPopup({ type: 'error', title: t('popup.submitFailedTitle'), message: t('emergencyModal.submitError') });
    } finally {
      setIsSubmitting(false);
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
 
        .reportfor-toggle {
          display: flex;
          gap: 10px;
        }

        .reportfor-btn {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          border: 2px solid #d1d5db;
          background: #fff;
          color: #374151;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        }

        .reportfor-btn.active {
          border-color: #dc3545;
          background: #fef2f2;
          color: #dc3545;
        }

        .victim-box {
          margin-bottom: 16px;
          background: #fff5f5;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 14px;
        }

        .victim-box-label {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
          font-weight: 600;
          color: #dc3545;
          font-size: 13px;
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
        <div className="modal-overlay">
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-icon">
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>
              <h2 className="modal-title">{isEditing ? t('emergencyModal.editTitle', { type: type || t('emergencyModal.defaultTypeEdit') }) : t('emergencyModal.reportTitle', { type: type || t('emergencyModal.defaultTypeReport') })}</h2>
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
                <label className="form-label">{t('reportForm.reportingFor')}</label>
                <div className="reportfor-toggle">
                  <button
                    type="button"
                    className={`reportfor-btn ${reportFor === 'self' ? 'active' : ''}`}
                    onClick={() => { setReportFor('self'); setVictimName(''); setVictimContact(''); setVictimRelationship(''); setVictimRelationshipOther(''); setVictimDetails(''); }}
                    disabled={isSubmitting}
                  >
                    <i className="bi bi-person-fill" style={{ marginRight: '6px' }}></i> {t('reportForm.self')}
                  </button>
                  <button
                    type="button"
                    className={`reportfor-btn ${reportFor === 'others' ? 'active' : ''}`}
                    onClick={() => setReportFor('others')}
                    disabled={isSubmitting}
                  >
                    <i className="bi bi-people-fill" style={{ marginRight: '6px' }}></i> {t('reportForm.others')}
                  </button>
                </div>
              </div>

              {reportFor === 'others' && (
                <div className="victim-box">
                  <div className="victim-box-label">
                    <i className="bi bi-person-exclamation"></i> {t('reportForm.personBoxLabel')}
                  </div>
                  <label className="form-label">{t('reportForm.relationship')} <span className="required">*</span></label>
                  <select
                    value={victimRelationship}
                    onChange={(e) => { setVictimRelationship(e.target.value); setVictimRelationshipOther(''); }}
                    disabled={isSubmitting}
                    className="form-select"
                    style={{ marginBottom: '10px' }}
                  >
                    <option value="">{t('reportForm.relationshipPlaceholder')}</option>
                    <option value="Family Member">{t('reportForm.relationshipOptions.family')}</option>
                    <option value="Friend">{t('reportForm.relationshipOptions.friend')}</option>
                    <option value="Neighbor">{t('reportForm.relationshipOptions.neighbor')}</option>
                    <option value="Colleague">{t('reportForm.relationshipOptions.colleague')}</option>
                    <option value="Stranger">{t('reportForm.relationshipOptions.stranger')}</option>
                    <option value="Other">{t('reportForm.relationshipOptions.other')}</option>
                  </select>
                  {victimRelationship === 'Other' && (
                    <input
                      type="text"
                      placeholder={t('reportForm.relationshipOtherPlaceholder')}
                      value={victimRelationshipOther}
                      onChange={(e) => setVictimRelationshipOther(e.target.value)}
                      disabled={isSubmitting}
                      className="form-input"
                      style={{ marginBottom: '10px' }}
                    />
                  )}
                  <div className="form-grid">
                    <div>
                      <label className="form-label">
                        {t('reportForm.theirName')}{' '}
                        {isVictimNameOptional
                          ? <span style={{ color: '#6b7280', fontWeight: 400 }}>{t('reportForm.optional')}</span>
                          : <span className="required">*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder={t('reportForm.namePlaceholder')}
                        value={victimName}
                        onChange={(e) => setVictimName(e.target.value)}
                        disabled={isSubmitting}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">{t('reportForm.theirContact')} <span style={{ color: '#6b7280', fontWeight: 400 }}>{t('reportForm.optional')}</span></label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="09XXXXXXXXX"
                        maxLength={11}
                        value={victimContact}
                        onChange={(e) => setVictimContact(e.target.value.replace(/\D/g, '').slice(0, 11))}
                        disabled={isSubmitting}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <label className="form-label" style={{ marginTop: '10px' }}>
                    {t('reportForm.additionalDetails')} <span className="required">*</span>
                  </label>
                  <textarea
                    placeholder={t('reportForm.additionalDetailsPlaceholder')}
                    value={victimDetails}
                    onChange={(e) => setVictimDetails(e.target.value)}
                    disabled={isSubmitting}
                    className="form-textarea"
                    rows={2}
                    style={{ minHeight: '60px' }}
                  />
                </div>
              )}

              <div className="form-group">
                <div className="form-group">
                  <label className="form-label">
                    <i
                      className="bi bi-exclamation-circle-fill"
                      style={{ color: '#6b7280', fontSize: '14px', marginRight: '6px' }}
                    ></i>
                    {t('emergencyModal.emergencyType')} <span className="required">*</span>
                  </label>

                  <select
                    name="emergencyType"
                    value={formData.emergencyType}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="form-select"
                  >
                    <option value="">{t('emergencyModal.selectType')}</option>
                    <option value="Fire Emergency">{t('emergencyModal.typeFire')}</option>
                    <option value="Flood Emergency">{t('emergencyModal.typeFlood')}</option>
                    <option value="Earthquake">{t('emergencyModal.typeEarthquake')}</option>
                  </select>
                </div>

                <div className="address-label-row">
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    <i className="bi bi-geo-alt-fill" style={{ color: '#6b7280', fontSize: '14px', marginRight: '6px' }}></i>
                    {t('reportForm.address')} <span className="required">*</span>
                  </label>
                  <button
                    type="button"
                    className="btn-locate"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating || isSubmitting}
                  >
                    {isLocating ? (
                      <>
                        <i className="bi bi-arrow-repeat loading-spinner"></i> {t('reportForm.locating')}
                      </>
                    ) : (
                      <>
                        <i className="bi bi-crosshair"></i> {t('reportForm.useCurrentLocation')}
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
                    placeholder={t('reportForm.fullAddress')}
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
                        placeholder={t('reportForm.houseNumberPlaceholder')}
                        required={!gpsCoords}
                        disabled={isSubmitting}
                        className="form-input"
                      />
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        placeholder={t('reportForm.streetPlaceholder')}
                        required={!gpsCoords}
                        disabled={isSubmitting}
                        className="form-input"
                      />
                    </div>

                    <input
                      type="text"
                      name="floorUnit"
                      value={formData.floorUnit}
                      onChange={handleChange}
                      placeholder={t('reportForm.floorUnitPlaceholder')}
                      disabled={isSubmitting}
                      className="form-input"
                      style={{ marginTop: '10px' }}
                    />
                    <input
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                      placeholder={t('reportForm.landmarkPlaceholder')}
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
                  {t('reportForm.serviceAreaNote')}
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
              </div>
 
              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-card-text" style={{ color: '#6b7280', fontSize: '14px', marginRight: '6px' }}></i>
                  {t('emergencyModal.incidentDetails')} <span className="required">*</span>
                </label>
                <textarea
                  name="details"
                  value={formData.details}
                  onChange={handleChange}
                  rows="5"
                  placeholder={t('emergencyModal.incidentDetailsPlaceholder')}
                  required
                  disabled={isSubmitting}
                  className="form-textarea"
                ></textarea>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <i className="bi bi-people-fill" style={{ color: '#6b7280', fontSize: '14px', marginRight: '6px' }}></i>
                    {t('reportForm.peopleAffected')}
                  </label>
                  <select
                    name="people"
                    value={formData.people}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="form-select"
                  >
                    <option value="">{t('reportForm.selectRange')}</option>
                    {PEOPLE_AFFECTED_OPTIONS.map((range) => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <i className="bi bi-camera-video-fill" style={{ color: '#6b7280', fontSize: '14px', marginRight: '6px' }}></i>
                    {t('reportForm.photoOrVideo')} {!isEditing && <span className="required">*</span>}
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
                      ? t('reportForm.mediaHintEdit')
                      : t('reportForm.mediaHintRequired')}
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
                        <i className="bi bi-trash3-fill"></i> {t('reportForm.remove')}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-info-circle-fill" style={{ color: '#6b7280', fontSize: '14px', marginRight: '6px' }}></i>
                  {t('emergencyModal.specialNeeds')}
                </label>
                <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px'
            }}>
              {SPECIAL_NEEDS_OPTIONS.map((option) => (
                <label
                  key={option.key}
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
                    checked={formData.special.includes(option.value)}
                    onChange={() => handleSpecialToggle(option.value)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      accentColor: '#dc3545'
                    }}
                  />
                  {t(`emergencyModal.specialNeedsOptions.${option.key}`)}
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
                    {t('reportForm.consent')}
                  </span>
                </label>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginTop: '24px'
              }}>
                {!isEditing && cooldownRemaining > 0 && (
                  <div className="cooldown-banner">
                    <i className="bi bi-clock-history"></i> {t('emergencyModal.cooldownBanner', { time: formatRemaining(cooldownRemaining) })}
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
                  <i className="bi bi-x-circle-fill"></i> {t('reportForm.cancel')}
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
                      <i className="bi bi-hourglass-split loading-spinner"></i> {isEditing ? t('reportForm.saving') : t('reportForm.submitting')}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill"></i> {isEditing ? t('reportForm.saveChanges') : t('reportForm.submitReport')}
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
              {t('emergencyModal.reportSubmitted')}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#4b5563', lineHeight: 1.5 }}>
              {t('emergencyModal.assistancePromptBody')}
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
                {t('emergencyModal.noThanks')}
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
                {t('emergencyModal.requestAssistance')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
 
export default ResidentEmergencyModal;