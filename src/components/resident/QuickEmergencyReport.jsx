import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createEmergencyReport } from '../../Services/api';
import { showPopup } from '../shared/popup';
import { resultError, showIfMediaTooLarge } from './reportErrors';
import LocationPickerMap from '../shared/location/LocationPickerMap';
import useLocationPin from '../shared/location/useLocationPin';
import { useLanguage } from '../../i18n/LanguageContext';
import { translations } from '../../i18n/translations';
import { announceReportsChanged } from './useCallAccess';
import { registeredAddress } from './useRegisteredAddress';
import { EMPTY_LOCATION, composeLocation, coordsForSubmit } from './ReportLocationFields';
import SpecialNeedsPicker, { formatSpecialNeeds, missingSpecialCount } from './SpecialNeedsPicker';
import { ReportFormShell, SendFoot } from './reportFormUi';

// Report an Emergency, the quick way (design Option A): who needs help, what
// is happening (one tap), a photo, Send. The location fills itself in: the
// phone's GPS, or the resident's registered home address when reporting for
// themselves; "Change" opens the map. Everything else is optional.
// Editing a report from My Reports still uses ResidentEmergencyModal.

export const QUICK_TYPES = [
  { key: 'fire',    value: 'Fire Emergency',  color: '#dc2626', icon: 'bi-fire' },
  { key: 'flood',   value: 'Flood Emergency', color: '#2563eb', icon: 'bi-water' },
  { key: 'quake',   value: 'Earthquake',      color: '#b45309', icon: 'bi-activity' },
  { key: 'typhoon', value: 'Typhoon',         color: '#0f766e', icon: 'bi-tropical-storm' }
];
const SEVERITY = { 'Fire Emergency': 'Critical', 'Flood Emergency': 'Critical', Earthquake: 'High', Typhoon: 'Critical' };
// The saved values match the full form's relationship list.
const RELATIONSHIPS = [
  { value: 'Family Member', key: 'family' },
  { value: 'Neighbor', key: 'neighbor' },
  { value: 'Friend', key: 'friend' },
  { value: 'Stranger', key: 'stranger' },
  { value: 'Other', key: 'other' }
];
const MEDIA_ACCEPT = 'image/jpeg,image/jpg,video/mp4,video/quicktime,video/webm';
const ALLOWED_MEDIA_TYPES = MEDIA_ACCEPT.split(',');
const ALLOWED_MEDIA_EXTENSIONS = /\.(jpe?g|mp4|mov|webm)$/i;
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_PEOPLE = 500;

const currentUser = () => {
  try {
    const raw = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const user = raw && raw.user ? raw.user : raw;
    return { ...user, id: user.id ?? user.user_id ?? user.userId ?? null };
  } catch {
    return {};
  }
};
const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const EMPTY = {
  step: 1, who: 'self', type: null,
  media: null, mediaUrl: null, mediaType: null,
  rel: '', victimName: '', victimContact: '',
  people: '', special: [], specialCounts: {}, details: '',
  address: { ...EMPTY_LOCATION }, showMap: false
};

export default function QuickEmergencyReport({ show, onClose, onRequestAssistance }) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null); // { reference, type, forWhom, submittedLocation }
  const [specialInvalid, setSpecialInvalid] = useState(null);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const dialogRef = useRef(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const fillFromPin = useCallback(({ houseNumber, street, area }) => {
    setForm((f) => ({ ...f, address: { ...f.address, houseNumber: houseNumber || '', street: street || '', area: area || '' } }));
  }, []);
  const pin = useLocationPin({ onAddress: fillFromPin });
  const { gpsCoords, isLocating, locationError, isOutsideSantaFe, outsideMessage, handlePickOnMap } = pin;
  const home = registeredAddress();
  const pinned = Boolean(gpsCoords) && !isOutsideSantaFe;

  // Opening: start fresh, ask for the phone's location once. (Only when
  // "show" changes; the pin helpers are read through a ref.)
  const pinRef = useRef(pin);
  pinRef.current = pin;
  useEffect(() => {
    if (!show) return undefined;
    setForm(EMPTY);
    setSent(null);
    setSpecialInvalid(null);
    pinRef.current.setGpsCoords(null);
    pinRef.current.setLocationError('');
    pinRef.current.handleUseCurrentLocation();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => dialogRef.current?.querySelector('[data-autofocus]')?.focus());
    return () => { document.body.style.overflow = previous; };
  }, [show]);

  useEffect(() => () => { if (form.mediaUrl) URL.revokeObjectURL(form.mediaUrl); }, [form.mediaUrl]);

  // Only the X closes the form: a tap outside it (or Escape) does nothing, so
  // a half-filled report is never lost by accident.
  const close = useCallback(() => { if (!sending) onClose(); }, [sending, onClose]);

  if (!show) return null;

  const type = QUICK_TYPES.find((x) => x.key === form.type);
  const typeName = (x) => t(`quickReport.types.${x.key}`);
  // The type's name in the other language, small under the tile
  const otherName = (x) => translations[language === 'tl' ? 'en' : 'tl']?.quickReport?.types?.[x.key] || '';

  const pickMedia = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!(ALLOWED_MEDIA_TYPES.includes(file.type) || ALLOWED_MEDIA_EXTENSIONS.test(file.name))) {
      showPopup({ type: 'warning', message: t('reportForm.mediaTypeError') });
      return;
    }
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);
    if (file.size > (isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE)) {
      showPopup({ type: 'warning', message: isVideo ? t('reportForm.mediaTooLargeVideo') : t('reportForm.mediaTooLargeImage') });
      return;
    }
    set({ media: file, mediaUrl: URL.createObjectURL(file), mediaType: isVideo ? 'video' : 'image' });
  };

  // Where the report is: the GPS / map pin when there is one inside Santa
  // Fe; otherwise, for yourself, your registered home.
  // A pin outside Santa Fe must be moved first (no quiet fallback to home).
  const usingHome = form.who === 'self' && !pinned && !isOutsideSantaFe && Boolean(home);
  const hasLocation = pinned || usingHome;
  const missing = [
    isOutsideSantaFe && 'outside',
    !form.media && 'photo',
    form.who === 'others' && !form.rel && 'rel',
    !hasLocation && 'location'
  ].filter(Boolean);
  const missingText = missing.length === 0 ? '' : missing[0] === 'outside' ? t('reportForm.outsideSantaFe') : t(`quickReport.need.${missing[0]}`);

  const send = async () => {
    if (missing.length || sending) return;
    const people = form.people === '' ? null : Number(form.people);
    if (people !== null && (!Number.isInteger(people) || people < 1 || people > MAX_PEOPLE)) {
      showPopup({ type: 'warning', message: t('emergencyModal.peopleRequired', { max: MAX_PEOPLE }) });
      document.getElementById('qr-people')?.focus();
      return;
    }
    const missingCount = missingSpecialCount(form.special, form.specialCounts);
    if (missingCount) {
      setSpecialInvalid(missingCount.key);
      showPopup({ type: 'warning', message: t('reportForm.specialNeedsCountRequired', { category: t(`emergencyModal.specialNeedsOptions.${missingCount.key}`) }) });
      return;
    }
    setSending(true);
    try {
      const user = currentUser();
      const address = usingHome ? { ...EMPTY_LOCATION, ...home } : form.address;
      const location = composeLocation(address, pinned ? gpsCoords : null);
      const coords = pinned ? gpsCoords : await coordsForSubmit(address, null, false);
      const photoUrl = await readAsDataUrl(form.media);
      const relationship = form.who === 'others' ? form.rel : null;
      const result = await createEmergencyReport({
        emergencyType: type.value,
        severity: SEVERITY[type.value] || 'Critical',
        userId: user.id,
        name: user.fullName || user.full_name || 'Resident',
        contact: user.contact || user.contact_number || 'Not provided',
        location,
        latitude: coords ? coords.lat : null,
        longitude: coords ? coords.lng : null,
        details: form.details.trim(),
        people: people ?? undefined,
        special: formatSpecialNeeds(form.special, form.specialCounts),
        photoUrl,
        mediaType: form.mediaType,
        reportFor: form.who,
        victimName: form.who === 'others' ? form.victimName.trim() || null : null,
        victimContact: form.who === 'others' ? form.victimContact.trim() || null : null,
        victimRelationship: relationship,
        victimDetails: null
      });
      if (!result.success) throw resultError(result, t('reportForm.submitFailed'));
      announceReportsChanged();
      setSent({
        reference: result.reportReference,
        type,
        forWhom: form.who === 'others' ? (form.victimName.trim() || t(`reportForm.relationshipOptions.${RELATIONSHIPS.find((r) => r.value === form.rel)?.key || 'other'}`)) : null,
        submittedLocation: {
          location,
          latitude: coords ? coords.lat : null,
          longitude: coords ? coords.lng : null,
          reportFor: form.who,
          address
        }
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      if (!showIfMediaTooLarge(error, t)) {
        showPopup({ type: 'error', title: t('popup.submitFailedTitle'), message: t('emergencyModal.submitError') });
      }
    } finally {
      setSending(false);
    }
  };

  const locationChip = () => {
    if (isLocating && !pinned) {
      return <div className="qr-loc"><span className="spinner-border spinner-border-sm" aria-hidden="true" /><div><b>{t('quickReport.locLocating')}</b></div></div>;
    }
    const title = form.who === 'others' ? t('quickReport.locWhere') : pinned ? t('quickReport.locUsing') : t('quickReport.locHome');
    const where = pinned
      ? (composeLocation(form.address, gpsCoords).split(', Barangay')[0] || t('quickReport.locPinned'))
      : usingHome ? [home.houseNumber, home.street].filter(Boolean).join(', ') : t('quickReport.locNeedPin');
    return (
      <div className={`qr-loc${hasLocation ? '' : ' warn'}`}>
        <i className="bi bi-geo-alt-fill" aria-hidden="true" />
        <div><b>{title}</b><span>{where}</span></div>
        <button type="button" onClick={() => set({ showMap: !form.showMap })}>{form.showMap ? t('quickReport.locDone') : t('quickReport.locChange')}</button>
      </div>
    );
  };

  return (
    <ReportFormShell tone="emergency" dialogRef={dialogRef}>
        {sent ? (
          <div className="qr-sent">
            <span className="qr-sent-ic"><i className="bi bi-check-lg" aria-hidden="true" /></span>
            <h3 id="qr-title">{t('quickReport.sentTitle')}</h3>
            <p>{sent.forWhom
              ? t('quickReport.sentBodyOthers', { type: typeName(sent.type).toLowerCase(), who: sent.forWhom })
              : t('quickReport.sentBody', { type: typeName(sent.type).toLowerCase() })}</p>
            {sent.reference && <p className="qr-ref">{t('quickReport.reference')} <b>{sent.reference}</b></p>}
            <div className="qr-callnote"><i className="bi bi-telephone-fill" aria-hidden="true" />
              <span>{sent.type.key === 'fire' ? t('quickReport.callReady') : t('quickReport.callWait')}</span></div>
            <div className="qr-sent-actions">
              {onRequestAssistance && (
                <button type="button" className="qr-btn ghost" onClick={() => { onClose(); onRequestAssistance(sent.submittedLocation); }}>
                  <i className="bi bi-life-preserver" aria-hidden="true" /> {t('quickReport.needHelp')}
                </button>
              )}
              <button type="button" className="qr-btn soft" onClick={onClose} data-autofocus>{t('quickReport.done')}</button>
            </div>
          </div>
        ) : (
          <>
            <div className="qr-head">
              {form.step === 2
                ? <button type="button" className="qr-x" onClick={() => set({ step: 1 })} aria-label={t('quickReport.back')} disabled={sending}><i className="bi bi-arrow-left" aria-hidden="true" /></button>
                : <span className="qr-head-ic"><i className="bi bi-exclamation-triangle-fill" aria-hidden="true" /></span>}
              <h3 id="qr-title">
                {form.step === 2 ? <span style={{ color: type.color }}>{typeName(type)}</span> : t('quickReport.title')}
                {form.step === 2 && form.who === 'others' && <span className="qr-forchip"><i className="bi bi-people-fill" aria-hidden="true" /> {t('quickReport.forChip')}</span>}
              </h3>
              <span className="qr-step">{t('quickReport.step', { n: form.step })}</span>
              <button type="button" className="qr-x" onClick={close} aria-label={t('quickReport.close')} disabled={sending}><i className="bi bi-x-lg" aria-hidden="true" /></button>
            </div>

            {form.step === 1 ? (
              <div className="qr-body">
                <div>
                  <p className="qr-lbl" id="qr-who">{t('quickReport.whoTitle')}</p>
                  <div className="qr-who" role="group" aria-labelledby="qr-who">
                    {['self', 'others'].map((w) => (
                      <button key={w} type="button" aria-pressed={form.who === w} onClick={() => set({ who: w })} data-autofocus={w === 'self' ? true : undefined}>
                        <span className="qr-wi"><i className={`bi ${w === 'self' ? 'bi-person-fill' : 'bi-people-fill'}`} aria-hidden="true" /></span>
                        <span>{t(`quickReport.who.${w}`)}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="qr-lead" id="qr-what">{t('quickReport.lead')}</p>
                  <p className="qr-hint">{t('quickReport.leadHint')}</p>
                </div>
                <div className="qr-tiles" role="group" aria-labelledby="qr-what">
                  {QUICK_TYPES.map((x) => (
                    <button key={x.key} type="button" className="qr-tile" style={{ '--c': x.color }} onClick={() => set({ type: x.key, step: 2 })}>
                      <span className="qr-ti"><i className={`bi ${x.icon}`} aria-hidden="true" /></span>
                      <b>{typeName(x)}</b>
                      <small>{otherName(x)}</small>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="qr-body">
                {form.who === 'others' && (
                  <div className="qr-forbox">
                    <p className="qr-lbl red"><i className="bi bi-person-exclamation" aria-hidden="true" /> {t('quickReport.forTitle')}</p>
                    <div>
                      <p className="qr-q" id="qr-rel">{t('quickReport.relLabel')} <span className="qr-req">*</span></p>
                      <div className="qr-rel" role="group" aria-labelledby="qr-rel">
                        {RELATIONSHIPS.map((r) => (
                          <button key={r.value} type="button" aria-pressed={form.rel === r.value} onClick={() => set({ rel: r.value })}>
                            {t(`reportForm.relationshipOptions.${r.key}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="qr-two">
                      <div className="qr-field">
                        <label htmlFor="qr-vname">{t('quickReport.theirName')} <small>{t('reportForm.optional')}</small></label>
                        <input id="qr-vname" type="text" maxLength={100} value={form.victimName} onChange={(e) => set({ victimName: e.target.value })} placeholder={t('quickReport.namePlaceholder')} />
                      </div>
                      <div className="qr-field">
                        <label htmlFor="qr-vcontact">{t('quickReport.theirNumber')} <small>{t('reportForm.optional')}</small></label>
                        <input id="qr-vcontact" type="tel" inputMode="numeric" maxLength={11} value={form.victimContact} onChange={(e) => set({ victimContact: e.target.value.replace(/\D/g, '').slice(0, 11) })} placeholder="09XXXXXXXXX" />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <p className="qr-lead">{t('quickReport.photoTitle')}</p>
                  <p className="qr-hint">{t('quickReport.photoHint')}</p>
                </div>
                <input ref={cameraRef} type="file" accept={MEDIA_ACCEPT} capture="environment" hidden onChange={pickMedia} aria-hidden="true" tabIndex={-1} />
                <input ref={galleryRef} type="file" accept={MEDIA_ACCEPT} hidden onChange={pickMedia} aria-hidden="true" tabIndex={-1} />
                {form.media ? (
                  <div className="qr-preview">
                    <span className="qr-ok"><i className="bi bi-check-lg" aria-hidden="true" /> {form.mediaType === 'video' ? t('quickReport.videoAdded') : t('quickReport.photoAdded')}</span>
                    {form.mediaType === 'video'
                      ? <video src={form.mediaUrl} controls playsInline />
                      : <img src={form.mediaUrl} alt={t('quickReport.photoAlt')} />}
                    <button type="button" className="qr-redo" onClick={() => cameraRef.current?.click()} disabled={sending}><i className="bi bi-arrow-repeat" aria-hidden="true" /> {t('quickReport.retake')}</button>
                  </div>
                ) : (
                  <div className="qr-photo-row">
                    <button type="button" className="qr-btn primary" onClick={() => cameraRef.current?.click()} data-autofocus><i className="bi bi-camera-fill" aria-hidden="true" /> {t('quickReport.takePhoto')}</button>
                    <button type="button" className="qr-btn ghost" onClick={() => galleryRef.current?.click()}><i className="bi bi-images" aria-hidden="true" /> {t('quickReport.gallery')}</button>
                  </div>
                )}

                {locationChip()}
                {(form.showMap || isOutsideSantaFe || (!hasLocation && !isLocating)) && (
                  <div className="qr-map">
                    {(locationError || isOutsideSantaFe) && <p className="qr-maperr">{isOutsideSantaFe ? t('reportForm.outsideSantaFe') : locationError}</p>}
                    <LocationPickerMap pin={gpsCoords} onPick={handlePickOnMap} isOutside={isOutsideSantaFe} outsideMessage={outsideMessage} disabled={sending} height={220} />
                  </div>
                )}

                <details className="qr-more">
                  <summary>{t('quickReport.moreTitle')}</summary>
                  <div className="qr-more-body form-group">
                    <div className="qr-field">
                      <label htmlFor="qr-people">{t('quickReport.people')}</label>
                      <input id="qr-people" type="text" inputMode="numeric" value={form.people} onChange={(e) => set({ people: e.target.value.replace(/\D/g, '').slice(0, 3) })} placeholder="0" style={{ maxWidth: 160 }} />
                    </div>
                    <div>
                      <p className="qr-q">{t('emergencyModal.specialNeeds')}</p>
                      <SpecialNeedsPicker
                        idPrefix="qr-special"
                        selected={form.special}
                        counts={form.specialCounts}
                        onToggle={(v) => setForm((f) => ({ ...f, special: f.special.includes(v) ? f.special.filter((x) => x !== v) : [...f.special, v] }))}
                        onCountChange={(v, n) => { setSpecialInvalid(null); setForm((f) => ({ ...f, specialCounts: { ...f.specialCounts, [v]: n } })); }}
                        disabled={sending}
                        invalidKey={specialInvalid}
                      />
                    </div>
                    <div className="qr-field">
                      <label htmlFor="qr-details">{t('quickReport.describe')}</label>
                      <textarea id="qr-details" rows={3} maxLength={2000} value={form.details} onChange={(e) => set({ details: e.target.value })} placeholder={t('emergencyModal.incidentDetailsPlaceholder')} />
                    </div>
                  </div>
                </details>
              </div>
            )}

            {form.step === 2 && (
              <SendFoot type="button" onClick={send} missing={missingText} readyText={t('reportShared.ready')}
                label={t('quickReport.send')} busyLabel={t('quickReport.sending')} busy={sending} />
            )}
          </>
        )}
    </ReportFormShell>
  );
}

