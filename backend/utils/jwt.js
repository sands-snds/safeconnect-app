const jwt = require("jsonwebtoken");




const SESSION_EXPIRY = "12h";
const REMEMBERED_EXPIRY = "30d";


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
