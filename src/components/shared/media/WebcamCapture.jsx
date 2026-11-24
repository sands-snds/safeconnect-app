import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// "Take a photo" on a PC or laptop. Phones open their own camera app through
// <input capture>, but desktop browsers ignore "capture" and show a file
// chooser instead. On those, the webcam opens here, inside the page: a live
// preview, Capture, then Retake or Use this photo. The photo is handed back
// as a fresh JPEG File, the same as a phone camera's.

// Desktop: the browser can reach a camera and this is not a phone or tablet
// (iPads say "Macintosh" but have a touch screen).
export function prefersWebcam() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') return false;
  const ua = navigator.userAgent || '';
  const mobile = /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(ua)
    || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  return !mobile && !coarse;
}

const errorKey = (err) => {
  const name = err && err.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'camera.denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError') return 'camera.none';
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return 'camera.busy';
  return 'camera.failed';
};

export default function WebcamCapture({ t, onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('starting'); // starting | live | shot | error
  const [error, setError] = useState('');
  const [shot, setShot] = useState(null); // { file, url }
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState(null);
  const [mirror, setMirror] = useState(true);

  const stop = useCallback(() => {
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async (id) => {
    stop();
    setStatus('starting');
    setError('');
    try {
      const video = id
        ? { deviceId: { exact: id }, width: { ideal: 1920 }, height: { ideal: 1080 } }
        : { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } };
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const settings = (track && track.getSettings && track.getSettings()) || {};
      // A back camera is shown as it is; a webcam facing you, like a mirror.
      setMirror(settings.facingMode !== 'environment');
      if (settings.deviceId) setDeviceId(settings.deviceId);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus('live');
      // Camera names (and so a Switch button) are only known after access is given.
      const all = await navigator.mediaDevices.enumerateDevices().catch(() => []);
      setDevices(all.filter((d) => d.kind === 'videoinput'));
    } catch (err) {
      console.error('Camera could not start:', err);
      setError(errorKey(err));
      setStatus('error');
    }
  }, [stop]);

  useEffect(() => {
    start(null);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { stop(); document.body.style.overflow = previous; };
  }, [start, stop]);

  useEffect(() => () => { if (shot) URL.revokeObjectURL(shot.url); }, [shot]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) { setError('camera.failed'); setStatus('error'); return; }
      const now = Date.now();
      const file = new File([blob], `photo-${now}.jpg`, { type: 'image/jpeg', lastModified: now });
      setShot({ file, url: URL.createObjectURL(blob) });
      setStatus('shot');
      stop();
    }, 'image/jpeg', 0.92);
  };

  const retake = () => { setShot(null); start(deviceId); };
  const use = () => { if (shot) onCapture(shot.file); };
  const cancel = () => { stop(); onClose(); };
  const switchCamera = () => {
    if (devices.length < 2) return;
    const i = devices.findIndex((d) => d.deviceId === deviceId);
    const next = devices[(i + 1) % devices.length];
    setDeviceId(next.deviceId);
    start(next.deviceId);
  };

  return createPortal(
    <div className="wc-overlay">
      <style>{WEBCAM_STYLE}</style>
      <div className="wc" role="dialog" aria-modal="true" aria-labelledby="wc-title">
        <div className="wc-head">
          <span className="wc-ic"><i className="bi bi-camera-fill" aria-hidden="true" /></span>
          <h3 id="wc-title">{t('quickReport.takePhoto')}</h3>
          <button type="button" className="wc-x" onClick={cancel} aria-label={t('quickReport.close')}><i className="bi bi-x-lg" aria-hidden="true" /></button>
        </div>
        <div className="wc-stage">
          <video ref={videoRef} playsInline muted autoPlay className={mirror ? 'mirror' : undefined} hidden={status === 'shot' || status === 'error'} aria-label={t('camera.preview')} />
          {status === 'shot' && shot && <img src={shot.url} alt={t('camera.captured')} />}
          {status === 'starting' && (
            <div className="wc-msg"><span className="spinner-border spinner-border-sm" aria-hidden="true" /> {t('camera.starting')}</div>
          )}
          {status === 'error' && (
            <div className="wc-msg err" role="alert"><i className="bi bi-camera-video-off" aria-hidden="true" /> {t(error || 'camera.failed')}</div>
          )}
        </div>
        <div className="wc-actions">
          {status === 'shot' ? (
            <>
              <button type="button" className="wc-btn ghost" onClick={retake}><i className="bi bi-arrow-repeat" aria-hidden="true" /> {t('quickReport.retake')}</button>
              <button type="button" className="wc-btn primary" onClick={use} autoFocus><i className="bi bi-check-lg" aria-hidden="true" /> {t('camera.use')}</button>
            </>
          ) : status === 'error' ? (
            <>
              <button type="button" className="wc-btn ghost" onClick={cancel}>{t('camera.cancel')}</button>
              <button type="button" className="wc-btn primary" onClick={() => start(deviceId)}><i className="bi bi-arrow-clockwise" aria-hidden="true" /> {t('camera.tryAgain')}</button>
            </>
          ) : (
            <>
              <button type="button" className="wc-btn ghost" onClick={cancel}>{t('camera.cancel')}</button>
              {devices.length > 1 && (
                <button type="button" className="wc-btn ghost" onClick={switchCamera} disabled={status !== 'live'}><i className="bi bi-arrow-left-right" aria-hidden="true" /> {t('camera.switch')}</button>
              )}
              <button type="button" className="wc-btn primary" onClick={capture} disabled={status !== 'live'} autoFocus><i className="bi bi-camera-fill" aria-hidden="true" /> {t('camera.capture')}</button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// The "Take a photo" button's camera: the phone's own camera app (a hidden
// <input capture>), or on a PC the webcam window above.
// onFile(file): a photo was taken. Returns { open, node }; put node in the form.
export function useCamera({ onFile, accept = 'image/*', disabled, t }) {
  const inputRef = useRef(null);
  const [webcamOpen, setWebcamOpen] = useState(false);
  const open = () => {
    if (disabled) return;
    if (prefersWebcam()) setWebcamOpen(true);
    else inputRef.current?.click();
  };
  const onInput = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (file) onFile(file);
  };
  const node = (
    <>
      <input ref={inputRef} type="file" accept={accept} capture="environment" hidden onChange={onInput} disabled={disabled} aria-hidden="true" tabIndex={-1} data-camera-input />
      {webcamOpen && <WebcamCapture t={t} onClose={() => setWebcamOpen(false)} onCapture={(file) => { setWebcamOpen(false); onFile(file); }} />}
    </>
  );
  return { open, node, inputRef };
}

const WEBCAM_STYLE = `
  .wc-overlay { position: fixed; inset: 0; z-index: 10050; background: rgba(17,17,17,.75); display: flex; align-items: center; justify-content: center; padding: 16px; font-family: 'Montserrat', sans-serif; }
  .wc { background: #fff; border-radius: 18px; width: 100%; max-width: 720px; max-height: calc(100vh - 32px); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,.35); }
  .wc-head { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid #eee; }
  .wc-head h3 { flex: 1; margin: 0; font-size: 1.05rem; font-weight: 700; color: #111; }
  .wc-ic { width: 36px; height: 36px; border-radius: 50%; background: #fee2e2; color: #dc2626; display: inline-flex; align-items: center; justify-content: center; }
  .wc-x { width: 38px; height: 38px; border-radius: 50%; border: 0; background: #f3f4f6; color: #111; cursor: pointer; }
  .wc-x:hover { background: #e5e7eb; }
  .wc-stage { position: relative; background: #111; aspect-ratio: 4 / 3; max-height: 60vh; display: flex; align-items: center; justify-content: center; }
  .wc-stage video, .wc-stage img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .wc-stage video[hidden] { display: none; }
  .wc-stage video.mirror { transform: scaleX(-1); }
  .wc-msg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 24px; color: #fff; text-align: center; font-size: .92rem; line-height: 1.5; }
  .wc-msg.err i { font-size: 1.4rem; color: #fca5a5; }
  .wc-actions { display: flex; gap: 10px; padding: 14px 16px; justify-content: flex-end; flex-wrap: wrap; }
  .wc-btn { min-height: 46px; border-radius: 12px; border: 0; padding: 0 18px; font-size: .92rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
  .wc-btn:disabled { opacity: .55; cursor: not-allowed; }
  .wc-btn.primary { background: #dc2626; color: #fff; }
  .wc-btn.primary:hover:not(:disabled) { background: #b91c1c; }
  .wc-btn.ghost { background: #f3f4f6; color: #111; }
  .wc-btn.ghost:hover:not(:disabled) { background: #e5e7eb; }
  @media (max-width: 480px) { .wc-actions .wc-btn { flex: 1; } }
`;
