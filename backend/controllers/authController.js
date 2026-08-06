const bcrypt = require("bcrypt");
const User = require("../models/User");
const { generateToken } = require("../utils/jwt");


/* =========================================================
 SIGN UP CONTROLLER
============================================================*/
exports.signup = async (req, res) => {
    try {
        const {
            fullName,
            username,
            contact,
            email,
            password
        } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be filled."
            });
        }

        const emailExists = await User.findByEmail(email);
        
        if (emailExists) {
            return res.json({
                success: false,
                message: "An account with this email already exists."
            });
        }
        if (username) {
            const usernameExists = await User.findByUsername(username);
            if (usernameExists) {
                return res.json({
                    success: false,
                    message: "Username is already taken."
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            fullName,
            username,
            contact,
            email,
            password: hashedPassword,
            role: "resident"  // Default role for new users
        });
        return res.json({
            success: true,
            message: "Account created successfully."
        });

    } catch (error) {
        console.error("Signup Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
            code: error.code,
            error
        });
    }
};

/* =========================================================
                    SIGN IN CONTROLLER
============================================================*/

exports.signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const user = await User.findByEmail(email);

        if (!user) {
            await User.logSignin(
                "Unknown User",
                email,
                "Failed"
            );

            return res.json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            await User.logSignin(
                user.full_name,
                email,
                "Failed"
            );

            return res.json({
                success: false,
                message: "Invalid email or password."
            });
        }

        if (user.status && user.status !== "Active") {
            await User.logSignin(
                user.full_name,
                email,
                "Failed"
            );

            const STATUS_MESSAGES = {
                "Pending": "Your account is still pending approval.",
                "Suspended": "Your account has been suspended. Please contact an administrator.",
                "Closed": "This account has been closed."
            };

            return res.json({
                success: false,
                message: STATUS_MESSAGES[user.status] || "Your account cannot sign in right now."
            });
        }

        await User.logSignin(
            user.full_name,
            email,
            "Success"
        );

        if (user.role === "admin") {
            await User.logAdminSignin(email);
        }

        const token = generateToken(user);

        return res.json({
            success: true,
            isAdmin: user.role === "admin",
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                username: user.username,
                contact: user.contact_number,
                email: user.email_address,
                role: user.role
            },
            message: "Login successful"
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};