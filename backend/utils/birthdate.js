// The birthdate asked for at sign-up. Only residents 15 years old and above
// can register; the sign-up form checks the same rule (src/components/landing).

const MIN_AGE = 15;
const MAX_AGE = 120;

// Today's date in the Philippines, as numbers.
const todayInManila = (now = new Date()) => {
    const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" })
        .format(now).split("-").map(Number);
    return { y, m, d };
};

// Whole years from the birthdate to today.
const ageOn = ({ y, m, d }, today) => today.y - y - (today.m < m || (today.m === m && today.d < d) ? 1 : 0);

// "YYYY-MM-DD" → { birthdate } or { error } (a message for the person).
const parseBirthdate = (value, now = new Date()) => {
    const text = typeof value === "string" ? value.trim() : "";
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return { error: "Please enter your birthdate." };
    const [y, m, d] = match.slice(1).map(Number);
    const check = new Date(Date.UTC(y, m - 1, d));
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) {
        return { error: "Please enter a valid birthdate." };
    }
    const today = todayInManila(now);
    const age = ageOn({ y, m, d }, today);
    if (age < 0) return { error: "Your birthdate can't be in the future." };
    if (age < MIN_AGE) return { error: `You must be at least ${MIN_AGE} years old to register.` };
    if (age > MAX_AGE) return { error: "Please enter a valid birthdate." };
    return { birthdate: text };
};

module.exports = { parseBirthdate, MIN_AGE };
