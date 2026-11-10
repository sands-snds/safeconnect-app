import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPettyCrimeReport, updatePettyCrimeReport } from '../../Services/api';
import { showPopup } from '../shared/popup';
import { resultError, showIfMediaProblem } from './reportErrors';
import LocationPickerMap from '../shared/location/LocationPickerMap';
import useLocationPin from '../shared/location/useLocationPin';
import { useLanguage } from '../../i18n/LanguageContext';
import { announceReportsChanged } from './useCallAccess';
import useRegisteredAddressFill from './useRegisteredAddress';
import ReportLocationFields, { EMPTY_LOCATION, composeLocation, coordsForSubmit } from './ReportLocationFields';
import { useMediaAttachment, readAsDataUrl } from '../shared/media/MediaAttachmentField';
import { translations } from '../../i18n/translations';
import { ReportFormShell, ReportHead, Lbl, WhoButtons, PairButtons, ChoiceTiles, PersonBox, MediaPicker, ConsentBox, SendFoot, SentScreen } from './reportFormUi';
const CRIME_TYPES = [
  { key: 'theft', value: 'Theft' },
  { key: 'vandalism', value: 'Vandalism' },
  { key: 'publicDisturbance', value: 'Public Disturbance' },
  { key: 'suspiciousActivity', value: 'Suspicious Activity' },
  { key: 'trespassing', value: 'Trespassing' },
  { key: 'harassment', value: 'Harassment' },
  { key: 'other', value: 'Other' }
];


const CRIME_ICONS = {
  theft: 'bi-bag-x-fill',
  vandalism: 'bi-hammer',
  publicDisturbance: 'bi-megaphone-fill',
  suspiciousActivity: 'bi-eye-fill',
  trespassing: 'bi-door-open-fill',
  harassment: 'bi-person-exclamation',
  other: 'bi-three-dots'
};

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
  const { t, language } = useLanguage();
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
  const chooseWho = (who) => {
    setReportFor(who);
    if (who === 'self') {
      setVictimName(''); setVictimContact(''); setVictimRelationship(''); setVictimRelationshipOther(''); setVictimDetails('');
    }
  };
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
    // Chosen with buttons now, so checked here rather than by the browser.
    if (!formData.crimeType) {
      showPopup({ type: 'warning', message: t('reportShared.need.crimeType') });
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
      if (showIfMediaProblem(error, t)) return;
      showPopup({ type: 'error', title: t('popup.submitFailedTitle'), message: t('pettyCrimeModal.submitError') });
    } finally {
      setIsSubmitting(false);
    }
  };
  // The first thing still needed before sending (shown above Send), or null.
  const whatIsMissing = () => {
    if (reportFor === 'others') {
      if (!victimRelationship) return 'rel';
      if (victimRelationship === 'Other' && !victimRelationshipOther.trim()) return 'relOther';
      if (!isVictimNameOptional && !victimName.trim()) return 'name';
      if (!victimDetails.trim()) return 'details';
    }
    if (!formData.crimeType) return 'crimeType';
    if (isOutsideSantaFe) return 'outside';
    if (isEditing ? !formData.location.trim() : (!gpsCoords && (!formData.houseNumber.trim() || !formData.street.trim()))) {
      return isEditing ? 'location' : 'address';
    }
    if (!formData.description.trim()) return 'description';
    if (needsNewMedia && !media.file) return 'crimePhoto';
    if (!formData.consent) return 'consent';
    return null;
  };
  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
    onClose();
  };
  if (!show && !showSuccessPopup) return null;

  const otherLang = translations[language === 'tl' ? 'en' : 'tl'] || {};
  const crimeItems = CRIME_TYPES.map((c) => ({
    value: c.value,
    icon: CRIME_ICONS[c.key],
    label: t(`reportShared.crimeShort.${c.key}`),
    sub: otherLang.reportShared?.crimeShort?.[c.key] || ''
  }));
  const chosenCrime = CRIME_TYPES.find((c) => c.value === formData.crimeType);
  const crimeNote = chosenCrime && ['publicDisturbance', 'other'].includes(chosenCrime.key) ? t(`reportShared.crimeNote.${chosenCrime.key}`) : '';
  const missingKey = whatIsMissing();
  const missingText = !missingKey ? '' : missingKey === 'outside' ? t('reportForm.outsideSantaFe') : t(`reportShared.need.${missingKey}`);
  const mediaHint = hasExistingMedia
    ? t('reportForm.mediaHintEdit')
    : !formData.crimeType
      ? t('pettyCrimeModal.mediaHintSelectType')
      : isPhotoRequired ? t('reportForm.mediaHintRequired') : t('pettyCrimeModal.mediaHintOptional');

  return (
<>
{show && (
<ReportFormShell tone="crime">
  <ReportHead
    icon="bi-shield-fill-exclamation"
    title={t('pettyCrimeModal.title')}
    onClose={onClose}
    closeLabel={t('quickReport.close')}
    disabled={isSubmitting}
  />
  <form className="qr-form" onSubmit={handleSubmit}>
    <div className="qr-body">
      <WhoButtons
        id="pc-who"
        label={t('reportForm.reportingFor')}
        value={reportFor}
        onChange={chooseWho}
        labels={{ self: t('quickReport.who.self'), others: t('quickReport.who.others') }}
        disabled={isSubmitting}
      />
      {/* No anonymous option for new reports; one filed anonymously before keeps it. */}
      {isEditing && editingReport.is_anonymous && (
        <div className="qr-info"><i className="bi bi-incognito" aria-hidden="true" /> {t('pettyCrimeModal.anonymousOnEdit')}</div>
      )}
      {reportFor === 'others' && (
        <PersonBox
          t={t}
          idPrefix="pc"
          title={t('reportForm.personBoxLabel')}
          rel={victimRelationship}
          onRel={(v) => { setVictimRelationship(v); setVictimRelationshipOther(''); }}
          relOther={victimRelationshipOther}
          onRelOther={setVictimRelationshipOther}
          name={victimName}
          onName={setVictimName}
          nameOptional={isVictimNameOptional}
          contact={victimContact}
          onContact={setVictimContact}
          details={victimDetails}
          onDetails={setVictimDetails}
          disabled={isSubmitting}
        />
      )}

      <div>
        <Lbl id="pc-type" icon="bi-list-check" req>{t('reportShared.whatHappened')}</Lbl>
        <ChoiceTiles
          wide
          labelledBy="pc-type"
          items={crimeItems}
          value={formData.crimeType}
          onChange={(v) => setFormData((prev) => ({ ...prev, crimeType: v }))}
          disabled={isSubmitting}
        />
        {crimeNote && <p className="qr-help">{crimeNote}</p>}
      </div>

      {isEditing ? (
        <div className="qr-edit-address">
          <Lbl id="pc-address" icon="bi-geo-alt-fill" req as="label">{t('assistanceModal.currentAddress')}</Lbl>
          <input
            type="text"
            name="location"
            aria-labelledby="pc-address"
            required
            value={formData.location}
            onChange={handleChange}
            placeholder={t('reportForm.fullAddress')}
            disabled={isSubmitting}
          />
          {locationError && <p className="qr-err"><i className="bi bi-exclamation-triangle-fill" aria-hidden="true" /> {locationError}</p>}
          <p className="qr-note">{t('reportForm.serviceAreaNote')}</p>
          <div ref={locationSectionRef}>
            <LocationPickerMap pin={gpsCoords} onPick={handlePickOnMap} isOutside={isOutsideSantaFe} outsideMessage={outsideMessage} disabled={isSubmitting} />
          </div>
        </div>
      ) : (
        <div>
          <Lbl id="pc-where" icon="bi-geo-alt-fill" req>{t('pettyCrimeModal.whereHappened')}</Lbl>
          <PairButtons
            id="pc-where"
            value={incidentPlace}
            onChange={setIncidentPlace}
            disabled={isSubmitting}
            options={[
              { value: 'home', icon: 'bi-house-door-fill', label: t('pettyCrimeModal.atHome') },
              { value: 'elsewhere', icon: 'bi-signpost-split-fill', label: t('pettyCrimeModal.elsewhere') }
            ]}
          />
          <div style={{ marginTop: 12 }}>
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
          </div>
        </div>
      )}

      <div className="qr-field">
        <Lbl id="pc-description" icon="bi-chat-left-text-fill" req as="label">{t('pettyCrimeModal.description')}</Lbl>
        <textarea
          name="description"
          aria-labelledby="pc-description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          maxLength={2000}
          required
          placeholder={t('pettyCrimeModal.descriptionPlaceholder')}
          disabled={isSubmitting}
        />
      </div>

      <div className="qr-field">
        <Lbl id="pc-suspect" icon="bi-person-bounding-box" optional={t('reportForm.optional')} as="label">{t('pettyCrimeModal.suspectInfo')}</Lbl>
        <textarea
          name="suspectInfo"
          aria-labelledby="pc-suspect"
          value={formData.suspectInfo}
          onChange={handleChange}
          rows={3}
          maxLength={1000}
          placeholder={t('pettyCrimeModal.suspectInfoPlaceholder')}
          disabled={isSubmitting}
        />
      </div>

      <MediaPicker
        t={t}
        id="pc-media"
        label={t('reportShared.photoTitle')}
        required={needsNewMedia}
        optionalText={formData.crimeType ? t('reportForm.optional') : null}
        hint={mediaHint}
        media={media}
        fileInputRef={fileInputRef}
        onChange={handleMediaChange}
        onRemove={clearMedia}
        disabled={isSubmitting}
      />

      <ConsentBox checked={formData.consent} onChange={handleChange} disabled={isSubmitting}>{t('pettyCrimeModal.consent')}</ConsentBox>

      {!isEditing && cooldownRemaining > 0 && (
        <div className="qr-banner"><i className="bi bi-clock-history" aria-hidden="true" /> {t('pettyCrimeModal.cooldownBanner', { time: formatRemaining(cooldownRemaining) })}</div>
      )}
    </div>
    <SendFoot
      missing={missingText}
      readyText={t('reportShared.ready')}
      label={isEditing ? t('reportShared.saveChanges') : t('reportShared.sendReport')}
      busyLabel={isEditing ? t('reportForm.saving') : t('reportForm.submitting')}
      busy={isSubmitting}
      disabled={!isEditing && cooldownRemaining > 0}
      icon={isEditing ? 'bi-check-lg' : 'bi-send-fill'}
    />
  </form>
</ReportFormShell>
)}

{showSuccessPopup && (
<ReportFormShell tone="crime">
  <SentScreen
    title={t('pettyCrimeModal.reportSubmitted')}
    actions={<button type="button" className="qr-btn soft" onClick={closeSuccessPopup}>{t('assistanceModal.done')}</button>}
  >
    <p>{t('pettyCrimeModal.reportSubmittedBody')}</p>
  </SentScreen>
</ReportFormShell>
)}
</>
  );
}
export default ResidentPettyCrimeModal;