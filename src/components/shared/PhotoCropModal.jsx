import React, { useCallback, useEffect, useRef, useState } from 'react';

// Profile photo editor: drag to reposition, zoom (slider, buttons, mouse
// wheel, pinch), Recenter, and a live preview of exactly what will be saved.
// onSave receives the cropped square photo as a JPEG File (OUTPUT_SIZE px).

const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.2;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export default function PhotoCropModal({ file, t, saving = false, onCancel, onSave }) {
  const [img, setImg] = useState(null); // HTMLImageElement once loaded
  const [loadError, setLoadError] = useState(false);
  const [frame, setFrame] = useState(280); // crop frame size in CSS px
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const frameRef = useRef(null);
  const previewLargeRef = useRef(null);
  const previewSmallRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);

  // Load the chosen file.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => setImg(image);
    image.onerror = () => setLoadError(true);
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Frame size follows the screen width (phones).
  useEffect(() => {
    const fit = () => setFrame(Math.round(clamp(window.innerWidth - 72, 200, 300)));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // Scale at zoom 1 fills the frame (like object-fit: cover).
  const baseScale = img ? Math.max(frame / img.naturalWidth, frame / img.naturalHeight) : 1;
  const scale = baseScale * zoom;
  const drawnW = img ? img.naturalWidth * scale : 0;
  const drawnH = img ? img.naturalHeight * scale : 0;

  // Keep the photo covering the whole frame (no empty edges).
  const clampOffset = useCallback((o, z = zoom) => {
    if (!img) return o;
    const s = baseScale * z;
    const maxX = Math.max(0, (img.naturalWidth * s - frame) / 2);
    const maxY = Math.max(0, (img.naturalHeight * s - frame) / 2);
    return { x: clamp(o.x, -maxX, maxX), y: clamp(o.y, -maxY, maxY) };
  }, [img, baseScale, frame, zoom]);

  const setZoomClamped = useCallback((z) => {
    const next = clamp(z, MIN_ZOOM, MAX_ZOOM);
    setZoom(next);
    setOffset((o) => clampOffset(o, next));
  }, [clampOffset]);

  useEffect(() => { setOffset((o) => clampOffset(o)); }, [frame, clampOffset]);

  // Draws the visible square (what the frame shows) onto a canvas.
  const drawCrop = useCallback((canvas, size) => {
    if (!img || !canvas) return;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const srcSize = frame / scale;
    const sx = img.naturalWidth / 2 - (frame / 2 + offset.x) / scale;
    const sy = img.naturalHeight / 2 - (frame / 2 + offset.y) / scale;
    ctx.fillStyle = '#ffffff'; // transparent PNGs get a white background
    ctx.fillRect(0, 0, size, size);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, size, size);
  }, [img, frame, scale, offset]);

  // Live preview = the saved image, at profile size and navbar size.
  useEffect(() => {
    drawCrop(previewLargeRef.current, 192);
    drawCrop(previewSmallRef.current, 80);
  }, [drawCrop]);

  // ── Dragging and pinching ──
  const onPointerDown = (e) => {
    frameRef.current?.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current = null;
  };
  const onPointerMove = (e) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const pts = pointers.current;
    if (pts.size >= 2) {
      // Pinch: zoom by the change in distance between two fingers.
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [a, b] = [...pts.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (gesture.current?.dist) setZoomClamped(gesture.current.zoom * (dist / gesture.current.dist));
      else gesture.current = { dist, zoom };
      return;
    }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setOffset((o) => clampOffset({ x: o.x + (e.clientX - prev.x), y: o.y + (e.clientY - prev.y) }));
  };
  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) gesture.current = null;
  };

  // Mouse wheel zoom (needs a non-passive listener to stop page scrolling).
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      setZoomClamped(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoom, setZoomClamped]);

  const onKeyDown = (e) => {
    const step = e.shiftKey ? 30 : 10;
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      setOffset((o) => clampOffset({ x: o.x + dx, y: o.y + dy }));
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault(); setZoomClamped(zoom + ZOOM_STEP);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault(); setZoomClamped(zoom - ZOOM_STEP);
    }
  };

  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape' && !saving) onCancel(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onCancel, saving]);

  const recenter = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };

  const handleSave = () => {
    const canvas = document.createElement('canvas');
    drawCrop(canvas, OUTPUT_SIZE);
    canvas.toBlob((blob) => {
      if (blob) onSave(new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="pc-overlay">
      <style>{`
        .pc-overlay {
          position: fixed; inset: 0; z-index: 10040;
          background: rgba(17, 17, 17, 0.6); backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center; padding: 16px; overflow-y: auto;
        }
        .pc-card {
          width: 100%; max-width: 620px; margin: auto; background: #fff; border-radius: 20px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.25); overflow: hidden;
        }
        .pc-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid #f0eaec; }
        .pc-head h2 { margin: 0; font-size: 1.15rem; font-weight: 800; color: #1f2937; }
        .pc-head p { margin: 2px 0 0; font-size: 0.82rem; color: #6b7280; }
        .pc-x { width: 34px; height: 34px; border-radius: 50%; border: none; background: #f3f4f6; color: #4b5563; display: flex; align-items: center; justify-content: center; }
        .pc-body { display: grid; grid-template-columns: auto 1fr; gap: 24px; padding: 22px; align-items: start; }
        .pc-frame {
          position: relative; overflow: hidden; border-radius: 16px; background: #111;
          touch-action: none; cursor: grab; user-select: none; outline: none;
        }
        .pc-frame:active { cursor: grabbing; }
        .pc-frame:focus-visible { box-shadow: 0 0 0 3px #6B2C3E; }
        .pc-frame img { position: absolute; max-width: none; pointer-events: none; }
        .pc-mask { position: absolute; inset: 0; pointer-events: none; border-radius: 50%; box-shadow: 0 0 0 999px rgba(0,0,0,0.45); border: 2px solid rgba(255,255,255,0.85); }
        .pc-help { margin: 10px 0 0; font-size: 0.78rem; color: #6b7280; text-align: center; }
        .pc-zoom { display: flex; align-items: center; gap: 10px; margin-top: 14px; }
        .pc-zoom input[type=range] { flex: 1; accent-color: #6B2C3E; }
        .pc-icon-btn { width: 34px; height: 34px; border-radius: 10px; border: 1.5px solid #e5e7eb; background: #fff; color: #374151; display: flex; align-items: center; justify-content: center; }
        .pc-icon-btn:hover:not(:disabled) { background: #f9fafb; }
        .pc-side h3 { margin: 0 0 10px; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #6B2C3E; }
        .pc-previews { display: flex; align-items: flex-end; gap: 16px; }
        .pc-previews canvas { border-radius: 50%; box-shadow: 0 2px 10px rgba(0,0,0,0.12); background: #f3f4f6; }
        .pc-preview-label { display: block; margin-top: 6px; font-size: 0.75rem; color: #6b7280; text-align: center; }
        .pc-recenter { margin-top: 18px; display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid #e5e7eb; background: #fff; color: #374151; font-weight: 600; font-size: 0.85rem; padding: 8px 14px; border-radius: 10px; }
        .pc-recenter:hover { background: #f9fafb; }
        .pc-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 22px; border-top: 1px solid #f0eaec; }
        .pc-btn { border: none; border-radius: 12px; padding: 11px 20px; font-weight: 700; font-size: 0.92rem; }
        .pc-btn.primary { background: linear-gradient(135deg, #6B2C3E, #8B3A52); color: #fff; }
        .pc-btn.secondary { background: #fff; color: #374151; border: 1.5px solid #e5e7eb; }
        .pc-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 620px) {
          .pc-overlay { padding: 0; align-items: stretch; }
          .pc-card { border-radius: 0; min-height: 100%; display: flex; flex-direction: column; }
          .pc-body { grid-template-columns: 1fr; justify-items: center; flex: 1; }
          .pc-side { width: 100%; display: flex; flex-direction: column; align-items: center; }
          .pc-foot .pc-btn { flex: 1; }
        }
      `}</style>

      <div className="pc-card" role="dialog" aria-modal="true" aria-labelledby="pc-title">
        <div className="pc-head">
          <div>
            <h2 id="pc-title">{t('settings.cropTitle')}</h2>
            <p>{t('settings.cropSubtitle')}</p>
          </div>
          <button type="button" className="pc-x" onClick={onCancel} disabled={saving} aria-label={t('settings.cancel')}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="pc-body">
          <div>
            <div
              ref={frameRef}
              className="pc-frame"
              style={{ width: frame, height: frame }}
              tabIndex={0}
              role="application"
              aria-label={t('settings.cropFrameLabel')}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onKeyDown={onKeyDown}
            >
              {img && (
                <img
                  src={img.src}
                  alt=""
                  draggable={false}
                  style={{
                    width: drawnW,
                    height: drawnH,
                    left: frame / 2 - drawnW / 2 + offset.x,
                    top: frame / 2 - drawnH / 2 + offset.y
                  }}
                />
              )}
              {!img && !loadError && (
                <div className="d-flex h-100 align-items-center justify-content-center">
                  <div className="spinner-border text-light" aria-hidden="true"></div>
                </div>
              )}
              <div className="pc-mask"></div>
            </div>
            {loadError
              ? <p className="pc-help" style={{ color: '#991b1b' }}>{t('settings.cropLoadError')}</p>
              : <p className="pc-help">{t('settings.cropHelp')}</p>}

            <div className="pc-zoom">
              <button type="button" className="pc-icon-btn" onClick={() => setZoomClamped(zoom - ZOOM_STEP)} disabled={!img || zoom <= MIN_ZOOM} aria-label={t('settings.zoomOut')}>
                <i className="bi bi-zoom-out"></i>
              </button>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoomClamped(Number(e.target.value))}
                disabled={!img}
                aria-label={t('settings.zoom')}
              />
              <button type="button" className="pc-icon-btn" onClick={() => setZoomClamped(zoom + ZOOM_STEP)} disabled={!img || zoom >= MAX_ZOOM} aria-label={t('settings.zoomIn')}>
                <i className="bi bi-zoom-in"></i>
              </button>
            </div>
          </div>

          <div className="pc-side">
            <h3>{t('settings.preview')}</h3>
            <div className="pc-previews">
              <div>
                <canvas ref={previewLargeRef} style={{ width: 112, height: 112 }} aria-label={t('settings.previewProfile')} role="img" />
                <span className="pc-preview-label">{t('settings.previewProfile')}</span>
              </div>
              <div>
                <canvas ref={previewSmallRef} style={{ width: 40, height: 40 }} aria-label={t('settings.previewNavbar')} role="img" />
                <span className="pc-preview-label">{t('settings.previewNavbar')}</span>
              </div>
            </div>
            <button type="button" className="pc-recenter" onClick={recenter} disabled={!img}>
              <i className="bi bi-bullseye"></i> {t('settings.recenter')}
            </button>
          </div>
        </div>

        <div className="pc-foot">
          <button type="button" className="pc-btn secondary" onClick={onCancel} disabled={saving}>{t('settings.cancel')}</button>
          <button type="button" className="pc-btn primary" onClick={handleSave} disabled={!img || saving}>
            {saving ? t('settings.uploading') : t('settings.savePhoto')}
          </button>
        </div>
      </div>
    </div>
  );
}
