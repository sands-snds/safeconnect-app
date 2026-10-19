const db = require("../config/db");

// Photos and videos on the public site, editable by an Admin (super_admin)
// under Content > Site Contents:
//   carousel    - the landing page's background slideshow
//   systemDemo  - "See SafeConnect in action" video: on the landing page
//                 (below the carousel, above "What you can do") and in the
//                 resident News page (below the weather card); each can be hidden
//   adminDemo   - walkthrough video shown when someone signs in to the
//                 admin panel; can also be watched again from Site Contents
// Stored as JSON in system_settings (key "site_media"). Until an Admin saves
// changes, DEFAULT_MEDIA is used. Uploaded files live in backend/uploads.
//
// A video is { source: "none" | "upload" | "youtube", url }:
//   upload  -> url is "/uploads/<file>" (MP4 / WebM)
//   youtube -> url is the YouTube video id

const SETTING_KEY = "site_media";

const DEFAULT_MEDIA = {
    // Frontend images (public/images), used until an Admin uploads others.
    carousel: [
        { src: "/images/Santa Fe 3.jpg", alt: "Barangay Sta. Fe" },
        { src: "/images/Santa Fe 2.jpg", alt: "Community rescue" },
        { src: "/images/Santa Fe.jpg", alt: "Evacuation" }
    ],
    // The resident page's slideshow (behind "Stay safe, stay informed").
    residentCarousel: [
        { src: "/images/resident-background.jpg", alt: "Barangay Sta. Fe" },
        { src: "/images/resident-background2.jpg", alt: "Barangay Sta. Fe" },
        { src: "/images/resident-background3.jpg", alt: "Barangay Sta. Fe" }
    ],
    systemDemo: {
        title: "See SafeConnect in action",
        caption: "A quick tour of how to report an emergency, request help and follow your report.",
        video: { source: "none", url: "" },
        showOnLanding: true,
        showInNews: true
    },
    adminDemo: {
        title: "Welcome to the SafeConnect admin panel",
        caption: "A short walkthrough of handling reports, posting announcements and managing the site.",
        video: { source: "none", url: "" },
        showOnSignIn: true
    }
};

const MAX_SLIDES = 10;
const text = (v, max) => String(v ?? "").trim().slice(0, max);

// Accepts a full YouTube link (watch, youtu.be, shorts, embed) or a bare id.
const youtubeId = (value) => {
    const v = String(value || "").trim();
    if (/^[\w-]{11}$/.test(v)) return v;
    const m = v.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i);
    return m ? m[1] : null;
};

const isUploadPath = (v) => /^\/uploads\/[\w.-]+$/.test(String(v || ""));
const isFrontendImage = (v) => /^\/images\/[\w .()-]+\.(jpe?g|png|webp)$/i.test(String(v || ""));

async function getMedia() {
    const [rows] = await db.query(
        `SELECT setting_value FROM system_settings WHERE setting_key = ?`,
        [SETTING_KEY]
    );
    if (!rows[0]?.setting_value) return DEFAULT_MEDIA;
    try {
        const saved = JSON.parse(rows[0].setting_value);
        return {
            carousel: Array.isArray(saved.carousel) && saved.carousel.length ? saved.carousel : DEFAULT_MEDIA.carousel,
            residentCarousel: Array.isArray(saved.residentCarousel) && saved.residentCarousel.length ? saved.residentCarousel : DEFAULT_MEDIA.residentCarousel,
            systemDemo: { ...DEFAULT_MEDIA.systemDemo, ...(saved.systemDemo || {}) },
            adminDemo: { ...DEFAULT_MEDIA.adminDemo, ...(saved.adminDemo || {}) }
        };
    } catch {
        return DEFAULT_MEDIA;
    }
}

function validateVideo(video = {}, name) {
    const source = video.source;
    if (source === "upload") {
        if (!isUploadPath(video.url)) return { error: `Upload a video file for "${name}", or choose another option.` };
        return { video: { source, url: video.url } };
    }
    if (source === "youtube") {
        const id = youtubeId(video.url);
        if (!id) return { error: `That doesn't look like a YouTube link ("${name}").` };
        return { video: { source, url: id } };
    }
    return { video: { source: "none", url: "" } };
}

// Cleans what the editor sent. Returns { media } or { error }.
// name: "landing page" / "resident page", for messages.
function validateSlides(slidesIn, name) {
    if (!Array.isArray(slidesIn) || slidesIn.length === 0) return { error: `Keep at least one ${name} carousel photo.` };
    if (slidesIn.length > MAX_SLIDES) return { error: `You can have up to ${MAX_SLIDES} ${name} carousel photos.` };
    const slides = [];
    for (const [i, s] of slidesIn.entries()) {
        if (!isUploadPath(s.src) && !isFrontendImage(s.src)) return { error: `${name[0].toUpperCase()}${name.slice(1)} carousel photo #${i + 1} is missing its image.` };
        slides.push({ src: s.src, alt: text(s.alt, 120) || "Barangay Sta. Fe" });
    }
    return { slides };
}

function validate(input = {}) {
    const landing = validateSlides(input.carousel, "landing page");
    if (landing.error) return landing;
    const resident = validateSlides(input.residentCarousel || DEFAULT_MEDIA.residentCarousel, "resident page");
    if (resident.error) return resident;

    const sys = input.systemDemo || {};
    const sysVideo = validateVideo(sys.video, "System demo");
    if (sysVideo.error) return sysVideo;

    const adm = input.adminDemo || {};
    const admVideo = validateVideo(adm.video, "Admin demo");
    if (admVideo.error) return admVideo;

    return {
        media: {
            carousel: landing.slides,
            residentCarousel: resident.slides,
            systemDemo: {
                title: text(sys.title, 100),
                caption: text(sys.caption, 300),
                video: sysVideo.video,
                showOnLanding: Boolean(sys.showOnLanding),
                showInNews: Boolean(sys.showInNews)
            },
            adminDemo: {
                title: text(adm.title, 100),
                caption: text(adm.caption, 300),
                video: admVideo.video,
                showOnSignIn: Boolean(adm.showOnSignIn)
            }
        }
    };
}

async function saveMedia(media) {
    await db.query(
        `INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [SETTING_KEY, JSON.stringify(media)]
    );
}

module.exports = { DEFAULT_MEDIA, getMedia, validate, saveMedia, youtubeId };
