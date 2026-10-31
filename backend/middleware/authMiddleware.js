const jwt = require("jsonwebtoken");
const db = require("../config/db");
const User = require("../models/User");
const RememberedLogin = require("../models/RememberedLogin");
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

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: "Invalid token."
            });
        }

        
        
        
        
        
        try {
            const account = await User.findById(decoded.id);
            if (!account || (account.status && account.status !== "Active")) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token.",
                    code: account ? "ACCOUNT_INACTIVE" : "ACCOUNT_NOT_FOUND"
                });
            }
            
            
            
            if (decoded.jti && !(await RememberedLogin.isValid(decoded.jti, decoded.id))) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token.",
                    code: "LOGIN_REVOKED"
                });
            }
            req.user = decoded;
            req.account = account;
            next();
        } catch (dbErr) {
            console.error("verifyToken error:", dbErr);
            return res.status(500).json({ success: false, message: "Internal server error." });
        }
    });
};





const attachUserIfPresent = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();

    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (!err) req.user = decoded;
        next();
    });
};






const verifyAdmin = async (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({
            success: false,
            message: "Only barangay Officials and Admins can do this."
        });
    }

    try {
        const admin = await User.findById(req.user.id);

        if (!admin || !isAdminRole(admin.role) || (admin.status && admin.status !== "Active")) {
            return res.status(403).json({
                success: false,
                message: "Only barangay Officials and Admins can do this."
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




const verifySuperAdmin = (req, res, next) => {
    if (!req.admin || !isSuperAdminRole(req.admin.role)) {
        return res.status(403).json({
            success: false,
            message: "Only Admins can do this."
        });
    }
    next();
};




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



const hasActiveRole = async (userId, level) => {
    const requester = await User.findById(userId);
    if (!requester || (requester.status && requester.status !== "Active")) return false;
    return level === "super" ? isSuperAdminRole(requester.role) : isAdminRole(requester.role);
};




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





const reportAsSignedInUser = (req, res, next) => {
    const account = req.account;
    req.body = {
        ...req.body,
        userId: account.id,
        name: account.full_name,          // emergency_reports.reporter_name
        fullname: account.full_name,      // assistance / petty crime
        contact: account.contact_number,
        email: account.email_address
    };
    next();
};

module.exports = {
    verifyToken,
    reportAsSignedInUser,
    attachUserIfPresent,
    verifyAdmin,
    verifySuperAdmin,
    verifySelfOrAdmin,
    verifyReportAccess,
    verifySelfOrAnyAdmin
};