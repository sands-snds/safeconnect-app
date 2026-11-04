// Checks the valid ID sent with a sign-up: a data URL of a JPG, PNG, WebP or
// PDF, at most 5 MB. The file's first bytes must match its type, so a file
// renamed to look like an image is turned away.
const MAX_ID_BYTES = 5 * 1024 * 1024;

const SIGNATURES = {
    "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
    "image/png": (b) => b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    "image/webp": (b) => b.slice(0, 4).toString("ascii") === "RIFF" && b.slice(8, 12).toString("ascii") === "WEBP",
    "application/pdf": (b) => b.slice(0, 5).toString("ascii") === "%PDF-"
};

const EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

// The kinds of ID the sign-up form offers (the value it sends).
const ID_TYPES = [
    "Barangay ID",
    "Barangay Certificate of Residency",
    "PhilSys National ID",
    "Voter's ID or Certification",
    "Driver's License",
    "Postal ID",
    "UMID",
    "School ID",
    "Other government-issued ID"
];

// Returns { idType, fileName, mimeType, data } or { error }.
const parseIdUpload = (upload) => {
    if (!upload || typeof upload.dataUrl !== "string") {
        return { error: "Please upload a valid ID that shows you live in Barangay Santa Fe." };
    }
    const idType = ID_TYPES.includes(upload.idType) ? upload.idType : null;
    if (!idType) return { error: "Please choose the type of ID you are uploading." };

    const match = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(upload.dataUrl);
    if (!match) return { error: "The ID file couldn't be read. Please upload it again." };

    const mimeType = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
    if (!SIGNATURES[mimeType]) return { error: "The ID must be a JPG, PNG, WebP or PDF file." };

    const data = Buffer.from(match[2], "base64");
    if (data.length === 0) return { error: "The ID file is empty. Please upload it again." };
    if (data.length > MAX_ID_BYTES) return { error: "The ID file is too large. The limit is 5 MB." };
    if (!SIGNATURES[mimeType](data)) return { error: "The ID file doesn't match its type. Please upload a real JPG, PNG, WebP or PDF." };

    // Keep only a plain name (no folders or odd characters) for display.
    const base = String(upload.fileName || "").split(/[\\/]/).pop()
        .replace(/[^\w.\- ]+/g, "").replace(/^[.\s]+/, "").slice(0, 120);
    const fileName = base.replace(/\.[^.]*$/, "").trim() ? base : `valid-id.${EXTENSIONS[mimeType]}`;

    return { idType, fileName, mimeType, data };
};

module.exports = { parseIdUpload, ID_TYPES, MAX_ID_BYTES };
