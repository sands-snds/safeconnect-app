import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPettyCrimeReport, updatePettyCrimeReport } from '../../Services/api';
import { showPopup } from '../shared/popup';
import { resultError, showIfMediaTooLarge } from './reportErrors';
import LocationPickerMap from '../shared/location/LocationPickerMap';
import useLocationPin from '../shared/location/useLocationPin';
import { useLanguage } from '../../i18n/LanguageContext';
import { announceReportsChanged } from './useCallAccess';
import useRegisteredAddressFill from './useRegisteredAddress';
import ReportLocationFields, { EMPTY_LOCATION, composeLocation, coordsForSubmit } from './ReportLocationFields';
import MediaAttachmentField, { useMediaAttachment, readAsDataUrl } from '../shared/media/MediaAttachmentField';
const CRIME_TYPES = [
  { key: 'theft', value: 'Theft' },
  { key: 'vandalism', value: 'Vandalism' },
  { key: 'publicDisturbance', value: 'Public Disturbance' },
  { key: 'suspiciousActivity', value: 'Suspicious Activity' },
  { key: 'trespassing', value: 'Trespassing' },
  { key: 'harassment', value: 'Harassment' },
  { key: 'other', value: 'Other' }
];


const PHOTO_OPTIONAL_CRIME_TYPES = ['Theft', 'Suspicious Activity', 'Harassment'];

const REPORT_COOLDOWN_KEY = 'sf_lastReportTimestamp_pettycrime';

const REPORT_COOLDOWN_MS = 0;



const NAME_OPTIONAL_RELATIONSHIPS = ['Neighbor', 'Stranger', 'Other'];





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
function ResidentPettyCrimeModal({ show, type, onClose, editingReport, onUpdated }) {
  const { t } = useLanguage();
  const isEditing = Boolean(editingReport);
  const [formData, setFormData] = useState({
    ...EMPTY_LOCATION,
    location: '',
    crimeType: '',
    description: '',
    suspectInfo: '',
    consent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const { media, fileInputRef, handleMediaChange, clearMedia } = useMediaAttachment(t);
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  
  const hasExistingMedia = isEditing && Boolean(editingReport.has_media);
  const isPhotoRequired = Boolean(formData.crimeType) && !PHOTO_OPTIONAL_CRIME_TYPES.includes(formData.crimeType);
  const needsNewMedia = isPhotoRequired && !hasExistingMedia;
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
  // Where it happened: "At my home" fills in the registered address,
  // "Somewhere else" shows the map.
  const [incidentPlace, setIncidentPlace] = useState('home');
  const addressPrefilled = useRegisteredAddressFill({ active: show && !isEditing, atHome: incidentPlace === 'home', formData, setFormData });
  const showMap = incidentPlace === 'elsewhere';

  // Back to "At my home": the hidden map's pin no longer applies.
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
    setFormData((prev) => ({
      ...prev,
      crimeType: editingReport.title || '',
      description: editingReport.description || '',
      suspectInfo: editingReport.suspectInfo || '',
      location: editingReport.location || ''
    }));
    
    
    
    
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
    setFormData(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : value
    }));
  };
  const resetForm = () => {
    setFormData({
      ...EMPTY_LOCATION,
      location: '',
      crimeType: '',
      description: '',
      suspectInfo: '',
      consent: false
    });
    setReportFor('self');
    setIncidentPlace('home');
    setVictimName('');
    setVictimContact('');
    setVictimRelationship('');
    setVictimRelationshipOther('');
    setVictimDetails('');
    clearMedia();
    setIsAnonymous(false);
    setGpsCoords(null);
    setLocationError('');
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
        showPopup({ type: 'warning', message: t('pettyCrimeModal.cooldownAlert', { time: formatRemaining(remaining) }) });
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
      showPopup({ type: 'warning', message: t('reportForm.enterName') });
      return;
    }
    if (reportFor === 'others' && !victimDetails.trim()) {
      showPopup({ type: 'warning', message: t('reportForm.provideDetails') });
      return;
    }
    if (needsNewMedia && !media.file) {
      showPopup({ type: 'warning', message: t('pettyCrimeModal.mediaRequired') });
      return;
    }
    setIsSubmitting(true);
    try {
      const photoUrl = media.file ? await readAsDataUrl(media.file) : null;
      if (isEditing) {
        const result = await updatePettyCrimeReport({
          id: editingReport.id,
          crimeType: formData.crimeType,
          location: formData.location.trim(),
          latitude: gpsCoords ? gpsCoords.lat : null,
          longitude: gpsCoords ? gpsCoords.lng : null,
          description: formData.description,
          suspectInfo: formData.suspectInfo || null,
          
          ...(photoUrl ? { photoUrl, mediaType: media.type } : {})
        });
        if (!result.success) {
          throw resultError(result, t('reportForm.updateFailed'));
        }
        showPopup({ type: 'success', title: t('popup.updatedTitle'), message: t('pettyCrimeModal.updateSuccess') });
        announceReportsChanged();
        onUpdated && onUpdated();
        onClose();
        return;
      }
      const currentUser = getCurrentUser();
      const fullName = currentUser.fullName || currentUser.full_name || 'Anonymous Resident';
      const contact = currentUser.contact || currentUser.contact_number || null;
      const fullLocation = composeLocation(formData, gpsCoords);
      const coords = await coordsForSubmit(formData, gpsCoords, showMap);
      const result = await createPettyCrimeReport({
        crimeType: formData.crimeType,
        userId: currentUser.id || null,
        fullname: fullName,
        contact,
        location: fullLocation,
        latitude: coords ? coords.lat : null,
        longitude: coords ? coords.lng : null,
        description: formData.description,
        suspectInfo: formData.suspectInfo || null,
        photoUrl,
        mediaType: photoUrl ? media.type : null,
        
        isAnonymous,
        reportFor,
        victimName: reportFor === 'others' ? victimName.trim() : null,
        victimContact: reportFor === 'others' ? victimContact.trim() : null,
        victimRelationship: reportFor === 'others'
          ? (victimRelationship === 'Other' ? victimRelationshipOther.trim() : victimRelationship)
          : null,
        victimDetails: reportFor === 'others' ? victimDetails.trim() || null : null
      });
      if (!result.success) {
        throw resultError(result, t('reportForm.submitFailed'));
      }
      localStorage.setItem(getCooldownStorageKey(), Date.now().toString());
      announceReportsChanged();
      setCooldownRemaining(REPORT_COOLDOWN_MS);
      resetForm();
      setShowSuccessPopup(true);
    } catch (error) {
      console.log(error);
      if (showIfMediaTooLarge(error, t)) return;
      showPopup({ type: 'error', title: t('popup.submitFailedTitle'), message: t('pettyCrimeModal.submitError') });
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
        position:'fixed',
        top:0,
        left:0,
        right:0,
        bottom:0,
        width:'100vw',
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
        className="report-modal-card"
        onClick={(e)=>e.stopPropagation()}
        style={{
          backgroundColor:'white',
          borderRadius:'12px',
          maxWidth:'800px',
          width:'100%',
          overflowY:'auto',
          position:'relative',
          boxShadow:'0 20px 60px rgba(0,0,0,.3)'
        }}
>

<div style={{
          padding:'20px 24px',
          borderBottom:'1px solid #e5e7eb',
          position:'sticky',
          top:0,
          zIndex:1100,
          background:'#fff',
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
            {t('pettyCrimeModal.title')}
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
              {t('reportForm.reportingFor')}
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button"
                onClick={() => { setReportFor('self'); setVictimName(''); setVictimContact(''); setVictimRelationship(''); setVictimRelationshipOther(''); setVictimDetails(''); }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${reportFor === 'self' ? '#dc3545' : '#d1d5db'}`, background: reportFor === 'self' ? '#fef2f2' : '#fff', color: reportFor === 'self' ? '#dc3545' : '#374151', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                <i className="bi bi-person-fill" style={{ marginRight: '6px' }}></i>{t('reportForm.self')}
              </button>
              <button type="button"
                onClick={() => setReportFor('others')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${reportFor === 'others' ? '#dc3545' : '#d1d5db'}`, background: reportFor === 'others' ? '#fef2f2' : '#fff', color: reportFor === 'others' ? '#dc3545' : '#374151', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                <i className="bi bi-people-fill" style={{ marginRight: '6px' }}></i>{t('reportForm.others')}
              </button>
            </div>
          </div>
          {isEditing ? (
            editingReport.is_anonymous ? (
              <div style={{ marginBottom: '16px', fontSize: '13px', color: '#374151', background: '#f3f4f6', borderRadius: '8px', padding: '10px 14px' }}>
                <i className="bi bi-incognito" style={{ marginRight: '6px' }}></i>{t('pettyCrimeModal.anonymousOnEdit')}
              </div>
            ) : null
          ) : (
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '8px',
              border: `2px solid ${isAnonymous ? '#dc3545' : '#d1d5db'}`,
              background: isAnonymous ? '#fef2f2' : '#fff',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                disabled={isSubmitting}
                style={{ accentColor: '#dc3545', marginTop: '3px' }}
              />
              <span>
                <span style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: isAnonymous ? '#dc3545' : '#374151' }}>
                  <i className="bi bi-incognito" style={{ marginRight: '6px' }}></i>{t('pettyCrimeModal.anonymousLabel')}
                </span>
                <span style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                  {t('pettyCrimeModal.anonymousHint')}
                </span>
              </span>
            </label>
          )}
          {reportFor === 'others' && (
            <div style={{ marginBottom: '16px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontWeight: '600', color: '#dc3545', fontSize: '13px' }}>
                <i className="bi bi-person-exclamation"></i> {t('reportForm.personBoxLabel')}
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
              {t('pettyCrimeModal.crimeType')}
<span style={{color:'#dc3545'}}>*</span>
</label>
<select className="form-select"
              name="crimeType"
              required
              value={formData.crimeType}
              onChange={handleChange}
              style={{
                width:'100%',
                
                padding:'10px 36px 10px 14px',
                textOverflow:'ellipsis',
                borderRadius:'6px',
                border:'1px solid #d1d5db'
              }}
>
<option value="">
                {t('pettyCrimeModal.selectType')}
</option>
              {CRIME_TYPES.map(item=>(
<option
                  key={item.key}
                  value={item.value}
>
                  {t(`pettyCrimeModal.crimeTypes.${item.key}`)}
</option>
              ))}
</select>
</div>
<div style={{ marginTop:'20px', marginBottom:'16px' }}>
{isEditing ? (
<>
<label style={{ display:'flex', alignItems:'center', gap:'6px', fontWeight:'600', color:'#374151', fontSize:'13px', marginBottom:'8px' }}>
<i className="bi bi-geo-alt-fill"></i>
                {t('assistanceModal.currentAddress')}
<span style={{color:'#dc3545'}}>*</span>
</label>
<input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  placeholder={t('reportForm.fullAddress')}
                  style={{ width:'100%', padding:'10px 14px', borderRadius:'6px', border:'1px solid #d1d5db', fontSize:'14px', outline:'none' }}
                />
            {locationError && (
<div style={{ marginTop:'6px', fontSize:'12px', color:'#dc3545' }}>
<i className="bi bi-exclamation-triangle-fill"></i> {locationError}
</div>
            )}
<div style={{ marginTop:'6px', fontSize:'12px', color:'#6b7280' }}>
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
</>
) : (
<>
<label style={{ display:'block', fontWeight:'600', color:'#374151', fontSize:'13px', marginBottom:'8px' }}>
              {t('pettyCrimeModal.whereHappened')}
</label>
<div style={{ display:'flex', gap:'10px', marginBottom:'14px' }} role="group" aria-label={t('pettyCrimeModal.whereHappened')}>
              {[['home', 'bi-house-door-fill', 'pettyCrimeModal.atHome'], ['elsewhere', 'bi-signpost-split-fill', 'pettyCrimeModal.elsewhere']].map(([value, icon, key]) => (
<button
                  key={value}
                  type="button"
                  aria-pressed={incidentPlace === value}
                  onClick={() => setIncidentPlace(value)}
                  disabled={isSubmitting}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${incidentPlace === value ? '#dc3545' : '#d1d5db'}`, background: incidentPlace === value ? '#fef2f2' : '#fff', color: incidentPlace === value ? '#dc3545' : '#374151', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
<i className={`bi ${icon}`} style={{ marginRight: '6px' }}></i>{t(key)}
</button>
              ))}
</div>
<ReportLocationFields
  t={t}
  formData={formData}
  onChange={handleChange}
  disabled={isSubmitting}
  showMap={showMap}
  location={location}
  sectionRef={locationSectionRef}
  addressPrefilled={addressPrefilled}
/>
</>
)}
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
              {t('pettyCrimeModal.description')}
<span style={{color:'#dc3545'}}>*</span>
</label>
<textarea
              name="description"
              rows="4"
              required
              value={formData.description}
              onChange={handleChange}
              placeholder={t('pettyCrimeModal.descriptionPlaceholder')}
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
              {t('pettyCrimeModal.suspectInfo')}
</label>
<textarea
              name="suspectInfo"
              rows="3"
              value={formData.suspectInfo}
              onChange={handleChange}
              placeholder={t('pettyCrimeModal.suspectInfoPlaceholder')}
              style={{
                width:'100%',
                padding:'10px 14px',
                borderRadius:'6px',
                border:'1px solid #d1d5db'
              }}
            />
</div>
<MediaAttachmentField
            t={t}
            style={{ marginBottom: '16px' }}
            label={t('reportForm.photoOrVideo')}
            required={needsNewMedia}
            requiredMark={needsNewMedia}
            optionalMark={Boolean(formData.crimeType)}
            hint={hasExistingMedia
              ? t('reportForm.mediaHintEdit')
              : !formData.crimeType
                ? t('pettyCrimeModal.mediaHintSelectType')
                : isPhotoRequired
                  ? t('reportForm.mediaHintRequired')
                  : t('pettyCrimeModal.mediaHintOptional')}
            disabled={isSubmitting}
            media={media}
            fileInputRef={fileInputRef}
            onChange={handleMediaChange}
            onRemove={clearMedia}
          />
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
                {t('pettyCrimeModal.consent')}
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
<i className="bi bi-clock-history"></i> {t('pettyCrimeModal.cooldownBanner', { time: formatRemaining(cooldownRemaining) })}
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
<i className="bi bi-x-circle-fill"></i> {t('reportForm.cancel')}
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
                  {" "}{isEditing ? t('reportForm.saving') : t('reportForm.submitting')}
</>
              ) : (
<>
<i className="bi bi-send-fill"></i>
                  {" "}{isEditing ? t('reportForm.saveChanges') : t('pettyCrimeModal.submitCrimeReport')}
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
        {t('pettyCrimeModal.reportSubmitted')}
      </h3>
      <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#4b5563', lineHeight: 1.5 }}>
        {t('pettyCrimeModal.reportSubmittedBody')}
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
export default ResidentPettyCrimeModal;