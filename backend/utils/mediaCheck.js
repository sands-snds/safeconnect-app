const exifr = require("exifr");

// Checks a report's photo or video from its details (metadata): when it was
// taken, whether an editing app saved it, and where (GPS), so the barangay
// only gets fresh, unedited media. The report forms run the same rules
// (src/components/shared/media/mediaCheck.js) to warn before sending; this
// is the check that counts.
//
// Rules (dates in Philippine time):
//   taken today            → accepted
//   taken yesterday        → accepted, flagged "day_old"
//   older, or a future day → rejected
//   no date in its details → rejected (screenshots, downloaded or forwarded
//                            files lose it)
//   saved by an editing app → rejected

const PH_OFFSET = "+08:00";
const EDITOR_APPS = /photoshop|lightroom|snapseed|picsart|canva|gimp|pixlr|facetune|vsco|meitu|airbrush|photoroom|polarr|afterlight|photo ?editor|capcut|inshot|kinemaster|vn video|premiere|imovie|filmora|vivavideo|powerdirector|youcut|splice/i;

const dayKey = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(date); // YYYY-MM-DD

const daysBetween = (fromKey, toKey) => Math.round((Date.parse(toKey) - Date.parse(fromKey)) / 86400000);

// "2026:11:10 08:30:12" (camera local time) → Date, as Philippine time
// unless the photo says its own offset.
const exifDate = (value, offset) => {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(String(value || ""));
    if (!m) return null;
    const tz = /^[+-]\d{2}:\d{2}$/.test(offset || "") ? offset : PH_OFFSET;
    const date = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${tz}`);
    return Number.isNaN(date.getTime()) ? null : date;
};

const readImage = async (buffer) => {
    const tags = await exifr.parse(buffer, {
        tiff: true, exif: true, gps: true, reviveValues: false, translateValues: false,
        pick: ["DateTimeOriginal", "CreateDate", "ModifyDate", "OffsetTimeOriginal", "OffsetTime", "Software",
            "GPSLatitude", "GPSLatitudeRef", "GPSLongitude", "GPSLongitudeRef", "latitude", "longitude"]
    }).catch(() => null) || {};
    const takenAt = exifDate(tags.DateTimeOriginal || tags.CreateDate, tags.OffsetTimeOriginal);
    const modifiedAt = exifDate(tags.ModifyDate, tags.OffsetTime || tags.OffsetTimeOriginal);
    let editedBy = EDITOR_APPS.test(tags.Software || "") ? String(tags.Software).trim() : null;
    // Saved again well after it was taken: an edit.
    if (!editedBy && takenAt && modifiedAt && modifiedAt - takenAt > 2 * 60 * 1000) editedBy = "a photo editor";
    let gps = null;
    try { gps = await exifr.gps(buffer); } catch { gps = null; }
    return {
        takenAt,
        editedBy,
        latitude: gps && Number.isFinite(gps.latitude) ? gps.latitude : null,
        longitude: gps && Number.isFinite(gps.longitude) ? gps.longitude : null
    };
};

// MP4 / MOV: the "mvhd" box holds the creation time (seconds since 1904,
// UTC); the location is an ISO 6709 text such as "+14.3203+120.9648/".
const MAC_EPOCH_OFFSET = 2082844800;
const findBox = (buf, type, start = 0, end = buf.length) => {
    let pos = start;
    while (pos + 8 <= end) {
        let size = buf.readUInt32BE(pos);
        const boxType = buf.toString("latin1", pos + 4, pos + 8);
        let header = 8;
        if (size === 1) {
            if (pos + 16 > end) return null;
            size = Number(buf.readBigUInt64BE(pos + 8));
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

const readVideo = (buffer) => {
    const moov = findBox(buffer, "moov");
    if (!moov) return { takenAt: null, editedBy: null, latitude: null, longitude: null };
    let takenAt = null;
    const mvhd = findBox(buffer, "mvhd", moov.start, moov.end);
    if (mvhd) {
        const version = buffer.readUInt8(mvhd.start);
        const seconds = version === 1
            ? Number(buffer.readBigUInt64BE(mvhd.start + 4))
            : buffer.readUInt32BE(mvhd.start + 4);
        if (seconds > MAC_EPOCH_OFFSET) takenAt = new Date((seconds - MAC_EPOCH_OFFSET) * 1000);
    }
    const text = buffer.toString("latin1", moov.start, moov.end);
    const editor = EDITOR_APPS.exec(text);
    const loc = /([+-]\d{1,2}\.\d{2,})([+-]\d{1,3}\.\d{2,})/.exec(text);
    return {
        takenAt,
        editedBy: editor ? editor[0] : null,
        latitude: loc ? Number(loc[1]) : null,
        longitude: loc ? Number(loc[2]) : null
    };
};

const REJECT_MESSAGES = {
    noDate: "We can't tell when this photo or video was taken. Please take a new one with your camera.",
    future: "This photo or video is dated later than today. Please take a new one with your camera.",
    tooOld: "This photo or video wasn't taken today. Please take a new one of what is happening now.",
    edited: "This photo or video was changed in an editing app. Please attach the original from your camera."
};

// dataUrl: the report's base64 photo or video. Returns
// { ok: false, reason, message } or
// { ok: true, takenAt, latitude, longitude, flags: [] | ["day_old"] }.
const checkMedia = async (dataUrl, mediaType, now = new Date()) => {
    const match = /^data:([^;,]+)?(;base64)?,/.exec(String(dataUrl || ""));
    if (!match) return { ok: false, reason: "noDate", message: REJECT_MESSAGES.noDate };
    const buffer = Buffer.from(String(dataUrl).slice(match[0].length), "base64");
    const isVideo = mediaType === "video" || /^video\//.test(match[1] || "");
    const info = isVideo ? readVideo(buffer) : await readImage(buffer);

    if (info.editedBy) return { ok: false, reason: "edited", message: REJECT_MESSAGES.edited };
    if (!info.takenAt) return { ok: false, reason: "noDate", message: REJECT_MESSAGES.noDate };
    const age = daysBetween(dayKey(info.takenAt), dayKey(now));
    if (age < 0) return { ok: false, reason: "future", message: REJECT_MESSAGES.future };
    if (age > 1) return { ok: false, reason: "tooOld", message: REJECT_MESSAGES.tooOld };
    return {
        ok: true,
        takenAt: info.takenAt,
        latitude: info.latitude,
        longitude: info.longitude,
        flags: age === 1 ? ["day_old"] : []
    };
};

// The columns a report saves about its media (see services/archiveService.js).
const mediaColumns = (result) => (result && result.ok
    ? {
        mediaTakenAt: result.takenAt,
        mediaLatitude: result.latitude,
        mediaLongitude: result.longitude,
        mediaFlags: result.flags.join(",") || null
    }
    : { mediaTakenAt: null, mediaLatitude: null, mediaLongitude: null, mediaFlags: null });

// A refused photo or video as a service result (HTTP 422). The forms turn
// MEDIA_REJECTED + reason into a translated message.
const mediaRejected = (result) => ({
    success: false,
    status: 422,
    code: "MEDIA_REJECTED",
    reason: result.reason,
    message: result.message
});

module.exports = { checkMedia, mediaColumns, mediaRejected, readVideo, dayKey, REJECT_MESSAGES };
