const db = require("../config/db");






















const SETTING_KEY = "site_contacts";



const DEFAULT_CONTENT = {
    emergencyContacts: [
        { id: "police", label: "911 Emergency", description: "National Emergency Hotline", sublabelKey: "police", number: "911", icon: "bi-shield-fill-exclamation", color: "#dc2626" },
        { id: "dasma", label: "Dasmariñas Police", description: "Dasmariñas City PNP", sublabelKey: "dasma", number: "+63462420002", numberType: "landline", icon: "bi-shield-fill", color: "#1d4ed8" },
        { id: "cdrmc", label: "CDRMC", description: "Cavite Disaster Risk Management", sublabelKey: "cdrmc", number: "+63462300345", numberType: "landline", icon: "bi-heart-pulse-fill", color: "#059669" },
        { id: "dswd", label: "DSWD", description: "Social Welfare & Development", sublabelKey: "dswd", number: "+63464165393", numberType: "landline", icon: "bi-people-fill", color: "#ea580c" },
        {
            id: "barangay", label: "Barangay Sta. Fe", description: "Barangay Emergency Line", sublabelKey: "barangay", number: "+639354984838", numberType: "mobile", icon: "bi-house-fill", color: "#7c3aed",
            
            choices: [
                { name: "PB Emmanuel B. Noora", number: "+639354984838", numberType: "mobile" },
                { name: "Sec Hazel R. Adriano", number: "+639456355303", numberType: "mobile" }
            ]
        }
    ],
    
    
    footerHotlines: [
        { label: "911 Emergency", number: "911" },
        { label: "Dasmariñas Police", number: "+63462420002" },
        { label: "CDRMC", number: "+63462300345" },
        { label: "DSWD", number: "+63464165393" }
    ],
    officials: [
        { name: "PB Emmanuel B. Noora", position: "PB", firstName: "Emmanuel", middleName: "B.", lastName: "Noora", number: "+639354984838", numberType: "mobile" },
        { name: "Chief Tanod Gaudencio C. Dela Cruz", position: "Chief Tanod", firstName: "Gaudencio", middleName: "C.", lastName: "Dela Cruz", number: "+63993611340", numberType: "landline" },
        { name: "Sec Hazel R. Adriano", position: "Sec", firstName: "Hazel", middleName: "R.", lastName: "Adriano", number: "+639456355303", numberType: "mobile" },
        { name: "BHW Cecilia T. De Quiros", position: "BHW", firstName: "Cecilia", middleName: "T.", lastName: "De Quiros", number: "+639381259351", numberType: "mobile" },
        { name: "Kagawad Rolando Noora", position: "Kagawad", firstName: "Rolando", middleName: "", lastName: "Noora", number: "+639683200779", numberType: "mobile" },
        { name: "BNS Myrna T. Dellomas", position: "BNS", firstName: "Myrna", middleName: "T.", lastName: "Dellomas", number: "+639069709313", numberType: "mobile" }
    ],
    socials: {
        email: "safeconnect.brgy.santafe@gmail.com",
        facebookLabel: "Barangay Sta. Fe",
        facebookUrl: "https://www.facebook.com/profile.php?id=100080219150790"
    }
};


const CONTACT_ICONS = [
    "bi-telephone-fill", "bi-shield-fill-exclamation", "bi-shield-fill", "bi-heart-pulse-fill",
    "bi-people-fill", "bi-house-fill", "bi-fire", "bi-hospital-fill", "bi-truck", "bi-lightning-charge-fill"
];
const CONTACT_COLORS = ["#dc2626", "#1d4ed8", "#059669", "#ea580c", "#7c3aed", "#0891b2", "#db2777", "#6B2C3E"];

const LIMITS = { emergencyContacts: 12, footerHotlines: 12, officials: 20, choices: 4 };




const OLD_BARANGAY_NUMBER = "+639929474309";
const upgradeBarangayContact = (contacts) => contacts.map((c) => {
    const def = DEFAULT_CONTENT.emergencyContacts.find((d) => d.id === "barangay");
    if (c.id !== "barangay" || c.choices || String(c.number).replace(/\s/g, "") !== OLD_BARANGAY_NUMBER) return c;
    return { ...c, number: def.number, choices: def.choices };
});
const PHONE_REGEX = /^[+()\d][\d\s()+-]{1,24}$/;
const TEXT_MAX = 40;

// Philippine numbers: digits after +63 by type.
const NUMBER_DIGITS = { mobile: 10, landline: 9 };

const localDigits = (value) => {
    const raw = String(value ?? "").trim();
    if (raw.startsWith("+63")) return raw.slice(3).replace(/\D/g, "");
    let d = raw.replace(/\D/g, "");
    if (d.startsWith("63") && d.length >= 11) d = d.slice(2);
    else if (d.startsWith("0")) d = d.slice(1);
    return d;
};
const guessType = (d) => (d.length === 10 && d.startsWith("9") ? "mobile" : "landline");


function checkNumber(raw, type, what) {
    if (/[a-z]/i.test(String(raw ?? ""))) return { error: `${what}: the number can only have digits.` };
    const d = localDigits(raw);
    const numberType = NUMBER_DIGITS[type] ? type : guessType(d);
    if (numberType === "mobile") {
        if (d.length !== 10 || !d.startsWith("9")) {
            return { error: `${what}: a mobile number is +63 followed by 10 digits starting with 9 (e.g. +63 917 123 4567).` };
        }
    } else if (d.length !== 9) {
        return { error: `${what}: a landline is +63 followed by 9 digits (e.g. +63 46 242 0002).` };
    }
    return { number: `+63${d}`, numberType };
}


const upgradeNumber = (entry) => {
    if (!entry || entry.numberType || String(entry.number).trim() === "911") return entry;
    const d = localDigits(entry.number);
    return d ? { ...entry, number: `+63${d}`, numberType: guessType(d) } : entry;
};



const KNOWN_POSITIONS = ["Punong Barangay", "Chief Tanod", "SK Chairman", "Secretary", "Treasurer", "Kagawad", "PB", "Sec", "BHW", "BNS"];
const composeName = (o) => [o.position, o.firstName, o.middleName, o.lastName].filter(Boolean).join(" ");
const splitOfficialName = (name) => {
    let rest = String(name || "").trim();
    const position = KNOWN_POSITIONS.find((p) => rest.toLowerCase().startsWith(`${p.toLowerCase()} `)) || "";
    if (position) rest = rest.slice(position.length).trim();
    const words = rest.split(/\s+/).filter(Boolean);
    const m = words.findIndex((w, i) => i > 0 && /^[A-Z]\.$/i.test(w));
    if (m > 0) {
        return { position, firstName: words.slice(0, m).join(" "), middleName: words[m], lastName: words.slice(m + 1).join(" ") };
    }
    return { position, firstName: words[0] || "", middleName: "", lastName: words.slice(1).join(" ") };
};
const upgradeOfficial = (o) => {
    const parts = o.firstName !== undefined ? o : { ...o, ...splitOfficialName(o.name) };
    return upgradeNumber({ ...parts, name: composeName(parts) || o.name || "" });
};

const upgradeContent = (content) => ({
    ...content,
    emergencyContacts: (content.emergencyContacts || []).map((c) => {
        const next = upgradeNumber(c);
        return Array.isArray(c.choices) ? { ...next, choices: c.choices.map(upgradeNumber) } : next;
    }),
    officials: (content.officials || []).map(upgradeOfficial)
});
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


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
        const merged = { ...DEFAULT_CONTENT, ...saved, socials: { ...DEFAULT_CONTENT.socials, ...(saved.socials || {}) } };
        if (Array.isArray(merged.emergencyContacts)) merged.emergencyContacts = upgradeBarangayContact(merged.emergencyContacts);
        return upgradeContent(merged);
    } catch {
        return DEFAULT_CONTENT;
    }
}

const text = (v, max) => String(v ?? "").trim().slice(0, max);


function validate(input = {}) {
    const contactsIn = Array.isArray(input.emergencyContacts) ? input.emergencyContacts : [];
    const officialsIn = Array.isArray(input.officials) ? input.officials : [];
    const hotlinesIn = Array.isArray(input.footerHotlines) ? input.footerHotlines : [];

    if (contactsIn.length === 0) return { error: "Add at least one emergency contact." };
    if (contactsIn.length > LIMITS.emergencyContacts) return { error: `You can list up to ${LIMITS.emergencyContacts} emergency contacts.` };
    if (officialsIn.length > LIMITS.officials) return { error: `You can list up to ${LIMITS.officials} barangay officials.` };
    if (hotlinesIn.length > LIMITS.footerHotlines) return { error: `You can list up to ${LIMITS.footerHotlines} footer hotlines.` };

    const emergencyContacts = [];
    for (const [i, c] of contactsIn.entries()) {
        const label = text(c.label, TEXT_MAX);

        // People the caller can choose between (optional).
        const choicesIn = Array.isArray(c.choices) ? c.choices : [];
        const choices = [];
        for (const [j, ch] of choicesIn.entries()) {
            const name = text(ch?.name, TEXT_MAX);
            const rawNumber = localDigits(ch?.number);
            if (!name && !rawNumber) continue; // ignore empty rows
            if (!name || !rawNumber) return { error: `Person #${j + 1} under "${label || `emergency contact #${i + 1}`}" needs a name and a number.` };
            const checked = checkNumber(ch.number, ch.numberType, `${name} (under "${label}")`);
            if (checked.error) return { error: checked.error };
            choices.push({ name, ...checked });
        }
        if (choices.length > LIMITS.choices) return { error: `"${label}" can list up to ${LIMITS.choices} people to choose from.` };

        
        
        let numbered;
        if (String(c.number ?? "").trim() === "911") {
            numbered = { number: "911" };
        } else if (!localDigits(c.number) && choices[0]) {
            numbered = { number: choices[0].number, numberType: choices[0].numberType };
        } else {
            if (!label || !localDigits(c.number)) return { error: `Emergency contact #${i + 1} needs a name and a number.` };
            numbered = checkNumber(c.number, c.numberType, `Emergency contact "${label}"`);
            if (numbered.error) return { error: numbered.error };
        }
        if (!label) return { error: `Emergency contact #${i + 1} needs a name.` };
        const description = text(c.description, TEXT_MAX);
        const entry = {
            id: text(c.id, 40) || `contact-${Date.now()}-${i}`,
            label,
            description,
            ...numbered,
            icon: CONTACT_ICONS.includes(c.icon) ? c.icon : CONTACT_ICONS[0],
            
            color: typeof c.color === "string" && /^#[0-9a-f]{6}$/i.test(c.color) ? c.color : CONTACT_COLORS[0]
        };
        
        const original = DEFAULT_CONTENT.emergencyContacts.find((d) => d.sublabelKey && d.sublabelKey === c.sublabelKey);
        if (original && original.description === description) entry.sublabelKey = original.sublabelKey;
        if (choices.length) entry.choices = choices;
        
        if (c.hidden === true) entry.hidden = true;
        emergencyContacts.push(entry);
    }

    const footerHotlines = [];
    for (const [i, h] of hotlinesIn.entries()) {
        const label = text(h.label, TEXT_MAX);
        const number = text(h.number, 25);
        if (!label && !number) continue; // ignore empty rows
        if (!label || !number) return { error: `Footer hotline #${i + 1} needs a name and a number.` };
        if (!PHONE_REGEX.test(number)) return { error: `"${number}" doesn't look like a phone number (footer hotline "${label}").` };
        footerHotlines.push({ label, number });
    }

    const officials = [];
    for (const [i, raw] of officialsIn.entries()) {
        // Older editors sent only `name`.
        const o = raw.firstName === undefined && raw.name ? { ...raw, ...splitOfficialName(raw.name) } : raw;
        const parts = {
            position: text(o.position, TEXT_MAX),
            firstName: text(o.firstName, TEXT_MAX),
            middleName: text(o.middleName, TEXT_MAX),
            lastName: text(o.lastName, TEXT_MAX)
        };
        const hasNumber = Boolean(localDigits(o.number));
        if (!parts.position && !parts.firstName && !parts.lastName && !hasNumber) continue; // ignore empty rows
        const who = composeName(parts) || `Barangay official #${i + 1}`;
        if (!parts.position) return { error: `${who}: please enter the position (e.g. Kagawad).` };
        if (!parts.firstName || !parts.lastName) return { error: `${who}: please enter the first and last name.` };
        if (!hasNumber) return { error: `${who}: please enter a number.` };
        const checked = checkNumber(o.number, o.numberType, who);
        if (checked.error) return { error: checked.error };
        officials.push({ name: composeName(parts), ...parts, ...checked });
    }

    const s = input.socials || {};
    const email = text(s.email, TEXT_MAX);
    const facebookLabel = text(s.facebookLabel, TEXT_MAX);
    const facebookUrl = text(s.facebookUrl, 300);
    if (email && !EMAIL_REGEX.test(email)) return { error: "Please enter a valid support email address." };
    if (facebookUrl && !/^https:\/\/([a-z0-9-]+\.)*(facebook\.com|fb\.com|fb\.me)\//i.test(facebookUrl)) {
        return { error: "The Facebook link must be a facebook.com address starting with https://." };
    }

    return { content: { emergencyContacts, footerHotlines, officials, socials: { email, facebookLabel, facebookUrl } } };
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
    TEXT_MAX,
    CONTACT_ICONS,
    CONTACT_COLORS,
    ensureSchema,
    getContent,
    validate,
    saveContent
};
