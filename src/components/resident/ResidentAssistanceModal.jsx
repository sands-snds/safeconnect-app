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
import { useMediaAttachment, readAsDataUrl } from '../shared/media/MediaAttachmentField';
import { translations } from '../../i18n/translations';
import { ReportFormShell, ReportHead, Lbl, WhoButtons, PairButtons, ChoiceTiles, Pills, PersonBox, MediaPicker, ConsentBox, SendFoot, SentScreen } from './reportFormUi';



const EMERGENCY_OPTIONS = [
  { value: 'Fire Emergency', labelKey: 'emergencyModal.typeFire', icon: 'bi-fire' },
  { value: 'Flood Emergency', labelKey: 'emergencyModal.typeFlood', icon: 'bi-water' },
  { value: 'Earthquake', labelKey: 'emergencyModal.typeEarthquake', icon: 'bi-activity' },
  { value: 'Typhoon', labelKey: 'emergencyModal.typeTyphoon', icon: 'bi-tropical-storm' }
];
// The saved values are unchanged; the tiles show short names.
const ASSISTANCE_TYPES = [
  { value: 'Food and Water', key: 'foodWater', icon: 'bi-basket2-fill' },
  { value: 'Medical Aid', key: 'medicalAid', icon: 'bi-heart-pulse-fill' },
  { value: 'Transport Vehicle', key: 'transportVehicle', icon: 'bi-truck-front-fill' }
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
  const { t, language } = useLanguage();
  const isEditing = Boolean(editingReport);
  const [formData, setFormData] = useState({
    assistanceType: '',
    emergency: '',
    emergencyOther: '',
    ...EMPTY_LOCATION,
    location: '',
    situation: '',
    people: '1',
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
  // Where help should go: "At my home" fills in the registered address,
  // "Somewhere else" shows the map. Choosing "Someone else" starts on
  // "Somewhere else"; the resident can still change it.
  const [helpPlace, setHelpPlace] = useState('home');
  const addressPrefilled = useRegisteredAddressFill({ active: show && !isEditing, atHome: helpPlace === 'home', formData, setFormData });
  const showMap = helpPlace === 'elsewhere';

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
  const chooseWho = (who) => {
    setReportFor(who);
    setHelpPlace(who === 'others' ? 'elsewhere' : 'home');
    if (who === 'self') {
      setVictimName(''); setVictimContact(''); setVictimRelationship(''); setVictimRelationshipOther(''); setVictimDetails('');
    }
  };

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
    setHelpPlace('elsewhere');
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
      people: '1',
      special: [],
      specialCounts: {},
      consent: false
    });
    setReportFor('self');
    setHelpPlace('home');
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
    // Chosen with buttons now, so checked here rather than by the browser.
    const unchosen = !formData.assistanceType ? 'assistType' : !formData.emergency ? 'emergency' : null;
    if (unchosen) {
      showPopup({ type: 'warning', message: t(`reportShared.need.${unchosen}`) });
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
  // The first thing still needed before sending (shown above Send), or null.
  const whatIsMissing = () => {
    if (reportFor === 'others') {
      if (!victimRelationship) return 'rel';
      if (victimRelationship === 'Other' && !victimRelationshipOther.trim()) return 'relOther';
      if (!isVictimNameOptional && !victimName.trim()) return 'name';
      if (!victimDetails.trim()) return 'details';
    }
    if (!formData.assistanceType) return 'assistType';
    if (!formData.emergency) return 'emergency';
    if (formData.emergency === OTHER_EMERGENCY && !formData.emergencyOther.trim()) return 'emergencyOther';
    if (needsNewMedia && !media.file) return 'proof';
    if (isOutsideSantaFe) return 'outside';
    if (isEditing ? !formData.location.trim() : (!gpsCoords && (!formData.houseNumber.trim() || !formData.street.trim()))) {
      return isEditing ? 'location' : 'address';
    }
    if (!formData.situation.trim()) return 'situation';
    const people = Number(formData.people);
    if (!Number.isInteger(people) || people < 1 || people > MAX_PEOPLE_NEEDING_HELP) return 'people';
    if (missingSpecialCount(formData.special, formData.specialCounts)) return 'special';
    if (!formData.consent) return 'consent';
    return null;
  };
  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
    onClose();
  };
  if (!show && !showSuccessPopup) return null;

  const otherLang = translations[language === 'tl' ? 'en' : 'tl'] || {};
  const assistItems = ASSISTANCE_TYPES.map((x) => ({
    value: x.value,
    icon: x.icon,
    label: t(`reportShared.assistShort.${x.key}`),
    sub: otherLang.reportShared?.assistShort?.[x.key] || ''
  }));
  const emergencyItems = [
    ...EMERGENCY_OPTIONS.map((o) => ({ value: o.value, icon: o.icon, label: t(o.labelKey) })),
    { value: OTHER_EMERGENCY, icon: 'bi-three-dots', label: t('reportShared.crimeShort.other') }
  ];
  const missingKey = whatIsMissing();
  const missingText = !missingKey ? '' : missingKey === 'outside' ? t('reportForm.outsideSantaFe') : t(`reportShared.need.${missingKey}`);
  const peopleNumber = Number(formData.people) || 0;
  const setPeople = (n) => setFormData((prev) => ({ ...prev, people: String(Math.min(MAX_PEOPLE_NEEDING_HELP, Math.max(1, n))) }));

  return (
<>
{show && (
<ReportFormShell tone="assist">
  <ReportHead
    icon="bi-life-preserver"
    title={isEditing ? t('assistanceModal.editTitle') : t('assistanceModal.requestTitle')}
    onClose={onClose}
    closeLabel={t('quickReport.close')}
    disabled={isSubmitting}
  />
  <form className="qr-form" onSubmit={handleSubmit}>
    <div className="qr-body">
      <WhoButtons
        id="as-who"
        label={t('reportShared.whoNeedsHelp')}
        value={reportFor}
        onChange={chooseWho}
        labels={{ self: t('quickReport.who.self'), others: t('quickReport.who.others') }}
        disabled={isSubmitting}
      />
      {reportFor === 'others' && (
        <PersonBox
          t={t}
          idPrefix="as"
          title={t('assistanceModal.personBoxLabel')}
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
        <Lbl id="as-type" icon="bi-list-check" req>{t('reportShared.whatHelp')}</Lbl>
        <ChoiceTiles
          labelledBy="as-type"
          items={assistItems}
          value={formData.assistanceType}
          onChange={(v) => setFormData((prev) => ({ ...prev, assistanceType: v }))}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Lbl id="as-emergency" icon="bi-exclamation-circle-fill" req>{t('reportShared.victimOf')}</Lbl>
        <Pills
          labelledBy="as-emergency"
          items={emergencyItems}
          value={formData.emergency}
          onChange={(v) => setFormData((prev) => ({ ...prev, emergency: v, emergencyOther: '' }))}
          disabled={isSubmitting}
        />
        {formData.emergency === OTHER_EMERGENCY && (
          <div className="qr-field" style={{ marginTop: 10 }}>
            <label htmlFor="as-emergency-other">{t('assistanceModal.emergencyOther')} <span className="qr-req">*</span></label>
            <input
              id="as-emergency-other"
              type="text"
              name="emergencyOther"
              value={formData.emergencyOther}
              onChange={handleChange}
              required
              maxLength={100}
              disabled={isSubmitting}
              placeholder={t('assistanceModal.emergencyOtherPlaceholder')}
            />
          </div>
        )}
      </div>

      <MediaPicker
        t={t}
        id="as-media"
        label={t('reportShared.proofTitle')}
        required={needsNewMedia}
        optionalText={t('reportForm.optional')}
        hint={hasExistingMedia ? t('reportForm.mediaHintEdit') : t('assistanceModal.proofHint')}
        media={media}
        fileInputRef={fileInputRef}
        onChange={handleMediaChange}
        onRemove={clearMedia}
        disabled={isSubmitting}
      />

      {isEditing ? (
        <div className="qr-edit-address">
          <Lbl id="as-address" icon="bi-geo-alt-fill" req as="label">{t('assistanceModal.currentAddress')}</Lbl>
          <input
            type="text"
            name="location"
            aria-labelledby="as-address"
            value={formData.location}
            onChange={handleChange}
            placeholder={t('reportForm.fullAddress')}
            required
            disabled={isSubmitting}
          />
          {locationError && <p className="qr-err"><i className="bi bi-exclamation-triangle-fill" aria-hidden="true" /> {locationError}</p>}
          <p className="qr-note">{t('assistanceModal.serviceAreaNote')}</p>
          <div ref={locationSectionRef}>
            <LocationPickerMap pin={gpsCoords} onPick={handlePickOnMap} isOutside={isOutsideSantaFe} outsideMessage={outsideMessage} disabled={isSubmitting} />
          </div>
        </div>
      ) : (
        <div>
          <Lbl id="as-where" icon="bi-geo-alt-fill" req>{t('reportShared.whereHelp')}</Lbl>
          <PairButtons
            id="as-where"
            value={helpPlace}
            onChange={setHelpPlace}
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
              serviceAreaNote={t('assistanceModal.serviceAreaNote')}
            />
          </div>
        </div>
      )}

      <div>
        <Lbl id="as-people-label" icon="bi-people-fill" req as="label">{t('reportShared.people')}</Lbl>
        <div className="qr-count-row">
          <div className="qr-count">
            <button type="button" onClick={() => setPeople(peopleNumber - 1)} disabled={isSubmitting || peopleNumber <= 1} aria-label={t('reportShared.fewer')}>
              <i className="bi bi-dash-lg" aria-hidden="true" />
            </button>
            <input
              id="as-people"
              type="text"
              name="people"
              inputMode="numeric"
              aria-labelledby="as-people-label"
              value={formData.people}
              onChange={(e) => setFormData((prev) => ({ ...prev, people: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
              disabled={isSubmitting}
            />
            <button type="button" onClick={() => setPeople(peopleNumber + 1)} disabled={isSubmitting || peopleNumber >= MAX_PEOPLE_NEEDING_HELP} aria-label={t('reportShared.more')}>
              <i className="bi bi-plus-lg" aria-hidden="true" />
            </button>
          </div>
          <p>{t('assistanceModal.peopleHint')}</p>
        </div>
      </div>

      <div className="form-group" style={{ margin: 0 }}>
        <Lbl icon="bi-info-circle-fill" optional={t('reportForm.optional')}>{t('emergencyModal.specialNeeds')}</Lbl>
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

      <div className="qr-field">
        <Lbl id="as-situation" icon="bi-chat-left-text-fill" req as="label">{t('reportShared.describeSituation')}</Lbl>
        <textarea
          name="situation"
          aria-labelledby="as-situation"
          value={formData.situation}
          onChange={handleChange}
          rows={4}
          maxLength={2000}
          placeholder={t('assistanceModal.situationPlaceholder')}
          required
          disabled={isSubmitting}
        />
      </div>

      <ConsentBox checked={formData.consent} onChange={handleChange} disabled={isSubmitting}>{t('reportForm.consent')}</ConsentBox>

      {!isEditing && cooldownRemaining > 0 && (
        <div className="qr-banner"><i className="bi bi-clock-history" aria-hidden="true" /> {t('assistanceModal.cooldownBanner', { time: formatRemaining(cooldownRemaining) })}</div>
      )}
    </div>
    <SendFoot
      missing={missingText}
      readyText={t('reportShared.ready')}
      label={isEditing ? t('reportShared.saveChanges') : t('reportShared.sendRequest')}
      busyLabel={isEditing ? t('reportForm.saving') : t('reportForm.submitting')}
      busy={isSubmitting}
      disabled={!isEditing && cooldownRemaining > 0}
      icon={isEditing ? 'bi-check-lg' : 'bi-send-fill'}
    />
  </form>
</ReportFormShell>
)}

{showSuccessPopup && (
<ReportFormShell tone="assist">
  <SentScreen
    title={t('assistanceModal.requestSubmitted')}
    actions={<button type="button" className="qr-btn soft" onClick={closeSuccessPopup}>{t('assistanceModal.done')}</button>}
  >
    <p>{t('assistanceModal.requestSubmittedBody')}</p>
  </SentScreen>
</ReportFormShell>
)}
</>
  );
}
export default ResidentAssistanceModal;