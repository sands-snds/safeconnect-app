const jwt = require("jsonwebtoken");
const User = require("../models/User");
const adminPresence = require("../services/adminPresence");

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided."
        });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {

        if (err) {
            return res.status(403).json({
                success: false,
                message: "Invalid token."
            });
        }

        req.user = decoded;

        next();
    });
};

// Checks the role against the database rather than trusting the token's
// role claim -- tokens last 7 days, so otherwise a demoted/suspended admin
// would keep admin access (and a newly promoted one wouldn't get it) until
// their token expired. Attaches the admin's row as req.admin for activity logging.
const verifyAdmin = async (req, res, next) => {

    if (!req.user) {
        return res.status(403).json({
            success: false,
            message: "Admin access only."
        });
    }

    try {
        const admin = await User.findById(req.user.id);

        if (!admin || admin.role !== "admin" || (admin.status && admin.status !== "Active")) {
            return res.status(403).json({
                success: false,
                message: "Admin access only."
            });
        }

        req.admin = admin;
        adminPresence.touch(admin.id);

        next();
    } catch (err) {
        console.error("verifyAdmin error:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// Allows a resident to manage their own profile (photo/username/password),
// while still letting an admin manage any account.
const verifySelfOrAdmin = (req, res, next) => {

    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided."
        });
    }

    const isSelf = String(req.user.id) === String(req.params.id);

    if (!isSelf && req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "You can only manage your own account."
        });
    }

    next();
};

module.exports = {
    verifyToken,
    verifyAdmin,
    verifySelfOrAdmin
};