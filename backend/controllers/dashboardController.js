const Dashboard = require("../models/Dashboard");

exports.getDashboard = async (req, res) => {
    try {
        const data = await Dashboard.getStatistics();
        res.json({
            success: true,
            data
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Unable to load dashboard."
        });
    }
};