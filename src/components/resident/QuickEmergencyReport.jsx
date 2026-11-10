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
    <div className="qr-overlay">
      <style>{STYLE}</style>
      <div className="qr" role="dialog" aria-modal="true" aria-labelledby="qr-title" ref={dialogRef}>
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
              <div className="qr-foot">
                <button type="button" className="qr-btn send" onClick={send} disabled={missing.length > 0 || sending}>
                  {sending ? <><span className="spinner-border spinner-border-sm" aria-hidden="true" /> {t('quickReport.sending')}</> : <><i className="bi bi-send-fill" aria-hidden="true" /> {t('quickReport.send')}</>}
                </button>
                {missingText && <p className="qr-needs" role="status">{missingText}</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const STYLE = `
  .qr-overlay { position: fixed; inset: 0; z-index: 10000; background: rgba(17, 17, 17, .6); display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'Montserrat', sans-serif; }
  .qr { background: #fff; width: 100%; max-width: 600px; max-height: calc(100dvh - 40px); border-radius: 18px; box-shadow: 0 20px 60px rgba(0,0,0,.35); display: flex; flex-direction: column; overflow: hidden; color: #111827; }
  .qr-head { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #f0eaec; }
  .qr-head-ic { width: 40px; height: 40px; border-radius: 50%; background: #dc2626; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 19px; flex-shrink: 0; }
  .qr-head h3 { margin: 0; font-size: 1.15rem; font-weight: 800; flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .qr-step { font-size: .75rem; font-weight: 700; color: #6b7280; white-space: nowrap; }
  .qr-x { width: 38px; height: 38px; border: 0; background: transparent; color: #6b7280; border-radius: 8px; font-size: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
  .qr-x:hover { background: #f3f4f6; color: #111; }
  .qr-forchip { display: inline-flex; align-items: center; gap: 6px; font-size: .75rem; font-weight: 700; color: #991b1b; background: #fee2e2; border-radius: 999px; padding: 3px 10px; }
  .qr-body { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
  .qr-lbl { margin: 0 0 8px; font-size: .78rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #6B2C3E; display: flex; align-items: center; gap: 6px; }
  .qr-lbl.red { color: #b91c1c; margin: 0; }
  .qr-lead { margin: 0; font-size: 1.05rem; font-weight: 800; color: #111; }
  .qr-hint { margin: 2px 0 0; font-size: .85rem; color: #6b7280; }
  .qr-q { margin: 0 0 6px; font-size: .85rem; font-weight: 700; color: #374151; }
  .qr-req { color: #dc2626; }
  .qr-who { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .qr-who button { min-height: 60px; border: 2px solid #e5e7eb; border-radius: 14px; background: #fff; display: flex; align-items: center; gap: 12px; padding: 10px 14px; font-size: 1rem; font-weight: 800; color: #111; cursor: pointer; text-align: left; font-family: inherit; }
  .qr-wi { width: 38px; height: 38px; border-radius: 50%; background: #f3eef0; color: #6B2C3E; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .qr-who button[aria-pressed="true"] { border-color: #6B2C3E; background: #fdf7f9; box-shadow: 0 0 0 3px rgba(107, 44, 62, .12); }
  .qr-who button[aria-pressed="true"] .qr-wi { background: #6B2C3E; color: #fff; }
  .qr-tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
  .qr-tile { min-height: 132px; border: 2px solid #f0eaec; border-radius: 18px; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; cursor: pointer; color: #111; padding: 14px 8px; font-family: inherit; transition: transform .08s, border-color .15s, background .15s; }
  .qr-ti { width: 58px; height: 58px; border-radius: 50%; background: var(--c); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 27px; }
  .qr-tile b { font-size: 1.02rem; font-weight: 800; }
  .qr-tile small { font-size: .78rem; color: #6b7280; font-weight: 600; margin-top: -6px; }
  .qr-tile:hover { border-color: var(--c); background: color-mix(in srgb, var(--c) 6%, #fff); }
  .qr-tile:active { transform: scale(.98); }
  .qr-forbox { border: 1.5px solid #fecaca; background: #fff7f7; border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
  .qr-rel { display: flex; flex-wrap: wrap; gap: 8px; }
  .qr-rel button { min-height: 44px; padding: 0 16px; border-radius: 999px; border: 2px solid #e5e7eb; background: #fff; font-size: .9rem; font-weight: 700; color: #111; cursor: pointer; font-family: inherit; }
  .qr-rel button[aria-pressed="true"] { border-color: #dc2626; background: #fee2e2; color: #991b1b; }
  .qr-two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .qr-field label { display: block; font-size: .8rem; font-weight: 700; color: #374151; margin-bottom: 4px; }
  .qr-field label small { font-weight: 500; color: #9ca3af; }
  .qr .qr-field input[type="text"], .qr .qr-field input[type="tel"], .qr .qr-field textarea { width: 100%; height: 44px; border: 1px solid #d1d5db; border-radius: 10px; padding: 0 12px; font-family: inherit; font-size: .95rem; background: #fff; color: #111827; }
  .qr .qr-field textarea { height: auto; min-height: 80px; padding: 10px 12px; resize: vertical; }
  .qr .qr-field input[type="text"]:focus, .qr .qr-field input[type="tel"]:focus, .qr .qr-field textarea:focus { outline: none; border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220,38,38,.12); }
  .qr-photo-row { display: flex; gap: 10px; }
  .qr-photo-row .qr-btn { flex: 1; }
  .qr-preview { position: relative; border-radius: 16px; overflow: hidden; background: #111; }
  .qr-preview img, .qr-preview video { display: block; width: 100%; height: 200px; object-fit: cover; }
  .qr-ok { position: absolute; left: 10px; top: 10px; z-index: 1; background: #16a34a; color: #fff; border-radius: 999px; padding: 4px 10px; font-size: .75rem; font-weight: 700; display: inline-flex; gap: 5px; align-items: center; }
  .qr-redo { position: absolute; right: 10px; bottom: 10px; background: rgba(17,24,39,.85); color: #fff; border: 0; border-radius: 999px; padding: 8px 14px; font-size: .8rem; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-family: inherit; }
  .qr-loc { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; background: #f0f9ff; border: 1px solid #bae6fd; color: #0c4a6e; font-size: .85rem; }
  .qr-loc.warn { background: #fffbeb; border-color: #fde68a; color: #92400e; }
  .qr-loc > .bi { font-size: 18px; color: #0284c7; flex-shrink: 0; }
  .qr-loc.warn > .bi { color: #d97706; }
  .qr-loc div { min-width: 0; }
  .qr-loc b { display: block; font-size: .88rem; }
  .qr-loc span { display: block; overflow-wrap: anywhere; }
  .qr-loc button { margin-left: auto; border: 0; background: none; color: #0369a1; font-weight: 700; font-size: .85rem; cursor: pointer; white-space: nowrap; padding: 6px 4px; font-family: inherit; }
  .qr-map { margin-top: -6px; }
  .qr-maperr { margin: 0 0 6px; font-size: .8rem; color: #b91c1c; font-weight: 600; }
  .qr-more { border: 1.5px solid #f0eaec; border-radius: 12px; padding: 0 12px; }
  .qr-more summary { cursor: pointer; padding: 12px 0; font-weight: 700; font-size: .9rem; color: #374151; }
  .qr-more-body { display: flex; flex-direction: column; gap: 14px; padding-bottom: 12px; margin: 0; }
  .qr-foot { padding: 14px 20px; border-top: 1px solid #f0eaec; display: flex; flex-direction: column; gap: 6px; }
  .qr-needs { margin: 0; font-size: .8rem; color: #6b7280; text-align: center; }
  .qr-btn { min-height: 52px; border-radius: 12px; border: 0; padding: 0 18px; font-size: 1rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-family: inherit; }
  .qr-btn.primary, .qr-btn.send { background: #dc2626; color: #fff; box-shadow: 0 6px 16px rgba(220,38,38,.3); }
  .qr-btn.send { width: 100%; font-size: 1.08rem; }
  .qr-btn.send:disabled { background: #e5e7eb; color: #9ca3af; box-shadow: none; cursor: not-allowed; }
  .qr-btn.ghost { background: #fff; color: #374151; border: 1.5px solid #e5e7eb; }
  .qr-btn.soft { background: #FDECEC; color: #6B2C3E; border: 1.5px solid #6B2C3E; }
  .qr-sent { padding: 34px 24px 26px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; overflow-y: auto; }
  .qr-sent-ic { width: 76px; height: 76px; border-radius: 50%; background: #dcfce7; color: #16a34a; font-size: 40px; display: flex; align-items: center; justify-content: center; }
  .qr-sent h3 { margin: 0; font-size: 1.35rem; font-weight: 900; }
  .qr-sent p { margin: 0; color: #4b5563; font-size: .95rem; max-width: 42ch; line-height: 1.55; }
  .qr-ref b { color: #6B2C3E; letter-spacing: .04em; }
  .qr-callnote { display: flex; gap: 10px; align-items: center; text-align: left; padding: 10px 12px; border-radius: 12px; background: #fef2f2; color: #991b1b; font-size: .85rem; font-weight: 600; max-width: 460px; }
  .qr-callnote .bi { font-size: 20px; flex-shrink: 0; }
  .qr-sent-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 4px; }
  .qr :is(button, input, textarea, summary):focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { .qr-tile { transition: none; } }
  /* Tablet and phone: still a card with the page showing around it, sized
     to its content like Request Assistance, not a full-screen sheet. */
  @media (max-width: 767px) {
    .qr-overlay { padding: 12px; }
    .qr { max-height: calc(100dvh - 24px); border-radius: 14px; }
    .qr-head { padding: 12px 14px; gap: 10px; }
    .qr-head-ic { width: 34px; height: 34px; font-size: 16px; }
    .qr-head h3 { font-size: 1.02rem; }
    .qr-body { padding: 14px; gap: 12px; }
    .qr-foot { padding: 10px 14px calc(12px + env(safe-area-inset-bottom, 0px)); }
    .qr-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .qr-tile { min-height: 92px; gap: 6px; padding: 10px 6px; border-radius: 14px; }
    .qr-ti { width: 44px; height: 44px; font-size: 21px; }
    .qr-tile b { font-size: .95rem; }
    .qr-who button { min-height: 50px; padding: 6px 10px; gap: 8px; font-size: .92rem; border-radius: 12px; }
    .qr-wi { width: 30px; height: 30px; font-size: 15px; }
    .qr-btn { min-height: 48px; }
    .qr-preview img, .qr-preview video { height: 160px; }
    .qr-sent { padding: 24px 16px 20px; }
    .qr-sent-ic { width: 60px; height: 60px; font-size: 32px; }
    .qr-two { grid-template-columns: 1fr; }
    .qr .qr-field input[type="text"], .qr .qr-field input[type="tel"] { font-size: 16px; }
  }
`;
