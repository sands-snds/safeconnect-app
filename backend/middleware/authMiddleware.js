const jwt = require("jsonwebtoken");
const db = require("../config/db");
const User = require("../models/User");
const adminPresence = require("../services/adminPresence");
const { isAdminRole, isSuperAdminRole } = require("../utils/roles");

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
// Lets in both admins and super admins; see verifySuperAdmin for System tabs.
const verifyAdmin = async (req, res, next) => {

    if (!req.user) {
        return res.status(403).json({
            success: false,
            message: "Admin access only."
        });
    }

    try {
        const admin = await User.findById(req.user.id);

        if (!admin || !isAdminRole(admin.role) || (admin.status && admin.status !== "Active")) {
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

// System tabs (users, sign-in logs, admin logs, settings) and other
// account-wide actions. Must run after verifyAdmin, which loads req.admin
// from the database.
const verifySuperAdmin = (req, res, next) => {
    if (!req.admin || !isSuperAdminRole(req.admin.role)) {
        return res.status(403).json({
            success: false,
            message: "Super admin access only."
        });
    }
    next();
};

// Allows anyone to manage their own profile (photo/username/password),
// and a super admin to manage any account. Checks the database rather than
// the token's role claim, for the same reason as verifyAdmin.
const verifySelfOrAdmin = async (req, res, next) => {

    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided."
        });
    }

    const isSelf = String(req.user.id) === String(req.params.id);
    if (isSelf) return next();

    try {
        if (!await hasActiveRole(req.user.id, "super")) {
            return res.status(403).json({
                success: false,
                message: "You can only manage your own account."
            });
        }

        next();
    } catch (err) {
        console.error("verifySelfOrAdmin error:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// Loads the signed-in account from the database and checks it against
// `level`: "admin" (admin or super admin) or "super" (super admin only).
const hasActiveRole = async (userId, level) => {
    const requester = await User.findById(userId);
    if (!requester || (requester.status && requester.status !== "Active")) return false;
    return level === "super" ? isSuperAdminRole(requester.role) : isAdminRole(requester.role);
};

// For a single report (/:id on emergency_reports, assistance_requests,
// petty_crimes): lets through the resident who submitted it, or an admin
// at `level` ("admin" to view, "super" to edit/delete).
const verifyReportAccess = (table, level) => async (req, res, next) => {
    try {
        const [[report]] = await db.query(
            `SELECT reporter_id FROM ${table} WHERE id = ?`,
            [req.params.id]
        );
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found." });
        }

        const isOwner = report.reporter_id != null
            && String(report.reporter_id) === String(req.user.id);

        if (isOwner || await hasActiveRole(req.user.id, level)) return next();

        return res.status(403).json({
            success: false,
            message: "You can only manage your own reports."
        });
    } catch (err) {
        console.error("verifyReportAccess error:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// A resident's own report list (/reports/user/:userId), or any admin.
const verifySelfOrAnyAdmin = async (req, res, next) => {
    try {
        if (String(req.user.id) === String(req.params.userId)) return next();
        if (await hasActiveRole(req.user.id, "admin")) return next();
        return res.status(403).json({ success: false, message: "You can only view your own reports." });
    } catch (err) {
        console.error("verifySelfOrAnyAdmin error:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = {
    verifyToken,
    verifyAdmin,
    verifySuperAdmin,
    verifySelfOrAdmin,
    verifyReportAccess,
    verifySelfOrAnyAdmin
};