// 100 fictional resident accounts for testing the admin pages (Users,
// Account Verification). Every one has an @example.com email (a domain kept
// for examples, so no mail ever reaches a real person) and a +63900 number;
// that is how this script finds them again. Real accounts are never touched.
//
//   node scripts/seedTestUsers.js            add the accounts (skips any already there)
//   node scripts/seedTestUsers.js --dry-run  show what would be added
//   node scripts/seedTestUsers.js --remove   delete the test accounts again
//
// The database is the one in backend/.env, unless DB_HOST, DB_USER,
// DB_PASSWORD, DB_NAME, DB_PORT and DB_SSL are set in the shell (those win).
//
// Mix: 70 Active (ID approved), 15 Pending (waiting in Account Verification,
// with a sample ID), 8 Suspended, 7 Closed. Password for all: TestUser@2026

const path = require("path");
const zlib = require("zlib");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });
const bcrypt = require("bcrypt");
const db = require("../config/db");
const User = require("../models/User");
const ResidentIdDocument = require("../models/ResidentIdDocument");
const { isWithinSantaFe, SANTA_FE_BOUNDARY } = require("../utils/santaFeArea");
const { parseBirthdate } = require("../utils/birthdate");
const { parseAddress } = require("../utils/address");
const { passwordProblem, fullNameProblem } = require("../utils/validation");

const COUNT = 100;
const PASSWORD = "TestUser@2026";
const EMAIL_DOMAIN = "example.com";
const CONTACT_PREFIX = "+63900";

const FIRST = ["Juan", "Maria", "Jose", "Ana", "Pedro", "Rosa", "Miguel", "Carmen", "Antonio", "Lourdes",
    "Ramon", "Teresita", "Eduardo", "Josefina", "Roberto", "Elena", "Fernando", "Cristina", "Ricardo", "Marites",
    "Danilo", "Rowena", "Rogelio", "Maricel", "Ernesto", "Jocelyn", "Alfredo", "Rachelle", "Arnel", "Liza",
    "Mark", "Angelica", "John Paul", "Kristine", "Christian", "Princess", "Jericho", "Bea", "Paolo", "Jasmine",
    "Carlo", "Nicole", "Rafael", "Patricia", "Gabriel", "Andrea", "Joshua", "Camille", "Adrian", "Shiela"];
const LAST = ["Dela Cruz", "Santos", "Reyes", "Garcia", "Mendoza", "Bautista", "Villanueva", "Ramos", "Aquino", "Castillo",
    "Navarro", "Francisco", "Torres", "Gonzales", "Flores", "Rivera", "Domingo", "Mercado", "Aguilar", "Pascual",
    "Salazar", "Manalo", "Soriano", "Tolentino", "Valdez", "De Leon", "Cruz", "Lopez", "Ocampo", "Bernardo"];
const STREETS = ["Sampaguita St.", "Ilang-Ilang St.", "Rosal St.", "Gumamela St.", "Camia St.", "Dama de Noche St.",
    "Mabini St.", "Rizal St.", "Bonifacio St.", "Luna St.", "Del Pilar St.", "Aguinaldo St.", "Narra St.", "Molave St.", "Acacia St."];
const AREAS = ["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5", "Purok 6", "Purok 7", ""];
const ID_TYPES = ["Barangay ID", "PhilSys National ID", "Voter's ID or Certification", "Driver's License", "Postal ID", "UMID", "School ID"];

// Same accounts every run (seeded random numbers), so a second run adds nothing.
let seed = 20261124;
const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = (list) => list[Math.floor(rand() * list.length)];
const pad = (n, len = 2) => String(n).padStart(len, "0");
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");

// A spot inside Barangay Santa Fe for the home pin.
const lats = SANTA_FE_BOUNDARY.map((p) => p[0]);
const lngs = SANTA_FE_BOUNDARY.map((p) => p[1]);
const homePin = () => {
    for (;;) {
        const lat = Math.min(...lats) + rand() * (Math.max(...lats) - Math.min(...lats));
        const lng = Math.min(...lngs) + rand() * (Math.max(...lngs) - Math.min(...lngs));
        if (isWithinSantaFe(lat, lng)) return { lat: Number(lat.toFixed(7)), lng: Number(lng.toFixed(7)) };
    }
};

const statusFor = (i) => (i < 70 ? "Active" : i < 85 ? "Pending" : i < 93 ? "Suspended" : "Closed");

const buildUsers = () => {
    const names = new Set();
    const users = [];
    for (let i = 0; users.length < COUNT; i++) {
        const first = FIRST[i % FIRST.length];
        const last = pick(LAST);
        const fullName = `${first} ${String.fromCharCode(65 + Math.floor(rand() * 26))}. ${last}`;
        if (names.has(`${first} ${last}`)) continue;
        names.add(`${first} ${last}`);
        const n = users.length;
        const username = `${slug(first)}.${slug(last)}${pad(n + 1)}`;
        const age = 16 + Math.floor(rand() * 60);
        const birthdate = `${2026 - age}-${pad(1 + Math.floor(rand() * 12))}-${pad(1 + Math.floor(rand() * 28))}`;
        const status = statusFor(n);
        users.push({
            fullName,
            username,
            email: `${username}@${EMAIL_DOMAIN}`,
            contact: `${CONTACT_PREFIX}${pad(1000000 + n * 7919 % 9000000, 7)}`,
            address: { houseNumber: `Blk ${1 + Math.floor(rand() * 20)} Lot ${1 + Math.floor(rand() * 40)}`, street: pick(STREETS), area: pick(AREAS) },
            birthdate,
            homeLocation: homePin(),
            status,
            verificationStatus: status === "Pending" ? "Pending" : "Approved",
            idType: pick(ID_TYPES),
            daysAgo: Math.floor(rand() * 120) + (status === "Pending" ? 0 : 2)
        });
    }
    return users;
};

// A plain sample ID card (PNG) for the Pending accounts, so Account
// Verification has something to open. Clearly not a real ID.
const samplePng = (() => {
    let cache = null;
    const crc32 = (buf) => {
        let c, crc = 0xffffffff;
        for (let n = 0; n < buf.length; n++) {
            c = (crc ^ buf[n]) & 0xff;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            crc = (crc >>> 8) ^ c;
        }
        return (crc ^ 0xffffffff) >>> 0;
    };
    const chunk = (type, data) => {
        const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
        const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
        const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
        return Buffer.concat([len, body, crc]);
    };
    return () => {
        if (cache) return cache;
        const w = 480, h = 300;
        const rows = [];
        for (let y = 0; y < h; y++) {
            const row = Buffer.alloc(1 + w * 3);
            for (let x = 0; x < w; x++) {
                let rgb = [232, 240, 250]; // card
                if (y < 56) rgb = [107, 44, 62]; // header band
                else if (x > 28 && x < 148 && y > 84 && y < 244) rgb = [190, 198, 210]; // photo box
                else if (x > 176 && x < 450 && [100, 136, 172, 208].some((t) => y > t && y < t + 14)) rgb = [160, 170, 185]; // text lines
                if (x < 3 || y < 3 || x >= w - 3 || y >= h - 3) rgb = [107, 44, 62];
                row.set(rgb, 1 + x * 3);
            }
            rows.push(row);
        }
        const ihdr = Buffer.alloc(13);
        ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
        cache = Buffer.concat([
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
            chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(Buffer.concat(rows))), chunk("IEND", Buffer.alloc(0))
        ]);
        return cache;
    };
})();

// Every account passes the sign-up form's own checks.
const checkUser = (u) => fullNameProblem(u.fullName)
    || parseAddress(u.address).error
    || parseBirthdate(u.birthdate).error
    || (!isWithinSantaFe(u.homeLocation.lat, u.homeLocation.lng) && "home pin outside Santa Fe")
    || (!/^\+63\d{10}$/.test(u.contact) && "contact number format")
    || null;

const testAccountWhere = `email_address LIKE ? AND contact_number LIKE ?`;
const testAccountArgs = [`%@${EMAIL_DOMAIN}`, `${CONTACT_PREFIX}%`];

async function remove() {
    const [result] = await db.query(`DELETE FROM registered_users WHERE role = 'resident' AND ${testAccountWhere}`, testAccountArgs);
    console.log(`Removed ${result.affectedRows} test account(s).`);
}

async function add(dryRun) {
    const pwProblem = passwordProblem(PASSWORD);
    if (pwProblem) throw new Error(pwProblem);
    const users = buildUsers();
    users.forEach((u) => { const p = checkUser(u); if (p) throw new Error(`${u.username}: ${p}`); });

    await User.ensureVerificationColumns();
    await User.ensureArchiveColumn();
    await ResidentIdDocument.ensureTable();

    const [existing] = await db.query(
        `SELECT email_address, username FROM registered_users WHERE email_address IN (?) OR username IN (?)`,
        [users.map((u) => u.email), users.map((u) => u.username)]
    );
    const taken = new Set(existing.flatMap((r) => [String(r.email_address).toLowerCase(), String(r.username || "").toLowerCase()]));
    const toAdd = users.filter((u) => !taken.has(u.email.toLowerCase()) && !taken.has(u.username.toLowerCase()));
    console.log(`${users.length} test accounts; ${users.length - toAdd.length} already there; adding ${toAdd.length}.`);
    if (dryRun) {
        console.table(toAdd.slice(0, 10).map(({ fullName, username, email, contact, status }) => ({ fullName, username, email, contact, status })));
        return;
    }

    const hash = await bcrypt.hash(PASSWORD, 10);
    const counts = {};
    for (const u of toAdd) {
        const id = await User.create({ ...u, password: hash, role: "resident" });
        await db.query(
            `UPDATE registered_users
             SET created_at = DATE_SUB(NOW(), INTERVAL ? DAY),
                 verified_at = IF(verification_status = 'Approved', DATE_SUB(NOW(), INTERVAL ? DAY), NULL)
             WHERE id = ?`,
            [u.daysAgo, Math.max(0, u.daysAgo - 1), id]
        );
        if (u.verificationStatus === "Pending") {
            await ResidentIdDocument.save(id, { idType: u.idType, fileName: "SAMPLE-TEST-ID.png", mimeType: "image/png", data: samplePng() });
        }
        counts[u.status] = (counts[u.status] || 0) + 1;
    }
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM registered_users WHERE ${testAccountWhere}`, testAccountArgs);
    console.log("Added:", counts, `| test accounts now in the database: ${total}`);
}

(async () => {
    const args = process.argv.slice(2);
    console.log(`Database: ${process.env.DB_NAME} on ${process.env.DB_HOST}`);
    try {
        if (args.includes("--remove")) await remove();
        else await add(args.includes("--dry-run"));
    } catch (err) {
        console.error("Failed:", err.message);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
})();
