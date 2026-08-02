const jwt = require("jsonwebtoken");

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

const verifyAdmin = (req, res, next) => {

    if (!req.user || req.user.role !== "admin") {

        return res.status(403).json({
            success: false,
            message: "Admin access only."
        });

    }

    next();
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