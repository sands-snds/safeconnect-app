import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createAssistanceRequest, updateAssistanceRequest } from '../../Services/api';
import { showPopup } from '../shared/popup';
import { resultError, showIfMediaTooLarge } from './reportErrors';
import LocationPickerMap from '../shared/location/LocationPickerMap';
import useLocationPin from '../shared/location/useLocationPin';
import { useLanguage } from '../../i18n/LanguageContext';
import { announceReportsChanged } from './useCallAccess';
import useRegisteredAddressFill from './useRegisteredAddress';
import ReportLocationFields, { EMPTY_LOCATION, composeLocation, coordsForSubmit } from './ReportLocationFields';
import SpecialNeedsPicker, { formatSpecialNeeds, parseSpecialNeeds, missingSpecialCount } from './SpecialNeedsPicker';
import MediaAttachmentField, { useMediaAttachment, readAsDataUrl } from '../shared/media/MediaAttachmentField';



const EMERGENCY_OPTIONS = [
  { value: 'Fire Emergency', labelKey: 'emergencyModal.typeFire' },
  { value: 'Flood Emergency', labelKey: 'emergencyModal.typeFlood' },
  { value: 'Earthquake', labelKey: 'emergencyModal.typeEarthquake' },
  { value: 'Typhoon', labelKey: 'emergencyModal.typeTyphoon' }
];
const OTHER_EMERGENCY = 'Other';


const MAX_PEOPLE_NEEDING_HELP = 500;
const NAME_OPTIONAL_RELATIONSHIPS = ['Neighbor', 'Stranger', 'Other'];
const REPORT_COOLDOWN_KEY = 'sf_lastReportTimestamp_assistance';

const REPORT_COOLDOWN_MS = 0;

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


function ResidentAssistanceModal({ show, type, serviceId, onClose, editingReport, onUpdated, prefill }) {
  const { t } = useLanguage();
  const isEditing = Boolean(editingReport);
  const [formData, setFormData] = useState({
    assistanceType: '',
    emergency: '',
    emergencyOther: '',
    ...EMPTY_LOCATION,
    location: '',
    situation: '',
    people: '',
    special: [],
    specialCounts: {},
    consent: false
  });
  const { media, fileInputRef, handleMediaChange, clearMedia } = useMediaAttachment(t);
  
  const hasExistingMedia = isEditing && Boolean(editingReport.has_media);
  const needsNewMedia = !hasExistingMedia;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  
  const fillAddressFromPin = useCallback(({ houseNumber, street, area, fullAddress }) => {
    setFormData((prev) => (isEditing
      ? { ...prev, location: fullAddress }
      : { ...prev, houseNumber: houseNumber || prev.houseNumber, street: street || prev.street, area: area || prev.area }));
  }, [isEditing]);
  const location = useLocationPin({ onAddress: fillAddressFromPin });
  const {
    gpsCoords,
    setGpsCoords,
    locationError,
    setLocationError,
    isOutsideSantaFe,
    outsideMessage,
    handlePickOnMap
  } = location;
  const locationSectionRef = useRef(null);
  const [reportFor, setReportFor] = useState('self');
  // Requesting for yourself fills in your registered address; the map is
  // only for requesting help for someone else.
  const addressPrefilled = useRegisteredAddressFill({ active: show && !isEditing, atHome: reportFor === 'self', formData, setFormData });
  const showMap = reportFor === 'others';

  // Back to "Myself": the hidden map's pin no longer applies.
  useEffect(() => {
    if (!isEditing && !showMap) setGpsCoords(null);
  }, [isEditing, showMap, setGpsCoords]);
  const [victimName, setVictimName] = useState('');
  const [victimContact, setVictimContact] = useState('');
  const [victimRelationship, setVictimRelationship] = useState('');
  const [victimRelationshipOther, setVictimRelationshipOther] = useState('');
  const [victimDetails, setVictimDetails] = useState('');
  const isVictimNameOptional = NAME_OPTIONAL_RELATIONSHIPS.includes(victimRelationship);

  useEffect(() => {
    if (!editingReport) return;
    
    const savedEmergency = editingReport.victim_of_emergency || '';
    const isListed = EMERGENCY_OPTIONS.some((o) => o.value === savedEmergency);
    setFormData((prev) => ({
      ...prev,
      emergency: !savedEmergency ? '' : isListed ? savedEmergency : OTHER_EMERGENCY,
      emergencyOther: savedEmergency && !isListed ? savedEmergency : '',
      assistanceType: editingReport.title || '',
      location: editingReport.location || '',
      situation: editingReport.description || '',
      people: editingReport.peopleAffected ? String(editingReport.peopleAffected) : '',
      special: parseSpecialNeeds(editingReport.specialNeeds).selected,
      specialCounts: parseSpecialNeeds(editingReport.specialNeeds).counts
    }));
    if (editingReport.latitude != null && editingReport.longitude != null) {
      setGpsCoords({ lat: editingReport.latitude, lng: editingReport.longitude });
    }
  }, [editingReport, setGpsCoords]);
  // Opened right after an emergency report: the same person and place.
  useEffect(() => {
    if (!show || editingReport || !prefill) return;
    if (prefill.reportFor !== 'others') return; // their registered address fills in
    setReportFor('others');
    if (prefill.address) setFormData((prev) => ({ ...prev, ...prefill.address }));
    if (prefill.latitude != null && prefill.longitude != null) {
      // After the "Myself" reset above has run for this render.
      setTimeout(() => setGpsCoords({ lat: prefill.latitude, lng: prefill.longitude }), 0);
    }
  }, [show, prefill, editingReport, setGpsCoords]);
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
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
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
  const [specialInvalid, setSpecialInvalid] = useState(null);
  const handleSpecialCount = (option, value) => {
    setSpecialInvalid(null);
    setFormData((prev) => ({ ...prev, specialCounts: { ...prev.specialCounts, [option]: value } }));
  };

  const resetForm = () => {
    setFormData({
      assistanceType: '',
      emergency: '',
      emergencyOther: '',
      ...EMPTY_LOCATION,
      location: '',
      situation: '',
      people: '',
      special: [],
      specialCounts: {},
      consent: false
    });
    setReportFor('self');
    setVictimName(''); setVictimContact(''); setVictimRelationship('');
    setVictimRelationshipOther(''); setVictimDetails('');
    clearMedia();
    setGpsCoords(null);
    setLocationError('');
    setSpecialInvalid(null);
  };

  // Closing the form (Cancel, X or clicking outside) clears it, so it opens
  // fresh, with the registered address filled in again.
  const resetRef = useRef(resetForm);
  resetRef.current = resetForm;
  useEffect(() => {
    if (!show) resetRef.current();
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing) {
      const remaining = getCooldownRemainingMs();
      if (remaining > 0) {
        showPopup({ type: 'warning', message: t('assistanceModal.cooldownAlert', { time: formatRemaining(remaining) }) });
        return;
      }
    }
    
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
    if (reportFor === 'others' && !victimRelationship) {
      showPopup({ type: 'warning', message: t('reportForm.selectRelationship') });
      return;
    }
    if (reportFor === 'others' && victimRelationship === 'Other' && !victimRelationshipOther.trim()) {
      showPopup({ type: 'warning', message: t('reportForm.specifyRelationship') });
      return;
    }
    if (reportFor === 'others' && !isVictimNameOptional && !victimName.trim()) {
      showPopup({ type: 'warning', message: t('assistanceModal.enterNameRequesting') });
      return;
    }
    if (reportFor === 'others' && !victimDetails.trim()) {
      showPopup({ type: 'warning', message: t('assistanceModal.provideDetailsRequesting') });
      return;
    }
    if (needsNewMedia && !media.file) {
      showPopup({ type: 'warning', message: t('assistanceModal.proofRequired') });
      return;
    }
    if (formData.emergency === OTHER_EMERGENCY && !formData.emergencyOther.trim()) {
      showPopup({ type: 'warning', message: t('assistanceModal.specifyEmergency') });
      return;
    }
    const peopleNeedingHelp = Number(formData.people);
    if (!Number.isInteger(peopleNeedingHelp) || peopleNeedingHelp < 1 || peopleNeedingHelp > MAX_PEOPLE_NEEDING_HELP) {
      showPopup({ type: 'warning', message: t('assistanceModal.peopleRequired', { max: MAX_PEOPLE_NEEDING_HELP }) });
      document.getElementById('as-people')?.focus();
      return;
    }
    const missingCount = missingSpecialCount(formData.special, formData.specialCounts);
    if (missingCount) {
      setSpecialInvalid(missingCount.key);
      showPopup({ type: 'warning', message: t('reportForm.specialNeedsCountRequired', { category: t(`emergencyModal.specialNeedsOptions.${missingCount.key}`) }) });
      document.getElementById(`as-special-count-${missingCount.key}`)?.focus();
      return;
    }
    const victimOfEmergency = formData.emergency === OTHER_EMERGENCY
      ? formData.emergencyOther.trim()
      : formData.emergency;
    const currentUser = getCurrentUser();
    if (!currentUser.id) {
      console.warn(
        'No user id found in sessionStorage("currentUser"). This request will be saved without a user_id and will not appear in "My Reports".'
      );
    }
    setIsSubmitting(true);
    try {
      const photoUrl = media.file ? await readAsDataUrl(media.file) : null;
      if (isEditing) {
        const result = await updateAssistanceRequest({
          id: editingReport.id,
          type: formData.assistanceType || 'General Assistance',
          victimOfEmergency,
          
          ...(photoUrl ? { photoUrl, mediaType: media.type } : {}),
          location: formData.location.trim(),
          latitude: gpsCoords ? gpsCoords.lat : null,
          longitude: gpsCoords ? gpsCoords.lng : null,
          situation: formData.situation,
          people: Number(formData.people),
          special: formatSpecialNeeds(formData.special, formData.specialCounts),
          urgency: null
        });
        if (!result.success) {
          throw resultError(result, t('assistanceModal.updateFailed'));
        }
        showPopup({ type: 'success', title: t('popup.updatedTitle'), message: t('assistanceModal.updateSuccess') });
        announceReportsChanged();
        onUpdated && onUpdated();
        onClose();
        return;
      }
      const fullName = currentUser.fullName || currentUser.full_name || 'Anonymous Resident';
      const contact = currentUser.contact || currentUser.contact_number || 'Not provided';
      const email = currentUser.email || currentUser.email_address || '';
      const fullLocation = composeLocation(formData, gpsCoords);
      const coords = await coordsForSubmit(formData, gpsCoords, showMap);
      const result = await createAssistanceRequest({
        type: formData.assistanceType || 'General Assistance',
        victimOfEmergency,
        photoUrl,
        mediaType: photoUrl ? media.type : null,
        userId: currentUser.id || null,
        fullname: fullName,
        contact,
        email,
        location: fullLocation,
        latitude: coords ? coords.lat : null,
        longitude: coords ? coords.lng : null,
        situation: formData.situation,
        people: Number(formData.people),
        special: formatSpecialNeeds(formData.special, formData.specialCounts),
        reportFor,
        victimName: reportFor === 'others' ? victimName.trim() : null,
        victimContact: reportFor === 'others' ? victimContact.trim() : null,
        victimRelationship: reportFor === 'others'
          ? (victimRelationship === 'Other' ? victimRelationshipOther.trim() : victimRelationship)
          : null,
        victimDetails: reportFor === 'others' ? victimDetails.trim() || null : null
      });
      if (!result.success) {
        throw resultError(result, t('assistanceModal.submitFailed'));
      }
      localStorage.setItem(getCooldownStorageKey(), Date.now().toString());
      announceReportsChanged();
      setCooldownRemaining(REPORT_COOLDOWN_MS);
      resetForm();
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      if (showIfMediaTooLarge(error, t)) return;
      showPopup({ type: 'error', title: t('popup.submitFailedTitle'), message: t('assistanceModal.submitError') });
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
<style>{`
  .rf-2col { display: grid; grid-template-columns: 1fr 1fr; }
  @media (max-width: 480px) { .rf-2col { grid-template-columns: 1fr; } }
`}</style>
{show && (
<div
      className="modal-overlay report-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
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
        className="modal-container report-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '800px',
          width: '100%',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
>

<div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          background: '#fff',
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
          }}>{isEditing ? t('assistanceModal.editTitle') : t('assistanceModal.requestTitle')}</h2>
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
              {t('assistanceModal.whoRequestingFor')}
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button"
                onClick={() => { setReportFor('self'); setVictimName(''); setVictimContact(''); setVictimRelationship(''); setVictimRelationshipOther(''); setVictimDetails(''); }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${reportFor === 'self' ? '#dc3545' : '#d1d5db'}`, background: reportFor === 'self' ? '#fef2f2' : '#fff', color: reportFor === 'self' ? '#dc3545' : '#374151', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                <i className="bi bi-person-fill" style={{ marginRight: '6px' }}></i>{t('assistanceModal.myself')}
              </button>
              <button type="button"
                onClick={() => setReportFor('others')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${reportFor === 'others' ? '#dc3545' : '#d1d5db'}`, background: reportFor === 'others' ? '#fef2f2' : '#fff', color: reportFor === 'others' ? '#dc3545' : '#374151', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                <i className="bi bi-people-fill" style={{ marginRight: '6px' }}></i>{t('assistanceModal.someoneElse')}
              </button>
            </div>
          </div>
          {reportFor === 'others' && (
            <div style={{ marginBottom: '16px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontWeight: '600', color: '#dc3545', fontSize: '13px' }}>
                <i className="bi bi-person-exclamation"></i> {t('assistanceModal.personBoxLabel')}
              </label>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>{t('reportForm.relationship')} <span style={{ color: '#dc3545' }}>*</span></label>
              <select className="form-select" value={victimRelationship} onChange={e => { setVictimRelationship(e.target.value); setVictimRelationshipOther(''); }}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', marginBottom: '10px' }}>
                <option value="">{t('reportForm.relationshipPlaceholder')}</option>
                <option value="Family Member">{t('reportForm.relationshipOptions.family')}</option>
                <option value="Friend">{t('reportForm.relationshipOptions.friend')}</option>
                <option value="Neighbor">{t('reportForm.relationshipOptions.neighbor')}</option>
                <option value="Colleague">{t('reportForm.relationshipOptions.colleague')}</option>
                <option value="Stranger">{t('reportForm.relationshipOptions.stranger')}</option>
                <option value="Other">{t('reportForm.relationshipOptions.other')}</option>
              </select>
              {victimRelationship === 'Other' && (
                <input type="text" placeholder={t('reportForm.relationshipOtherPlaceholder')}
                  value={victimRelationshipOther} onChange={e => setVictimRelationshipOther(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', marginBottom: '10px' }} />
              )}
              <div className="rf-2col" style={{ gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                    {t('reportForm.theirName')}{' '}
                    {isVictimNameOptional
                      ? <span style={{ color: '#6b7280', fontWeight: 400 }}>{t('reportForm.optional')}</span>
                      : <span style={{ color: '#dc3545' }}>*</span>}
                  </label>
                  <input type="text" placeholder={t('reportForm.namePlaceholder')} value={victimName} onChange={e => setVictimName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>{t('reportForm.theirContact')} <span style={{ color: '#6b7280', fontWeight: 400 }}>{t('reportForm.optional')}</span></label>
                  <input type="tel" inputMode="numeric" placeholder="09XXXXXXXXX" maxLength={11} value={victimContact}
                    onChange={e => setVictimContact(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }} />
                </div>
              </div>
              <label style={{ display: 'block', margin: '10px 0 6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                {t('reportForm.additionalDetails')} <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <textarea
                placeholder={t('reportForm.additionalDetailsPlaceholder')}
                value={victimDetails} onChange={e => setVictimDetails(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }} />
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
              {t('assistanceModal.assistanceType')} <span style={{ color: '#dc3545' }}>*</span>
</label>
<select className="form-select"
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
<option value="">{t('assistanceModal.selectType')}</option>
<option value="Food and Water">
                {t('assistanceModal.typeFoodWater')}
</option>
<option value="Medical Aid">
                {t('assistanceModal.typeMedicalAid')}
</option>
<option value="Transport Vehicle">
                {t('assistanceModal.typeTransportVehicle')}
</option>
</select>
</div>
<div className="rf-2col" style={{ gap: '12px', marginBottom: '16px', alignItems: 'start' }}>
<div>
<label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '13px'
              }}>
<i className="bi bi-exclamation-circle-fill" style={{ color: '#374151', fontSize: '14px' }}></i>
                {t('assistanceModal.victimOfEmergency')} <span style={{ color: '#dc3545' }}>*</span>
</label>
<select className="form-select"
                name="emergency"
                value={formData.emergency}
                onChange={(e) => setFormData((prev) => ({ ...prev, emergency: e.target.value, emergencyOther: '' }))}
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
<option value="">{t('assistanceModal.selectEmergency')}</option>
                {EMERGENCY_OPTIONS.map((opt) => (
<option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                ))}
<option value={OTHER_EMERGENCY}>{t('assistanceModal.emergencyOther')}</option>
</select>
              {formData.emergency === OTHER_EMERGENCY && (
<input
                  type="text"
                  name="emergencyOther"
                  value={formData.emergencyOther}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  disabled={isSubmitting}
                  placeholder={t('assistanceModal.emergencyOtherPlaceholder')}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    outline: 'none',
                    marginTop: '8px'
                  }}
                />
              )}
</div>
<MediaAttachmentField
              t={t}
              label={t('assistanceModal.proofPhoto')}
              required={needsNewMedia}
              requiredMark={needsNewMedia}
              hint={hasExistingMedia ? t('reportForm.mediaHintEdit') : t('assistanceModal.proofHint')}
              disabled={isSubmitting}
              media={media}
              fileInputRef={fileInputRef}
              onChange={handleMediaChange}
              onRemove={clearMedia}
            />
</div>
{isEditing ? (
<>
<label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: '#374151', fontSize: '13px', marginBottom: '8px' }}>
<i className="bi bi-geo-alt-fill" style={{ color: '#374151', fontSize: '14px' }}></i>
                {t('assistanceModal.currentAddress')} <span style={{ color: '#dc3545' }}>*</span>
</label>
<input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder={t('reportForm.fullAddress')}
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
            {locationError && (
<div style={{ marginTop: '6px', fontSize: '12px', color: '#dc3545' }}>
<i className="bi bi-exclamation-triangle-fill"></i> {locationError}
</div>
            )}
<div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
              {t('assistanceModal.serviceAreaNote')}
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
</>
) : (
<ReportLocationFields
  t={t}
  formData={formData}
  onChange={handleChange}
  disabled={isSubmitting}
  showMap={showMap}
  location={location}
  sectionRef={locationSectionRef}
  addressPrefilled={addressPrefilled}
  serviceAreaNote={t('assistanceModal.serviceAreaNote')}
/>
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
              {t('assistanceModal.describeSituation')} <span style={{ color: '#dc3545' }}>*</span>
</label>
<textarea
              name="situation"
              value={formData.situation}
              onChange={handleChange}
              rows="4"
              placeholder={t('assistanceModal.situationPlaceholder')}
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
<label htmlFor="as-people" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '13px'
            }}>
<i className="bi bi-people-fill" style={{ color: '#374151', fontSize: '14px' }}></i>
              {t('assistanceModal.peopleNeedingHelp')} <span style={{ color: '#dc3545' }}>*</span>
</label>
<input
              id="as-people"
              type="number"
              name="people"
              inputMode="numeric"
              min={1}
              max={MAX_PEOPLE_NEEDING_HELP}
              step={1}
              value={formData.people}
              onChange={(e) => setFormData((prev) => ({ ...prev, people: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
              placeholder={t('assistanceModal.peoplePlaceholder')}
              required
              disabled={isSubmitting}
              style={{
                width: '100%',
                maxWidth: '220px',
                height: '40px',
                padding: '0 14px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#dc3545'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
/>
<div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>{t('assistanceModal.peopleHint')}</div>
</div>
<div className="form-group" style={{ marginBottom: '16px' }}>
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
              {t('emergencyModal.specialNeeds')}
</label>
<SpecialNeedsPicker
  idPrefix="as-special"
  selected={formData.special}
  counts={formData.specialCounts}
  onToggle={handleSpecialToggle}
  onCountChange={handleSpecialCount}
  disabled={isSubmitting}
  invalidKey={specialInvalid}
/>
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
<i className="bi bi-clock-history"></i> {t('assistanceModal.cooldownBanner', { time: formatRemaining(cooldownRemaining) })}
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
<i className="bi bi-hourglass-split"></i> {isEditing ? t('reportForm.saving') : t('reportForm.submitting')}
</>
              ) : (
<>
<i className="bi bi-send-fill"></i> {isEditing ? t('reportForm.saveChanges') : t('assistanceModal.submitRequest')}
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
    className="modal-overlay report-modal-overlay"
    onClick={(e) => { if (e.target === e.currentTarget) closeSuccessPopup(); }}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
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
        {t('assistanceModal.requestSubmitted')}
      </h3>
      <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#4b5563', lineHeight: 1.5 }}>
        {t('assistanceModal.requestSubmittedBody')}
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
        {t('assistanceModal.done')}
      </button>
    </div>
  </div>
)}
</>
  );
}
export default ResidentAssistanceModal;