import React, { useEffect, useRef, useState } from 'react';
import { showPopup } from '../popup';

// Photo/video attachment for the resident report forms (petty crime,
// assistance), with the same file rules as Report Emergency
// (ResidentEmergencyModal.jsx). Reports store the file as a base64 data URL.
const ALLOWED_MEDIA_TYPES = [
  'image/jpeg', 'image/jpg',
  'video/mp4', 'video/quicktime', 'video/webm'
];
const ALLOWED_MEDIA_EXTENSIONS = /\.(jpe?g|mp4|mov|webm)$/i;
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPT = 'image/jpeg,image/jpg,video/mp4,video/quicktime,video/webm';
const EMPTY_MEDIA = { file: null, previewUrl: null, type: null };

export const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

// media = { file, previewUrl, type: 'image' | 'video' }; type and file are
// null until something valid is picked.
export const useMediaAttachment = (t) => {
  const [media, setMedia] = useState(EMPTY_MEDIA);
  const fileInputRef = useRef(null);

  // Revoke the preview's object URL when it changes or the form unmounts
  useEffect(() => {
    return () => {
      if (media.previewUrl) URL.revokeObjectURL(media.previewUrl);
    };
  }, [media.previewUrl]);

  const clearMedia = () => {
    setMedia(EMPTY_MEDIA);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      clearMedia();
      return;
    }
    if (!ALLOWED_MEDIA_TYPES.includes(file.type) && !ALLOWED_MEDIA_EXTENSIONS.test(file.name)) {
      showPopup({ type: 'warning', message: t('reportForm.mediaTypeError') });
      clearMedia();
      return;
    }
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);
    if (file.size > (isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE)) {
      showPopup({ type: 'warning', message: isVideo ? t('reportForm.mediaTooLargeVideo') : t('reportForm.mediaTooLargeImage') });
      clearMedia();
      return;
    }
    setMedia({ file, previewUrl: URL.createObjectURL(file), type: isVideo ? 'video' : 'image' });
  };

  return { media, fileInputRef, handleMediaChange, clearMedia };
};

const previewStyle = { display: 'block', width: '100%', maxHeight: '220px', objectFit: 'cover', background: '#000' };

// requiredMark: show the red *; optionalMark: show "(optional)".
const MediaAttachmentField = ({
  t,
  label,
  hint,
  required = false,
  requiredMark = false,
  optionalMark = false,
  disabled = false,
  media,
  fileInputRef,
  onChange,
  onRemove,
  style
}) => (
  <div style={style}>
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '8px',
      fontWeight: '600',
      color: '#374151',
      fontSize: '13px'
    }}>
      <i className="bi bi-camera-video-fill"></i>
      {label}
      {requiredMark && <span style={{ color: '#dc3545' }}>*</span>}
      {!requiredMark && optionalMark && <span style={{ color: '#6b7280', fontWeight: 400 }}>{t('reportForm.optional')}</span>}
    </label>
    <input
      type="file"
      ref={fileInputRef}
      onChange={onChange}
      accept={ACCEPT}
      required={required}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '8px 10px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '13px'
      }}
    />
    {hint && (
      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{hint}</div>
    )}
    {media.previewUrl && (
      <>
        <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d1d5db' }}>
          {media.type === 'video'
            ? <video src={media.previewUrl} controls style={previewStyle} />
            : <img src={media.previewUrl} alt="Selected attachment preview" style={previewStyle} />}
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '8px',
            padding: '5px 12px',
            borderRadius: '16px',
            border: '1px solid #dc3545',
            background: '#fff',
            color: '#dc3545',
            fontSize: '12px',
            fontWeight: 600,
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
        >
          <i className="bi bi-trash3-fill"></i> {t('reportForm.remove')}
        </button>
      </>
    )}
  </div>
);

export default MediaAttachmentField;
