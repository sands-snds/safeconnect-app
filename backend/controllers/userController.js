const User = require("../models/User");

exports.getUsers = async (req, res) => {
    try {
        const users = await User.getAll();
        return res.json(users);
    }

    catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve users."
        });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await User.updateStatus(id, status);
        return res.json({
            success: true,
            message: "User status updated."
        });
    }

    catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to update user."
        });
    }
};