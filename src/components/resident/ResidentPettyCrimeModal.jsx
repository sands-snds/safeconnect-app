import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPettyCrimeReport, updatePettyCrimeReport } from '../../Services/api';
import { showPopup } from '../shared/popup';
import { resultError, showIfMediaProblem } from './reportErrors';
import { useTextWarnings, serverTextErrors, TextWarning } from './textWarnings';
import LocationPickerMap from '../shared/location/LocationPickerMap';
import useLocationPin from '../shared/location/useLocationPin';
import { useLanguage } from '../../i18n/LanguageContext';
import { announceReportsChanged } from './useCallAccess';
import useRegisteredAddressFill, { useHomePinOnMap } from './useRegisteredAddress';
import ReportLocationFields, { EMPTY_LOCATION, composeLocation, coordsForSubmit } from './ReportLocationFields';
import { useMediaAttachment, readAsDataUrl } from '../shared/media/MediaAttachmentField';
import { ReportFormShell, StepHead, TypeTiles, Section, Lbl, WhoButtons, PairButtons, PersonBox, MediaPicker, ConsentBox, SendFoot, SentScreen } from './reportFormUi';
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

// "Other" asks for the kind of incident in its own box; that text is saved
// as the report's crime type (as the Assistance form does with its emergency).
// Text checks on step 2's boxes (its Next button waits for them).
const DETAIL_TEXT_FIELDS = ['crimeOther', 'description', 'suspectInfo', 'relOther', 'name', 'details'];
const OTHER_CRIME = 'Other';
const LISTED_CRIMES = CRIME_TYPES.map((c) => c.value).filter((v) => v !== OTHER_CRIME);
const crimeTypeOf = (form) => (form.crimeType === OTHER_CRIME ? form.crimeOther.trim() : form.crimeType);

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
    crimeOther: '',
    description: '',
    suspectInfo: '',
    consent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [sentReference, setSentReference] = useState('');
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

  // The map shows the resident's saved home pin while the report is at home;
  // moving the pin makes it "Somewhere else" (useHomePinOnMap).
  useHomePinOnMap({
    active: show && !isEditing,
    atHome: incidentPlace === 'home',
    gpsCoords,
    setGpsCoords,
    onMovedAway: () => setIncidentPlace('elsewhere')
  });
  const [victimName, setVictimName] = useState('');
  const [victimContact, setVictimContact] = useState('');
  const [victimRelationship, setVictimRelationship] = useState('');
  const [victimRelationshipOther, setVictimRelationshipOther] = useState('');
  const [victimDetails, setVictimDetails] = useState('');
  const isVictimNameOptional = NAME_OPTIONAL_RELATIONSHIPS.includes(victimRelationship);

  // Spam, gibberish or offensive text: a warning under the field, and Send
  // stays off until it's fixed (textWarnings.jsx; the backend checks again).
  const [textServerErrors, setTextServerErrors] = useState({});
  const forOthers = reportFor === 'others';
  const { warnings: textWarn, blocked: textBlocked } = useTextWarnings({
    crimeOther: { value: formData.crimeType === OTHER_CRIME ? formData.crimeOther : '', kind: 'short', api: 'crimeType' },
    description: { value: formData.description, kind: 'description', api: 'description' },
    suspectInfo: { value: formData.suspectInfo, kind: 'description', api: 'suspectInfo' },
    relOther: { value: forOthers ? victimRelationshipOther : '', kind: 'short', api: 'victimRelationship' },
    name: { value: forOthers ? victimName : '', kind: 'short', api: 'victimName' },
    details: { value: forOthers ? victimDetails : '', kind: 'description', api: 'victimDetails' },
    houseNumber: { value: isEditing ? '' : formData.houseNumber, kind: 'number' },
    street: { value: isEditing ? '' : formData.street, kind: 'short' },
    landmark: { value: isEditing ? '' : formData.landmark, kind: 'short' },
    location: { value: isEditing ? formData.location : '', kind: 'short', api: 'location' }
  }, textServerErrors);
  const chooseWho = (who) => {
    setReportFor(who);
    // Someone else's incident isn't at the resident's home: the place
    // switches to Somewhere else (and back to At my home for yourself).
    setIncidentPlace(who === 'others' ? 'elsewhere' : 'home');
    if (who === 'self') {
      setVictimName(''); setVictimContact(''); setVictimRelationship(''); setVictimRelationshipOther(''); setVictimDetails('');
    }
  };
  useEffect(() => {
    if (!editingReport) return;
    setFormData((prev) => ({
      ...prev,
      // A type typed under Other goes back into the Other box.
      crimeType: !editingReport.title ? '' : LISTED_CRIMES.includes(editingReport.title) ? editingReport.title : OTHER_CRIME,
      crimeOther: editingReport.title && !LISTED_CRIMES.includes(editingReport.title) && editingReport.title !== OTHER_CRIME ? editingReport.title : '',
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
      crimeOther: '',
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
    setTextServerErrors({});
  };

  // Closing the form (Cancel, X or clicking outside) clears it, so it opens
  // fresh, with the registered address filled in again.
  const resetRef = useRef(resetForm);
  resetRef.current = resetForm;
  useEffect(() => {
    if (!show) resetRef.current();
  }, [show]);

  // Two steps, as on Report Emergency: 1 who and what happened, 2 the rest.
  // Editing a report opens on step 2 (Back changes the crime type).
  const [step, setStep] = useState(1);
  useEffect(() => {
    if (show) setStep(editingReport ? 2 : 1);
  }, [show, editingReport]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (textBlocked) return; // the warnings under the fields say what to fix
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
    if (formData.crimeType === OTHER_CRIME && !formData.crimeOther.trim()) {
      showPopup({ type: 'warning', message: t('reportShared.need.crimeOther') });
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
          crimeType: crimeTypeOf(formData),
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
        crimeType: crimeTypeOf(formData),
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
        mediaSource: photoUrl && media.fromCamera ? 'camera' : null,
        
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
      setSentReference(result.reportReference || '');
      setShowSuccessPopup(true);
    } catch (error) {
      console.log(error);
      if (showIfMediaProblem(error, t)) return;
      const textErrors = serverTextErrors(error, {
        description: formData.description, suspectInfo: formData.suspectInfo, location: formData.location,
        crimeType: formData.crimeType === OTHER_CRIME ? formData.crimeOther : '',
        victimRelationship: victimRelationshipOther, victimName, victimDetails
      });
      if (textErrors) {
        setTextServerErrors(textErrors);
        // Only the address is on step 3; anything else is shown on step 2.
        if (Object.keys(textErrors).some((k) => k !== 'location')) setStep(2);
        return;
      }
      showPopup({ type: 'error', title: t('popup.submitFailedTitle'), message: t('pettyCrimeModal.submitError') });
    } finally {
      setIsSubmitting(false);
    }
  };
  // The first thing still needed before sending (shown above Send), or null.
  // detailsOnly: only what step 2 asks for (its Next button); otherwise
  // everything, for Send.
  const whatIsMissing = (detailsOnly = false) => {
    if (detailsOnly ? DETAIL_TEXT_FIELDS.some((k) => textWarn[k]) : textBlocked) return 'text';
    if (reportFor === 'others') {
      if (!victimRelationship) return 'rel';
      if (victimRelationship === 'Other' && !victimRelationshipOther.trim()) return 'relOther';
      if (!isVictimNameOptional && !victimName.trim()) return 'name';
      if (!victimDetails.trim()) return 'details';
    }
    if (!formData.crimeType) return 'crimeType';
    if (formData.crimeType === OTHER_CRIME && !formData.crimeOther.trim()) return 'crimeOther';
    if (!detailsOnly && isOutsideSantaFe) return 'outside';
    if (!detailsOnly && (isEditing ? !formData.location.trim() : (!gpsCoords && (!formData.houseNumber.trim() || !formData.street.trim())))) {
      return isEditing ? 'location' : 'address';
    }
    if (!formData.description.trim()) return 'description';
    if (needsNewMedia && !media.file) return 'crimePhoto';
    if (!detailsOnly && !formData.consent) return 'consent';
    return null;
  };
  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
    onClose();
  };
  if (!show && !showSuccessPopup) return null;

  const crimeItems = CRIME_TYPES.map((c) => ({
    value: c.value,
    icon: CRIME_ICONS[c.key],
    label: t(`reportShared.crimeShort.${c.key}`)
  }));
  const chosenCrime = CRIME_TYPES.find((c) => c.value === formData.crimeType);
  const crimeNote = chosenCrime && ['publicDisturbance', 'other'].includes(chosenCrime.key) ? t(`reportShared.crimeNote.${chosenCrime.key}`) : '';
  const missingKey = whatIsMissing();
  const detailsMissingKey = whatIsMissing(true);
  const detailsMissingText = !detailsMissingKey ? '' : t(`reportShared.need.${detailsMissingKey}`);
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
  <StepHead
    t={t}
    step={step}
    icon="bi-shield-fill-exclamation"
    title={t('pettyCrimeModal.title')}
    typeTitle={chosenCrime ? t(`reportShared.crimeShort.${chosenCrime.key}`) : ''}
    forOthers={reportFor === 'others'}
    total={3}
    onBack={() => setStep((n) => Math.max(1, n - 1))}
    onClose={onClose}
    disabled={isSubmitting}
  />
  <form className="qr-form" onSubmit={(e) => {
    if (step < 3) {
      e.preventDefault();
      if (step === 2 && !detailsMissingKey) setStep(3);
      return;
    }
    handleSubmit(e);
  }}>
    {step === 1 ? (
    <div className="qr-body">
      <WhoButtons
        id="pc-who"
        label={t('reportForm.reportingFor')}
        value={reportFor}
        onChange={chooseWho}
        labels={{ self: t('quickReport.who.self'), others: t('quickReport.who.others') }}
        disabled={isSubmitting}
      />
      <div>
        <p className="qr-lead" id="pc-type">{t('reportShared.whatHappened')} <span className="qr-req" aria-hidden="true">*</span></p>
        <p className="qr-hint">{t('reportShared.tapToContinue')}</p>
      </div>
      <TypeTiles
        cols={4}
        labelledBy="pc-type"
        items={crimeItems}
        value={formData.crimeType}
        onPick={(v) => { setFormData((prev) => ({ ...prev, crimeType: v, crimeOther: v === OTHER_CRIME ? prev.crimeOther : '' })); setStep(2); }}
        disabled={isSubmitting}
      />
    </div>
    ) : step === 2 ? (
    <div className="qr-body">
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
          warnings={textWarn}
        />
      )}

      <Section id="pc-about" title={t('reportShared.sectionIncident')} hint={t('reportShared.sectionIncidentHint')}>
        {crimeNote && <p className="qr-help" style={{ margin: 0 }}>{crimeNote}</p>}
        {formData.crimeType === OTHER_CRIME && (
          <div className="qr-field">
            <label htmlFor="pc-crime-other">{t('pettyCrimeModal.crimeOther')} <span className="qr-req">*</span></label>
            <input
              id="pc-crime-other"
              type="text"
              name="crimeOther"
              value={formData.crimeOther}
              onChange={handleChange}
              required
              maxLength={100}
              disabled={isSubmitting}
              placeholder={t('pettyCrimeModal.crimeOtherPlaceholder')}
              aria-invalid={Boolean(textWarn.crimeOther) || undefined}
            />
            <TextWarning t={t} reason={textWarn.crimeOther} />
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
            aria-invalid={Boolean(textWarn.description) || undefined}
          />
          <TextWarning t={t} reason={textWarn.description} />
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
            aria-invalid={Boolean(textWarn.suspectInfo) || undefined}
          />
          <TextWarning t={t} reason={textWarn.suspectInfo} />
        </div>
      </Section>

      <Section
        id="pc-media"
        title={t('reportShared.photoTitle')}
        req={needsNewMedia}
        optional={!needsNewMedia && formData.crimeType ? t('reportForm.optional') : null}
        hint={mediaHint}
      >
        <MediaPicker
          t={t}
          id="pc-media"
          hideLabel
          label={t('reportShared.photoTitle')}
          required={needsNewMedia}
          optionalText={formData.crimeType ? t('reportForm.optional') : null}
          media={media}
          fileInputRef={fileInputRef}
          onChange={handleMediaChange}
          onRemove={clearMedia}
          disabled={isSubmitting}
        />
      </Section>

    </div>
    ) : (
    <div className="qr-body">
      {isEditing ? (
        <Section id="pc-address" title={t('assistanceModal.currentAddress')} req>
          <div className="qr-edit-address">
            <input
              type="text"
              name="location"
              aria-labelledby="pc-address"
              required
              value={formData.location}
              onChange={handleChange}
              placeholder={t('reportForm.fullAddress')}
              disabled={isSubmitting}
              aria-invalid={Boolean(textWarn.location) || undefined}
            />
            <TextWarning t={t} reason={textWarn.location} />
            {locationError && <p className="qr-err"><i className="bi bi-exclamation-triangle-fill" aria-hidden="true" /> {locationError}</p>}
            <p className="qr-note">{t('reportForm.serviceAreaNote')}</p>
            <div ref={locationSectionRef}>
              <LocationPickerMap pin={gpsCoords} onPick={handlePickOnMap} isOutside={isOutsideSantaFe} outsideMessage={outsideMessage} disabled={isSubmitting} />
            </div>
          </div>
        </Section>
      ) : (
        <Section id="pc-where" title={t('pettyCrimeModal.whereHappened')} req>
          <div>
            <PairButtons
              id="pc-where"
              value={incidentPlace}
              onChange={setIncidentPlace}
              disabled={isSubmitting}
              options={[
                { value: 'home', icon: 'bi-house-door-fill', label: t('pettyCrimeModal.atHome'), disabled: forOthers, title: forOthers ? t('pettyCrimeModal.othersElsewhere') : undefined },
                { value: 'elsewhere', icon: 'bi-signpost-split-fill', label: t('pettyCrimeModal.elsewhere') }
              ]}
            />
            <div className="qr-addr">
              <ReportLocationFields
                t={t}
                formData={formData}
                onChange={handleChange}
                disabled={isSubmitting}
                showMap={showMap}
                alwaysShowMap
                location={location}
                sectionRef={locationSectionRef}
                addressPrefilled={addressPrefilled}
                warnings={textWarn}
              />
            </div>
          </div>
        </Section>
      )}

      <Section id="pc-confirm" title={t('reportShared.sectionConfirm')}>
        <ConsentBox checked={formData.consent} onChange={handleChange} disabled={isSubmitting}>{t('pettyCrimeModal.consent')}</ConsentBox>
        {!isEditing && cooldownRemaining > 0 && (
          <div className="qr-banner"><i className="bi bi-clock-history" aria-hidden="true" /> {t('pettyCrimeModal.cooldownBanner', { time: formatRemaining(cooldownRemaining) })}</div>
        )}
      </Section>
    </div>
    )}
    {step === 2 && (
    <SendFoot
      type="button"
      onClick={() => setStep(3)}
      missing={detailsMissingText}
      readyText={t('reportShared.readyNext')}
      label={t('reportShared.next')}
      icon="bi-arrow-right-circle-fill"
    />
    )}
    {step === 3 && (
    <SendFoot
      missing={missingText}
      readyText={t('reportShared.ready')}
      label={isEditing ? t('reportShared.saveChanges') : t('reportShared.sendReport')}
      busyLabel={isEditing ? t('reportForm.saving') : t('reportForm.submitting')}
      busy={isSubmitting}
      disabled={!isEditing && cooldownRemaining > 0}
      icon={isEditing ? 'bi-check-lg' : 'bi-send-fill'}
    />
    )}
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
    {sentReference && <p className="qr-ref">{t('quickReport.reference')} <b>{sentReference}</b></p>}
  </SentScreen>
</ReportFormShell>
)}
</>
  );
}
export default ResidentPettyCrimeModal;