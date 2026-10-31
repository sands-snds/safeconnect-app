




const passwordProblem = (password) => {
    if (typeof password !== "string" || password.length < 8) return "Password must be at least 8 characters.";
    if (password.length > 128) return "Password must be 128 characters or fewer.";
    if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter.";
    if (!/[0-9]/.test(password)) return "Password must include a number.";
    if (!/[^A-Za-z0-9]/.test(password)) return "Password must include a symbol (e.g. ! @ # $ %).";
    return null;
};



const NAME_PATTERN = /^\p{L}[\p{L}\s.'-]*$/u;

const normalizeName = (name) => String(name || "").trim().replace(/\s+/g, " ");

const fullNameProblem = (name) => {
    const clean = normalizeName(name);
    if (clean.length < 2) return "Please enter your full name.";
    if (clean.length > 100) return "Full name must be 100 characters or fewer.";
    if (!NAME_PATTERN.test(clean)) return "Full name can only contain letters, spaces, periods, apostrophes and hyphens.";
    return null;
};

module.exports = { passwordProblem, fullNameProblem, normalizeName };
