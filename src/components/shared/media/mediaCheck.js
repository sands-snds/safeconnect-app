import exifr from 'exifr';

// Checks a report's photo or video from its details (metadata) as soon as it
// is picked, so the resident knows right away. Same rules as the backend's
// check (backend/utils/mediaCheck.js), which is the one that counts:
//   taken today            → accepted
//   taken yesterday        → accepted, with a "a day old" note
//   older, or a future day → refused
//   no date in its details → refused (screenshots, downloaded or forwarded
//                            files lose it)
//   saved by an editing app → refused
// Dates are Philippine time.

const PH_OFFSET = '+08:00';
const EDITOR_APPS = /photoshop|lightroom|snapseed|picsart|canva|gimp|pixlr|facetune|vsco|meitu|airbrush|photoroom|polarr|afterlight|photo ?editor|capcut|inshot|kinemaster|vn video|premiere|imovie|filmora|vivavideo|powerdirector|youcut|splice/i;
const MAC_EPOCH_OFFSET = 2082844800;

export const dayKey = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(date); // YYYY-MM-DD

const daysBetween = (fromKey, toKey) => Math.round((Date.parse(toKey) - Date.parse(fromKey)) / 86400000);

const exifDate = (value, offset) => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(String(value || ''));
  if (!m) return null;
  const tz = /^[+-]\d{2}:\d{2}$/.test(offset || '') ? offset : PH_OFFSET;
  const date = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${tz}`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const readImage = async (file) => {
  let tags = {};
  try {
    tags = (await exifr.parse(file, {
      tiff: true, exif: true, gps: true, reviveValues: false, translateValues: false,
      pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate', 'OffsetTimeOriginal', 'OffsetTime', 'Software']
    })) || {};
  } catch {
    tags = {};
  }
  const takenAt = exifDate(tags.DateTimeOriginal || tags.CreateDate, tags.OffsetTimeOriginal);
  const modifiedAt = exifDate(tags.ModifyDate, tags.OffsetTime || tags.OffsetTimeOriginal);
  let editedBy = EDITOR_APPS.test(tags.Software || '') ? String(tags.Software).trim() : null;
  if (!editedBy && takenAt && modifiedAt && modifiedAt - takenAt > 2 * 60 * 1000) editedBy = 'a photo editor';
  return { takenAt, editedBy };
};

// MP4 / MOV: the creation time is in the "mvhd" box inside "moov".
const findBox = (view, type, start, end) => {
  let pos = start;
  while (pos + 8 <= end) {
    let size = view.getUint32(pos);
    const boxType = String.fromCharCode(view.getUint8(pos + 4), view.getUint8(pos + 5), view.getUint8(pos + 6), view.getUint8(pos + 7));
    let header = 8;
    if (size === 1) {
      if (pos + 16 > end) return null;
      size = Number(view.getBigUint64(pos + 8));
      header = 16;
    } else if (size === 0) {
      size = end - pos;
    }
    if (size < header) return null;
    if (boxType === type) return { start: pos + header, end: Math.min(pos + size, end) };
    pos += size;
  }
  return null;
};

const latin1 = (bytes) => {
  let text = '';
  for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  return text;
};

export const readVideo = (buffer) => {
  const view = new DataView(buffer);
  const moov = findBox(view, 'moov', 0, buffer.byteLength);
  if (!moov) return { takenAt: null, editedBy: null };
  let takenAt = null;
  const mvhd = findBox(view, 'mvhd', moov.start, moov.end);
  if (mvhd) {
    const version = view.getUint8(mvhd.start);
    const seconds = version === 1 ? Number(view.getBigUint64(mvhd.start + 4)) : view.getUint32(mvhd.start + 4);
    if (seconds > MAC_EPOCH_OFFSET) takenAt = new Date((seconds - MAC_EPOCH_OFFSET) * 1000);
  }
  const editor = EDITOR_APPS.exec(latin1(new Uint8Array(buffer, moov.start, moov.end - moov.start)));
  return { takenAt, editedBy: editor ? editor[0] : null };
};

const fileBuffer = (file) => (file.arrayBuffer
  ? file.arrayBuffer()
  : new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  }));

// A photo from the form's "Take a photo" button that has no date in its
// details (some phones' cameras leave it out) still counts as taken now when
// the file was made in the last few minutes; staff are told it had no date.
const CAMERA_FRESH_MS = 15 * 60 * 1000;

// Returns { ok: false, reason } (noDate, future, tooOld, edited) or
// { ok: true, takenAt, dayOld, fromCamera }.
// fromCamera: the file came from the camera button, not the gallery.
export async function checkMediaFile(file, isVideo, now = new Date(), { fromCamera = false } = {}) {
  let info;
  try {
    info = isVideo ? readVideo(await fileBuffer(file)) : await readImage(file);
  } catch {
    info = { takenAt: null, editedBy: null };
  }
  if (info.editedBy) return { ok: false, reason: 'edited' };
  if (!info.takenAt && fromCamera && Number.isFinite(file.lastModified)
    && Math.abs(now - file.lastModified) <= CAMERA_FRESH_MS) {
    return { ok: true, takenAt: new Date(file.lastModified), dayOld: false, fromCamera: true };
  }
  if (!info.takenAt) return { ok: false, reason: 'noDate' };
  const age = daysBetween(dayKey(info.takenAt), dayKey(now));
  if (age < 0) return { ok: false, reason: 'future' };
  if (age > 1) return { ok: false, reason: 'tooOld' };
  return { ok: true, takenAt: info.takenAt, dayOld: age === 1 };
}

// The refusal reasons as translation keys (reportForm.mediaCheck.*).
export const mediaCheckMessageKey = (reason) => `reportForm.mediaCheck.${reason}`;
