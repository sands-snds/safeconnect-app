const Log = require("../models/Log");

exports.getSigninLogs = async (req, res) => {
    try {
        const logs = await Log.getSigninLogs();
        return res.json(logs);
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve sign-in logs."
        });
    }
};

exports.getAdminLogs = async (req, res) => {
    try {
        const logs = await Log.getAdminLogs();
        return res.json(logs);
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve admin logs."
        });
    }
};