import React, { useRef } from 'react';
import { DayOldNote } from '../shared/media/MediaAttachmentField';
import ZoomableMedia from '../shared/media/ZoomableMedia';
import { TextWarning } from './textWarnings';

// The look shared by the three resident report forms (Report Emergency,
// Request Assistance, Report Petty Crime): one card, a round colour icon in
// the header, big tap buttons, one full-width send button. Each form has its
// own colour (the colour of its card on the resident page) through --tone.
// Only the X closes a form; a tap outside it does nothing.

export const TONES = { emergency: 'emergency', assist: 'assist', crime: 'crime' };

export function ReportFormShell({ tone = 'emergency', titleId = 'qr-title', dialogRef, children }) {
  return (
    <div className="qr-overlay">
      <style>{REPORT_FORM_STYLE}</style>
      <div className={`qr qr-${tone}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef}>
        {children}
      </div>
    </div>
  );
}

export function ReportHead({ icon, title, titleId = 'qr-title', onClose, closeLabel, disabled, before, after }) {
  return (
    <div className="qr-head">
      {before || <span className="qr-head-ic"><i className={`bi ${icon}`} aria-hidden="true" /></span>}
      <h3 id={titleId}>{title}</h3>
      {after}
      <button type="button" className="qr-x" onClick={onClose} aria-label={closeLabel} disabled={disabled}>
        <i className="bi bi-x-lg" aria-hidden="true" />
      </button>
    </div>
  );
}

// The header of a step-by-step form, as on Report Emergency: step 1 shows the
// form's icon and title; later steps a back arrow, the chosen type in the
// form's colour and, when it is for someone else, a "for someone" chip.
// total: how many steps (2 or 3).
export function StepHead({ t, step, total = 2, icon, title, typeTitle, forOthers, onBack, onClose, disabled }) {
  return (
    <ReportHead
      icon={icon}
      title={step > 1 ? (
        <>
          <span className="qr-type-title">{typeTitle}</span>
          {forOthers && <span className="qr-forchip"><i className="bi bi-people-fill" aria-hidden="true" /> {t('quickReport.forChip')}</span>}
        </>
      ) : title}
      before={step > 1 ? (
        <button type="button" className="qr-x" onClick={onBack} aria-label={t('quickReport.back')} disabled={disabled}>
          <i className="bi bi-arrow-left" aria-hidden="true" />
        </button>
      ) : null}
      after={<span className="qr-step">{total === 3 ? t('reportShared.stepOf3', { n: step }) : t('quickReport.step', { n: step })}</span>}
      onClose={onClose}
      closeLabel={t('quickReport.close')}
      disabled={disabled}
    />
  );
}

// Step 1's big type buttons (Report Emergency's tiles, in the form's colour).
// Tapping one chooses it and goes on to step 2.
export function TypeTiles({ labelledBy, items, value, onPick, disabled, cols = 4 }) {
  return (
    <div className={`qr-tiles qr-tiles-${cols}`} role="group" aria-labelledby={labelledBy}>
      {items.map((x) => (
        <button key={x.value} type="button" className="qr-tile" style={{ '--c': 'var(--tone)' }} aria-pressed={value === x.value} onClick={() => onPick(x.value)} disabled={disabled}>
          <span className="qr-ti"><i className={`bi ${x.icon}`} aria-hidden="true" /></span>
          <b>{x.label}</b>
        </button>
      ))}
    </div>
  );
}

// A titled part of step 2 (Report Emergency's bold lead line and grey hint).
export function Section({ id, title, hint, req, optional, children }) {
  return (
    <div className="qr-sec" role="group" aria-labelledby={id}>
      <p className="qr-lead" id={id}>
        {title}
        {req && <span className="qr-req" aria-hidden="true"> *</span>}
        {optional && <small className="qr-opt"> {optional}</small>}
      </p>
      {hint && <p className="qr-hint">{hint}</p>}
      <div className="qr-sec-body">{children}</div>
    </div>
  );
}

// A section heading: small icon, label, * or (optional).
export function Lbl({ id, icon, children, req, optional, as: Tag = 'p' }) {
  return (
    <Tag className="qr-lbl" id={id}>
      {icon && <i className={`bi ${icon}`} aria-hidden="true" />}
      <span>{children}</span>
      {req && <span className="qr-req" aria-hidden="true">*</span>}
      {optional && <small>{optional}</small>}
    </Tag>
  );
}

export function WhoButtons({ id, label, value, onChange, labels, disabled, autoFocus }) {
  return (
    <div>
      <Lbl id={id}>{label}</Lbl>
      <div className="qr-who" role="group" aria-labelledby={id}>
        {['self', 'others'].map((w) => (
          <button key={w} type="button" aria-pressed={value === w} onClick={() => onChange(w)} disabled={disabled} data-autofocus={autoFocus && w === 'self' ? true : undefined}>
            <span className="qr-wi"><i className={`bi ${w === 'self' ? 'bi-person-fill' : 'bi-people-fill'}`} aria-hidden="true" /></span>
            <span>{labels[w]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Two big buttons, e.g. At my home / Somewhere else.
export function PairButtons({ id, options, value, onChange, disabled }) {
  return (
    <div className="qr-who" role="group" aria-labelledby={id}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)} disabled={disabled || o.disabled} title={o.title}>
          <span className="qr-wi"><i className={`bi ${o.icon}`} aria-hidden="true" /></span>
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

// Tiles that stay selected (Assistance type, Crime type).
export function ChoiceTiles({ labelledBy, items, value, onChange, disabled, wide }) {
  return (
    <div className={`qr-choices${wide ? ' wide' : ''}`} role="group" aria-labelledby={labelledBy}>
      {items.map((x) => (
        <button key={x.value} type="button" className="qr-choice" aria-pressed={value === x.value} onClick={() => onChange(x.value)} disabled={disabled}>
          <span className="qr-tick" aria-hidden="true"><i className="bi bi-check-lg" /></span>
          <span className="qr-ci"><i className={`bi ${x.icon}`} aria-hidden="true" /></span>
          <span className="qr-ct"><b>{x.label}</b>{x.sub && <small>{x.sub}</small>}</span>
        </button>
      ))}
    </div>
  );
}

export function Pills({ labelledBy, items, value, onChange, disabled, grid }) {
  return (
    <div className={`qr-rel${grid ? ' qr-grid3' : ''}`} role="group" aria-labelledby={labelledBy}>
      {items.map((x) => (
        <button key={x.value} type="button" aria-pressed={value === x.value} onClick={() => onChange(x.value)} disabled={disabled}
          className={x.color ? 'qr-tinted' : undefined} style={x.color ? { '--c': x.color } : undefined}>
          {x.icon && <i className={`bi ${x.icon}`} aria-hidden="true" />}{x.label}
        </button>
      ))}
    </div>
  );
}

const FULL_RELATIONSHIPS = [
  { value: 'Family Member', key: 'family' },
  { value: 'Friend', key: 'friend' },
  { value: 'Neighbor', key: 'neighbor' },
  { value: 'Colleague', key: 'colleague' },
  { value: 'Stranger', key: 'stranger' },
  { value: 'Other', key: 'other' }
];

// The person you are reporting / requesting for: every field of the old box.
// warnings: { relOther, name, details } text-check reasons (textWarnings.jsx).
export function PersonBox({ t, idPrefix, title, rel, onRel, relOther, onRelOther, name, onName, nameOptional, contact, onContact, details, onDetails, disabled, warnings = {} }) {
  return (
    <div className="qr-forbox">
      <p className="qr-lbl red"><i className="bi bi-person-exclamation" aria-hidden="true" /> <span>{title}</span></p>
      <div>
        <p className="qr-q" id={`${idPrefix}-rel`}>{t('quickReport.relLabel')} <span className="qr-req">*</span></p>
        <Pills grid labelledBy={`${idPrefix}-rel`} value={rel} onChange={onRel} disabled={disabled}
          items={FULL_RELATIONSHIPS.map((r) => ({ value: r.value, label: r.key === 'other' ? t('reportShared.crimeShort.other') : t(`reportForm.relationshipOptions.${r.key}`) }))} />
      </div>
      {rel === 'Other' && (
        <div className="qr-field">
          <label htmlFor={`${idPrefix}-relother`}>{t('reportForm.relationshipOtherPlaceholder')} <span className="qr-req">*</span></label>
          <input id={`${idPrefix}-relother`} type="text" maxLength={100} value={relOther} onChange={(e) => onRelOther(e.target.value)} disabled={disabled} aria-invalid={Boolean(warnings.relOther) || undefined} />
          <TextWarning t={t} reason={warnings.relOther} />
        </div>
      )}
      <div className="qr-two">
        <div className="qr-field">
          <label htmlFor={`${idPrefix}-vname`}>{t('reportForm.theirName')} {nameOptional ? <small>{t('reportForm.optional')}</small> : <span className="qr-req">*</span>}</label>
          <input id={`${idPrefix}-vname`} type="text" maxLength={100} value={name} onChange={(e) => onName(e.target.value)} placeholder={t('reportForm.namePlaceholder')} disabled={disabled} aria-invalid={Boolean(warnings.name) || undefined} />
          <TextWarning t={t} reason={warnings.name} />
        </div>
        <div className="qr-field">
          <label htmlFor={`${idPrefix}-vcontact`}>{t('reportForm.theirContact')} <small>{t('reportForm.optional')}</small></label>
          <input id={`${idPrefix}-vcontact`} type="tel" inputMode="numeric" maxLength={11} value={contact} onChange={(e) => onContact(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="09XXXXXXXXX" disabled={disabled} />
        </div>
      </div>
      <div className="qr-field">
        <label htmlFor={`${idPrefix}-vdetails`}>{t('reportForm.additionalDetails')} <span className="qr-req">*</span></label>
        <textarea id={`${idPrefix}-vdetails`} rows={2} maxLength={1000} value={details} onChange={(e) => onDetails(e.target.value)} placeholder={t('reportForm.additionalDetailsPlaceholder')} disabled={disabled} aria-invalid={Boolean(warnings.details) || undefined} />
        <TextWarning t={t} reason={warnings.details} />
      </div>
    </div>
  );
}

const MEDIA_ACCEPT = 'image/jpeg,image/jpg,video/mp4,video/quicktime,video/webm';
// The camera button asks for any image: with specific types or video in the
// list, many Android phones open the file chooser / gallery instead.
export const CAMERA_ACCEPT = 'image/*';

// Take a photo / Gallery, then a preview with Change and Remove. Uses the
// checks in useMediaAttachment (file type and size) through onChange.
// hideLabel: inside a Section whose title (with the same id) labels it.
export function MediaPicker({ t, id, label, required, optionalText, hint, media, fileInputRef, onChange, onRemove, disabled, hideLabel }) {
  const cameraRef = useRef(null);
  // Cancelling the camera or file picker keeps the file already attached.
  const pick = (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    onChange(e, { fromCamera: e.target === cameraRef.current });
    if (e.target !== fileInputRef.current) e.target.value = '';
  };
  return (
    <div>
      {!hideLabel && <Lbl id={id} icon="bi-camera-fill" req={required} optional={required ? null : optionalText}>{label}</Lbl>}
      <input ref={fileInputRef} type="file" accept={MEDIA_ACCEPT} hidden onChange={pick} disabled={disabled} aria-labelledby={id} />
      <input ref={cameraRef} type="file" accept={CAMERA_ACCEPT} capture="environment" hidden onChange={pick} disabled={disabled} aria-hidden="true" tabIndex={-1} />
      {media.previewUrl ? (
        <div className="qr-preview">
          <span className="qr-ok"><i className="bi bi-check-lg" aria-hidden="true" /> {media.type === 'video' ? t('quickReport.videoAdded') : t('quickReport.photoAdded')}</span>
          <ZoomableMedia src={media.previewUrl} isVideo={media.type === 'video'} labels={{ open: t('myReports.viewFullSize'), close: t('myReports.closeMedia'), alt: t('myReports.attachedEvidence') }} />
          <DayOldNote t={t} takenAt={media.takenAt} dayOld={media.dayOld} />
          <div className="qr-preview-actions">
            <button type="button" className="qr-redo" onClick={() => fileInputRef.current?.click()} disabled={disabled}><i className="bi bi-arrow-repeat" aria-hidden="true" /> {t('reportShared.change')}</button>
            <button type="button" className="qr-redo" onClick={onRemove} disabled={disabled}><i className="bi bi-trash3" aria-hidden="true" /> {t('reportShared.remove')}</button>
          </div>
        </div>
      ) : (
        <div className="qr-photo-row">
          <button type="button" className="qr-btn primary" onClick={() => cameraRef.current?.click()} disabled={disabled}><i className="bi bi-camera-fill" aria-hidden="true" /> {t('quickReport.takePhoto')}</button>
          <button type="button" className="qr-btn ghost" onClick={() => fileInputRef.current?.click()} disabled={disabled}><i className="bi bi-images" aria-hidden="true" /> {t('quickReport.gallery')}</button>
        </div>
      )}
      {hint && <p className="qr-help">{hint}</p>}
    </div>
  );
}

export function ConsentBox({ checked, onChange, children, disabled }) {
  return (
    <label className={`qr-consent${checked ? ' on' : ''}`}>
      <input type="checkbox" name="consent" checked={checked} onChange={onChange} required disabled={disabled} />
      <span>{children} <span className="qr-req">*</span></span>
    </label>
  );
}

// The send line and button. `missing` names the first thing still needed.
export function SendFoot({ missing, readyText, label, busyLabel, busy, disabled, type = 'submit', onClick, icon = 'bi-send-fill' }) {
  return (
    <div className="qr-foot">
      <p className="qr-needs" role="status">{missing || readyText}</p>
      <button type={type} className="qr-btn send" onClick={onClick} disabled={disabled || busy || Boolean(missing)}>
        {busy
          ? <><span className="spinner-border spinner-border-sm" aria-hidden="true" /> {busyLabel}</>
          : <><i className={`bi ${icon}`} aria-hidden="true" /> {label}</>}
      </button>
    </div>
  );
}

export function SentScreen({ title, titleId = 'qr-title', children, actions }) {
  return (
    <div className="qr-sent">
      <span className="qr-sent-ic"><i className="bi bi-check-lg" aria-hidden="true" /></span>
      <h3 id={titleId}>{title}</h3>
      {children}
      <div className="qr-sent-actions">{actions}</div>
    </div>
  );
}

// Type follows the older SafeConnect forms: Montserrat, 600 for labels and
// buttons, 700 only for titles, dark grey text rather than black.
export const REPORT_FORM_STYLE = `
  .qr-overlay { position: fixed; inset: 0; z-index: 10000; background: rgba(17, 17, 17, .6); display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'Montserrat', sans-serif; }
  .qr { --tone: #dc2626; --tone-dark: #b91c1c; --tone-soft: #fef2f2; --tone-line: #fecaca; --tone-ink: #991b1b;
        background: #fff; width: 100%; max-width: 600px; max-height: calc(100dvh - 40px); border-radius: 18px; box-shadow: 0 20px 60px rgba(0,0,0,.3); display: flex; flex-direction: column; overflow: hidden; color: #374151; font-family: 'Montserrat', sans-serif; font-size: 14px; line-height: 1.45; }
  .qr.qr-assist { --tone: #ea580c; --tone-dark: #c2410c; --tone-soft: #fff7ed; --tone-line: #fed7aa; --tone-ink: #9a3412; }
  .qr.qr-crime { --tone: #7c3aed; --tone-dark: #6d28d9; --tone-soft: #f5f3ff; --tone-line: #ddd6fe; --tone-ink: #5b21b6; }
  .qr form.qr-form { display: flex; flex-direction: column; min-height: 0; flex: 1; margin: 0; }
  .qr button, .qr input, .qr textarea { font-family: inherit; }
  .qr-head { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #f0eaec; flex-shrink: 0; }
  .qr-head-ic { width: 40px; height: 40px; border-radius: 50%; background: var(--tone); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .qr-head h3 { margin: 0; font-size: 1.15rem; font-weight: 700; color: #1f2937; flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; line-height: 1.3; }
  .qr-step { font-size: .75rem; font-weight: 500; color: #6b7280; white-space: nowrap; }
  .qr-x { width: 38px; height: 38px; border: 0; background: transparent; color: #6b7280; border-radius: 8px; font-size: 17px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
  .qr-x:hover:not(:disabled) { background: #f3f4f6; color: #111827; }
  .qr-forchip { display: inline-flex; align-items: center; gap: 6px; font-size: .74rem; font-weight: 600; color: #991b1b; background: #fee2e2; border-radius: 999px; padding: 3px 10px; }
  .qr-body { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 18px; flex: 1; min-height: 0; }
  .qr-lbl { margin: 0 0 8px; font-size: .84rem; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 7px; flex-wrap: wrap; line-height: 1.35; }
  .qr-lbl > .bi { color: #6b7280; font-size: .9rem; }
  .qr-lbl small { font-weight: 400; color: #6b7280; font-size: .8rem; }
  .qr-lbl.red { color: #b91c1c; margin: 0; }
  .qr-lbl.red > .bi { color: #b91c1c; }
  .qr-lead { margin: 0; font-size: 1rem; font-weight: 600; color: #1f2937; }
  .qr-hint { margin: 2px 0 0; font-size: .82rem; color: #6b7280; }
  .qr-help { margin: 6px 0 0; font-size: .76rem; color: #6b7280; line-height: 1.45; }
  .qr-q { margin: 0 0 6px; font-size: .82rem; font-weight: 600; color: #374151; }
  .qr-req { color: #dc2626; font-weight: 600; }
  .qr-who { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .qr-who button { min-height: 54px; border: 1.5px solid #e5e7eb; border-radius: 12px; background: #fff; display: flex; align-items: center; gap: 10px; padding: 8px 12px; font-size: .9rem; font-weight: 600; color: #374151; cursor: pointer; text-align: left; transition: border-color .15s, background .15s; }
  .qr-who button:hover:not(:disabled) { border-color: #d1d5db; }
  .qr-wi { width: 34px; height: 34px; border-radius: 50%; background: #f3eef0; color: #6B2C3E; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
  .qr-who button[aria-pressed="true"] { border-color: #6B2C3E; background: #fdf7f9; color: #6B2C3E; box-shadow: 0 0 0 3px rgba(107, 44, 62, .1); }
  .qr-who button[aria-pressed="true"] .qr-wi { background: #6B2C3E; color: #fff; }

  /* Report Emergency: the four type tiles */
  .qr-tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
  .qr-tile { min-height: 124px; border: 1.5px solid #f0eaec; border-radius: 16px; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; cursor: pointer; color: #1f2937; padding: 14px 8px; transition: transform .08s, border-color .15s, background .15s; }
  .qr-ti { width: 54px; height: 54px; border-radius: 50%; background: var(--c); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 25px; }
  .qr-tile b { font-size: .95rem; font-weight: 600; }
  .qr-tile small { font-size: .74rem; color: #6b7280; font-weight: 500; margin-top: -6px; }
  .qr-tile:hover { border-color: var(--c); background: color-mix(in srgb, var(--c) 5%, #fff); }
  .qr-tile:active { transform: scale(.98); }

  /* Assistance and Petty Crime: tiles that stay selected */
  .qr-choices { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .qr-choices.wide { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .qr-choice { position: relative; min-height: 100px; border: 1.5px solid #f0eaec; border-radius: 14px; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; cursor: pointer; color: #1f2937; padding: 12px 6px; text-align: center; transition: border-color .15s, background .15s; }
  .qr-ci { width: 42px; height: 42px; border-radius: 50%; background: var(--tone-soft); color: var(--tone); display: flex; align-items: center; justify-content: center; font-size: 19px; flex-shrink: 0; transition: background .15s, color .15s; }
  .qr-ct { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .qr-ct b { font-size: .84rem; font-weight: 600; line-height: 1.25; }
  .qr-ct small { font-size: .7rem; color: #6b7280; font-weight: 500; line-height: 1.25; }
  .qr-choice:hover:not(:disabled) { border-color: var(--tone-line); }
  .qr-choice[aria-pressed="true"] { border-color: var(--tone); background: var(--tone-soft); box-shadow: 0 0 0 3px color-mix(in srgb, var(--tone) 12%, transparent); }
  .qr-choice[aria-pressed="true"] .qr-ci { background: var(--tone); color: #fff; }
  .qr-tick { position: absolute; top: 7px; right: 7px; width: 18px; height: 18px; border-radius: 50%; background: var(--tone); color: #fff; font-size: 10px; display: none; align-items: center; justify-content: center; }
  .qr-choice[aria-pressed="true"] .qr-tick { display: flex; }

  /* Pills: relationship, emergency */
  .qr-rel { display: flex; flex-wrap: wrap; gap: 8px; }
  .qr-rel button { min-height: 40px; padding: 0 14px; border-radius: 999px; border: 1.5px solid #e5e7eb; background: #fff; font-size: .84rem; font-weight: 500; color: #374151; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; transition: border-color .15s, background .15s; }
  .qr-rel button .bi { color: #6b7280; }
  .qr-rel button:hover:not(:disabled) { border-color: #d1d5db; }
  .qr-rel button[aria-pressed="true"] { border-color: var(--tone); background: var(--tone-soft); color: var(--tone-ink); font-weight: 600; }
  .qr-rel button[aria-pressed="true"] .bi { color: var(--tone); }
  /* Choices in a grid: three per row, all the same size */
  .qr-rel.qr-grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .qr-rel.qr-grid3 button { width: 100%; min-height: 44px; padding: 6px 8px; border-radius: 12px; justify-content: center; text-align: center; line-height: 1.25; }
  /* Choices with their own colour (the emergency types) */
  .qr-rel button.qr-tinted .bi { color: var(--c); }
  .qr-rel button.qr-tinted:hover:not(:disabled) { border-color: color-mix(in srgb, var(--c) 45%, #fff); }
  .qr-rel button.qr-tinted[aria-pressed="true"] { border-color: var(--c); background: color-mix(in srgb, var(--c) 9%, #fff); color: var(--c); }
  .qr-rel button.qr-tinted[aria-pressed="true"] .bi { color: var(--c); }

  .qr-forbox { border: 1px solid #fecaca; background: #fff7f7; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
  .qr-two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .qr-field label { display: block; font-size: .8rem; font-weight: 600; color: #374151; margin-bottom: 5px; }
  .qr-field label small { font-weight: 400; color: #6b7280; }
  .qr .qr-field label.qr-lbl { display: flex; font-size: .84rem; margin: 0 0 8px; }
  .qr .qr-field input[type="text"], .qr .qr-field input[type="tel"], .qr .qr-field textarea { width: 100%; height: 44px; border: 1px solid #d1d5db; border-radius: 10px; padding: 0 12px; font-size: .9rem; font-weight: 400; background: #fff; color: #1f2937; }
  .qr .qr-field textarea { height: auto; min-height: 88px; padding: 10px 12px; resize: vertical; line-height: 1.45; }
  .qr .qr-field input:focus, .qr .qr-field textarea:focus, .qr .rl-section .rl-input:focus { outline: none; border-color: var(--tone); box-shadow: 0 0 0 3px color-mix(in srgb, var(--tone) 12%, transparent); }
  .qr .qr-field input:disabled, .qr .qr-field textarea:disabled { background: #f3f4f6; }

  /* People needing help: − number + */
  .qr-count-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .qr-count-row p { margin: 0; flex: 1; min-width: 180px; font-size: .78rem; color: #6b7280; }
  .qr-count { display: inline-flex; align-items: stretch; border: 1px solid #d1d5db; border-radius: 12px; overflow: hidden; background: #fff; }
  .qr-count button { width: 46px; border: 0; background: #f9fafb; color: #374151; font-size: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .qr-count button:hover:not(:disabled) { background: #f3f4f6; }
  .qr-count button:disabled { color: #d1d5db; cursor: not-allowed; }
  .qr .qr-count input[type="text"] { width: 64px; height: 44px; border: 0; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; text-align: center; font-size: 1rem; font-weight: 600; color: #1f2937; padding: 0; background: #fff; }
  .qr .qr-count input[type="text"]:focus { outline: none; box-shadow: inset 0 0 0 2px var(--tone); }

  /* The address boxes (ReportLocationFields) inside these forms */
  .qr .rl-section .rl-label { font-size: .84rem; font-weight: 600; color: #374151; }
  .qr .rl-section .rl-input { height: 44px; border-radius: 10px; padding: 0 12px; font-size: .9rem; color: #1f2937; }
  .qr .rl-section .rl-locate { border-color: var(--tone); color: var(--tone); font-weight: 600; padding: 7px 12px; }
  .qr .rl-section .rl-locate:hover:not(:disabled) { background: var(--tone); color: #fff; }
  .qr .rl-section .rl-note { font-size: .76rem; }
  .qr .qr-edit-address input { width: 100%; height: 44px; border: 1px solid #d1d5db; border-radius: 10px; padding: 0 12px; font-size: .9rem; color: #1f2937; }
  .qr .qr-edit-address input:focus { outline: none; border-color: var(--tone); box-shadow: 0 0 0 3px color-mix(in srgb, var(--tone) 12%, transparent); }
  .qr-note { margin: 6px 0 0; font-size: .76rem; color: #6b7280; }
  .qr-err { margin: 6px 0 0; font-size: .78rem; color: #b91c1c; font-weight: 500; }

  .qr-photo-row { display: flex; gap: 10px; }
  .qr-photo-row .qr-btn { flex: 1; }
  .qr-preview { position: relative; border-radius: 14px; overflow: hidden; background: #111; }
  /* The whole photo, not a cropped strip (ZoomableMedia; tap to open it full size). */
  .qr-ok { position: absolute; left: 10px; top: 10px; z-index: 1; background: #16a34a; color: #fff; border-radius: 999px; padding: 4px 10px; font-size: .74rem; font-weight: 600; display: inline-flex; gap: 5px; align-items: center; }
  .qr-redo { position: absolute; right: 10px; bottom: 10px; background: rgba(17,24,39,.85); color: #fff; border: 0; border-radius: 999px; padding: 7px 13px; font-size: .78rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
  .qr-preview-actions { position: absolute; right: 10px; bottom: 10px; display: flex; gap: 8px; }
  .qr-preview-actions .qr-redo { position: static; }
  .qr-loc { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; background: #f0f9ff; border: 1px solid #bae6fd; color: #0c4a6e; font-size: .84rem; }
  .qr-loc.warn { background: #fffbeb; border-color: #fde68a; color: #92400e; }
  .qr-loc > .bi { font-size: 17px; color: #0284c7; flex-shrink: 0; }
  .qr-loc.warn > .bi { color: #d97706; }
  .qr-loc div { min-width: 0; }
  .qr-loc b { display: block; font-size: .86rem; font-weight: 600; }
  .qr-loc span { display: block; overflow-wrap: anywhere; }
  .qr-loc button { margin-left: auto; border: 0; background: none; color: #0369a1; font-weight: 600; font-size: .84rem; cursor: pointer; white-space: nowrap; padding: 6px 4px; }
  .qr-map { margin-top: -6px; }
  .qr-maperr { margin: 0 0 6px; font-size: .8rem; color: #b91c1c; font-weight: 500; }
  .qr-more { border: 1px solid #f0eaec; border-radius: 12px; padding: 0 12px; }
  .qr-more summary { cursor: pointer; padding: 12px 0; font-weight: 600; font-size: .88rem; color: #374151; }
  .qr-more-body { display: flex; flex-direction: column; gap: 14px; padding-bottom: 12px; margin: 0; }
  .qr-consent { display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; border-radius: 12px; border: 1px solid #e5e7eb; background: #fafafa; cursor: pointer; font-size: .82rem; color: #374151; line-height: 1.5; margin: 0; }
  .qr-consent input { width: 18px; height: 18px; margin: 2px 0 0; accent-color: var(--tone); flex-shrink: 0; cursor: pointer; }
  .qr-consent.on { border-color: var(--tone-line); background: var(--tone-soft); }
  .qr-banner { display: flex; gap: 8px; align-items: center; padding: 10px 12px; border-radius: 10px; background: #fffbeb; border: 1px solid #fde68a; color: #92400e; font-size: .82rem; }
  .qr-info { display: flex; gap: 8px; align-items: center; padding: 10px 12px; border-radius: 10px; background: #f3f4f6; color: #374151; font-size: .82rem; }

  .qr-foot { padding: 12px 20px 14px; border-top: 1px solid #f0eaec; display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
  .qr-needs { margin: 0; font-size: .78rem; color: #6b7280; text-align: center; }
  .qr-btn { min-height: 48px; border-radius: 12px; border: 0; padding: 0 18px; font-size: .92rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: background .15s; }
  .qr-btn.primary { background: #dc2626; color: #fff; box-shadow: 0 6px 16px rgba(220,38,38,.25); }
  .qr-btn.primary:hover:not(:disabled) { background: #b91c1c; }
  .qr-btn.send { width: 100%; min-height: 50px; font-size: .98rem; background: var(--tone); color: #fff; box-shadow: 0 6px 16px color-mix(in srgb, var(--tone) 25%, transparent); }
  .qr-btn.send:hover:not(:disabled) { background: var(--tone-dark); }
  .qr-btn.send:disabled { background: #e5e7eb; color: #9ca3af; box-shadow: none; cursor: not-allowed; }
  .qr-btn.ghost { background: #fff; color: #374151; border: 1px solid #d1d5db; }
  .qr-btn.ghost:hover:not(:disabled) { background: #f9fafb; }
  .qr-btn.soft { background: #FDECEC; color: #6B2C3E; border: 1px solid #6B2C3E; }
  .qr-sent { padding: 32px 24px 26px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; overflow-y: auto; }
  .qr-sent-ic { width: 68px; height: 68px; border-radius: 50%; background: #dcfce7; color: #16a34a; font-size: 34px; display: flex; align-items: center; justify-content: center; }
  .qr-sent h3 { margin: 0; font-size: 1.2rem; font-weight: 700; color: #1f2937; }
  .qr-sent p { margin: 0; color: #4b5563; font-size: .9rem; max-width: 42ch; line-height: 1.55; }
  .qr-ref b { color: #6B2C3E; font-weight: 600; letter-spacing: .04em; }
  .qr-callnote { display: flex; gap: 10px; align-items: center; text-align: left; padding: 10px 12px; border-radius: 12px; background: #fef2f2; color: #991b1b; font-size: .84rem; font-weight: 500; max-width: 460px; }
  .qr-callnote .bi { font-size: 18px; flex-shrink: 0; }
  .qr-sent-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 4px; }
  .qr-sent-actions .qr-btn { min-width: 140px; }
  .qr :is(button, input, textarea, summary):focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { .qr-tile, .qr-choice, .qr-who button, .qr-rel button { transition: none; } }

  /* Request Assistance and Report Petty Crime: Report Emergency's two steps. */
  .qr-tiles.qr-tiles-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .qr-tile[aria-pressed="true"] { border-color: var(--c); background: color-mix(in srgb, var(--c) 6%, #fff); }
  .qr-tile:disabled { cursor: not-allowed; opacity: .6; }
  .qr-type-title { color: var(--tone); }
  .qr-lead .qr-opt { font-weight: 400; color: #6b7280; font-size: .8rem; }
  .qr-sec-body { display: flex; flex-direction: column; gap: 14px; margin-top: 10px; }
  .qr-addr { margin-top: 12px; }
  .qr-sub { margin-top: 10px; }

  /* Tablet and phone: still a card with the page around it, sized to its content. */
  @media (max-width: 767px) {
    .qr-overlay { padding: 12px; }
    .qr { max-height: calc(100dvh - 24px); border-radius: 14px; }
    .qr-head { padding: 12px 14px; gap: 10px; }
    .qr-head-ic { width: 34px; height: 34px; font-size: 15px; }
    .qr-head h3 { font-size: 1.02rem; }
    .qr-body { padding: 14px; gap: 15px; }
    .qr-foot { padding: 10px 14px calc(12px + env(safe-area-inset-bottom, 0px)); }
    .qr-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .qr-tile { min-height: 92px; gap: 6px; padding: 10px 6px; border-radius: 14px; }
    .qr-ti { width: 44px; height: 44px; font-size: 20px; }
    .qr-tile b { font-size: .9rem; }
    .qr-who button { min-height: 48px; padding: 6px 10px; gap: 8px; font-size: .86rem; }
    .qr-wi { width: 30px; height: 30px; font-size: 14px; }
    .qr-btn { min-height: 46px; }
    .qr-btn.send { min-height: 48px; }
    .qr-sent { padding: 24px 16px 20px; }
    .qr-sent-ic { width: 58px; height: 58px; font-size: 30px; }
    .qr-choices { gap: 8px; }
    .qr-choice { min-height: 90px; padding: 10px 4px; gap: 6px; }
    .qr-ci { width: 38px; height: 38px; font-size: 17px; }
    .qr-ct b { font-size: .78rem; }
    .qr-ct small { font-size: .66rem; }
    .qr-choices.wide { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .qr-choices.wide .qr-choice { flex-direction: row; justify-content: flex-start; min-height: 56px; padding: 8px 10px; gap: 10px; text-align: left; }
    .qr-choices.wide .qr-ci { width: 34px; height: 34px; font-size: 16px; }
    .qr-choices.wide .qr-ct b { font-size: .82rem; }
    .qr-choices.wide .qr-ct small { display: none; }
    .qr-choices.wide .qr-choice:last-child:nth-child(odd) { grid-column: 1 / -1; }
    .qr-choices.wide .qr-tick { top: 50%; transform: translateY(-50%); right: 10px; }
    .qr-two { grid-template-columns: 1fr; }
    .qr-rel button { min-height: 38px; padding: 0 12px; font-size: .82rem; }
    .qr-rel.qr-grid3 { gap: 6px; }
    .qr-rel.qr-grid3 button { min-height: 44px; padding: 4px 6px; font-size: .8rem; }
    .qr .qr-field input[type="text"], .qr .qr-field input[type="tel"], .qr .qr-field textarea, .qr .rl-section .rl-input, .qr .qr-edit-address input, .qr .qr-count input[type="text"] { font-size: 16px; }
    .qr-tiles.qr-tiles-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .qr-tiles.qr-tiles-3 .qr-tile b { font-size: .8rem; text-align: center; line-height: 1.25; }
    .qr-tiles.qr-tiles-4 .qr-tile:last-child:nth-child(odd) { grid-column: 1 / -1; }
    .qr-tiles:is(.qr-tiles-3, .qr-tiles-4) .qr-tile b { text-align: center; line-height: 1.25; }
  }
`;
