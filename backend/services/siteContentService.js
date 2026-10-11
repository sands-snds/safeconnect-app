const db = require("../config/db");

// Contact details shown on the public site, editable by an Admin
// (super_admin) under Content > Site Contacts:
//   emergencyContacts - the floating call button's list, also the footer's
//                       "Emergency Hotline" column
//   officials         - the footer's "Barangay Officials" column
//   socials           - the footer's support email and Facebook page
// Stored as JSON in system_settings (key "site_contacts"). Until an Admin
// saves changes, DEFAULT_CONTENT is used.

const SETTING_KEY = "site_contacts";

// sublabelKey: a translation key for the default descriptions, so they keep
// showing in Tagalog. It's dropped when an Admin edits the description.
const DEFAULT_CONTENT = {
    emergencyContacts: [
        { id: "police", label: "911 Emergency", description: "National Emergency Hotline", sublabelKey: "police", number: "911", icon: "bi-shield-fill-exclamation", color: "#dc2626" },
        { id: "dasma", label: "Dasmariñas Police", description: "Dasmariñas City PNP", sublabelKey: "dasma", number: "+63462420002", icon: "bi-shield-fill", color: "#1d4ed8" },
        { id: "cdrmc", label: "CDRMC", description: "Cavite Disaster Risk Management", sublabelKey: "cdrmc", number: "+63462300345", icon: "bi-heart-pulse-fill", color: "#059669" },
        { id: "dswd", label: "DSWD", description: "Social Welfare & Development", sublabelKey: "dswd", number: "+63464165393", icon: "bi-people-fill", color: "#ea580c" },
        { id: "barangay", label: "Barangay Sta. Fe", description: "Barangay Emergency Line", sublabelKey: "barangay", number: "+639929474309", icon: "bi-house-fill", color: "#7c3aed" }
    ],
    officials: [
        { name: "PB Emmanuel B. Noora", number: "09354984838" },
        { name: "Chief Tanod Gaudencio C. Dela Cruz", number: "0993611340" },
        { name: "Sec Hazel R. Adriano", number: "09456355303" },
        { name: "BHW Cecilia T. De Quiros", number: "09381259351" },
        { name: "Kagawad Rolando Noora", number: "09683200779" },
        { name: "BNS Myrna T. Dellomas", number: "09069709313" }
    ],
    socials: {
        email: "safeconnect.brgy.santafe@gmail.com",
        facebookLabel: "Barangay Sta. Fe",
        facebookUrl: "https://www.facebook.com/profile.php?id=100080219150790"
    }
};

// Icons and colors an Admin can pick for an emergency contact.
const CONTACT_ICONS = [
    "bi-telephone-fill", "bi-shield-fill-exclamation", "bi-shield-fill", "bi-heart-pulse-fill",
    "bi-people-fill", "bi-house-fill", "bi-fire", "bi-hospital-fill", "bi-truck", "bi-lightning-charge-fill"
];
const CONTACT_COLORS = ["#dc2626", "#1d4ed8", "#059669", "#ea580c", "#7c3aed", "#0891b2", "#db2777", "#6B2C3E"];

const LIMITS = { emergencyContacts: 12, officials: 20 };
const PHONE_REGEX = /^[+()\d][\d\s()+-]{1,24}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// setting_value started as VARCHAR(255), too small for this JSON.
async function ensureSchema() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
            setting_key VARCHAR(100) NOT NULL,
            setting_value TEXT DEFAULT NULL,
            PRIMARY KEY (setting_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    const [[col]] = await db.query(
        `SELECT DATA_TYPE AS type FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'system_settings' AND COLUMN_NAME = 'setting_value'`
    );
    if (col && col.type !== "text") {
        await db.query(`ALTER TABLE system_settings MODIFY setting_value TEXT DEFAULT NULL`);
    }
}

async function getContent() {
    const [rows] = await db.query(
        `SELECT setting_value FROM system_settings WHERE setting_key = ?`,
        [SETTING_KEY]
    );
    if (!rows[0]?.setting_value) return DEFAULT_CONTENT;
    try {
        const saved = JSON.parse(rows[0].setting_value);
        return { ...DEFAULT_CONTENT, ...saved, socials: { ...DEFAULT_CONTENT.socials, ...(saved.socials || {}) } };
    } catch {
        return DEFAULT_CONTENT;
    }
}

const text = (v, max) => String(v ?? "").trim().slice(0, max);

// Cleans what the editor sent. Returns { content } or { error }.
function validate(input = {}) {
    const contactsIn = Array.isArray(input.emergencyContacts) ? input.emergencyContacts : [];
    const officialsIn = Array.isArray(input.officials) ? input.officials : [];

    if (contactsIn.length === 0) return { error: "Add at least one emergency contact." };
    if (contactsIn.length > LIMITS.emergencyContacts) return { error: `You can list up to ${LIMITS.emergencyContacts} emergency contacts.` };
    if (officialsIn.length > LIMITS.officials) return { error: `You can list up to ${LIMITS.officials} barangay officials.` };

    const emergencyContacts = [];
    for (const [i, c] of contactsIn.entries()) {
        const label = text(c.label, 60);
        const number = text(c.number, 25);
        if (!label || !number) return { error: `Emergency contact #${i + 1} needs a name and a number.` };
        if (!PHONE_REGEX.test(number)) return { error: `"${number}" doesn't look like a phone number (emergency contact "${label}").` };
        const description = text(c.description, 80);
        const entry = {
            id: text(c.id, 40) || `contact-${Date.now()}-${i}`,
            label,
            description,
            number,
            icon: CONTACT_ICONS.includes(c.icon) ? c.icon : CONTACT_ICONS[0],
            color: CONTACT_COLORS.includes(c.color) ? c.color : CONTACT_COLORS[0]
        };
        // Keep the translation key only while the description is unchanged.
        const original = DEFAULT_CONTENT.emergencyContacts.find((d) => d.sublabelKey && d.sublabelKey === c.sublabelKey);
        if (original && original.description === description) entry.sublabelKey = original.sublabelKey;
        emergencyContacts.push(entry);
    }

    const officials = [];
    for (const [i, o] of officialsIn.entries()) {
        const name = text(o.name, 80);
        const number = text(o.number, 25);
        if (!name && !number) continue; // ignore empty rows
        if (!name || !number) return { error: `Barangay official #${i + 1} needs a name and a number.` };
        if (!PHONE_REGEX.test(number)) return { error: `"${number}" doesn't look like a phone number (official "${name}").` };
        officials.push({ name, number });
    }

    const s = input.socials || {};
    const email = text(s.email, 120);
    const facebookLabel = text(s.facebookLabel, 80);
    const facebookUrl = text(s.facebookUrl, 300);
    if (email && !EMAIL_REGEX.test(email)) return { error: "Please enter a valid support email address." };
    if (facebookUrl && !/^https:\/\/([a-z0-9-]+\.)*(facebook\.com|fb\.com|fb\.me)\//i.test(facebookUrl)) {
        return { error: "The Facebook link must be a facebook.com address starting with https://." };
    }

    return { content: { emergencyContacts, officials, socials: { email, facebookLabel, facebookUrl } } };
}

async function saveContent(content) {
    await db.query(
        `INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [SETTING_KEY, JSON.stringify(content)]
    );
}

module.exports = {
    DEFAULT_CONTENT,
    CONTACT_ICONS,
    CONTACT_COLORS,
    ensureSchema,
    getContent,
    validate,
    saveContent
};
