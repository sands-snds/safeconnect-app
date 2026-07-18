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

    if (req.user.role !== "Admin") {

        return res.status(403).json({
            success: false,
            message: "Admin access only."
        });

    }

    next();
};

module.exports = {
    verifyToken,
    verifyAdmin
};