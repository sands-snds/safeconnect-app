const jwt = require("jsonwebtoken");

// Ordinary sign-in: short-lived, kept only for the browser session on the
// frontend (sessionStorage). "Save Login Info" swaps it for a 30-day token
// tied to a revocable remembered_logins row (models/RememberedLogin.js).
const SESSION_EXPIRY = "12h";
const REMEMBERED_EXPIRY = "30d";

// rememberedId: the remembered_logins row id, for a saved login.
const generateToken = (user, { rememberedId } = {}) => {

    return jwt.sign(
        {
            id: user.id,
            role: user.role,
            ...(rememberedId ? { jti: rememberedId } : {})
        },
        process.env.JWT_SECRET,
        {
            expiresIn: rememberedId ? REMEMBERED_EXPIRY : SESSION_EXPIRY
        }
    );

};

module.exports = {
    generateToken
};
