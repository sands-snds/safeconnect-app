const User = require("../models/User");
const ResidentIdDocument = require("../models/ResidentIdDocument");
const Notification = require("../models/Notification");
const { sendVerificationResultEmail } = require("../services/emailService");
const { notifyAdmins } = require("../services/liveUpdates");
const { sendServerError } = require("../utils/dbErrors");

const STATUSES = ["Pending", "Approved", "Rejected"];
const REASON_MIN = 5;
const REASON_MAX = 500;

// GET /users/verifications?status=Pending|Approved|Rejected (all when left out)
exports.list = async (req, res) => {
    try {
        const status = STATUSES.includes(req.query.status) ? req.query.status : null;
        res.json(await User.getVerifications(status));
    } catch (err) {
        sendServerError(res, err, "listVerifications", "Could not load the registrations.");
    }
};

// GET /users/:id/valid-id: the uploaded ID itself, for staff only. Never
// cached, and sent with its checked type so the browser can't be talked
// into running it.
exports.getIdDocument = async (req, res) => {
    try {
        const doc = await ResidentIdDocument.findByUser(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: "This account has no uploaded ID." });
        res.set({
            "Content-Type": doc.mime_type,
            "Content-Length": doc.file_size,
            "Content-Disposition": `inline; filename="${String(doc.file_name || "valid-id").replace(/"/g, "")}"`,
            "Cache-Control": "no-store, private",
            "X-Content-Type-Options": "nosniff"
        });
        res.end(doc.data);
    } catch (err) {
        sendServerError(res, err, "getIdDocument", "Could not load the uploaded ID.");
    }
};

// PATCH /users/:id/verification { decision: "approve" | "reject", reason }
exports.decide = async (req, res) => {
    try {
        const { decision } = req.body;
        if (decision !== "approve" && decision !== "reject") {
            return res.status(400).json({ success: false, message: "Choose to approve or reject the account." });
        }
        const approved = decision === "approve";
        const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";
        if (!approved && (reason.length < REASON_MIN || reason.length > REASON_MAX)) {
            return res.status(400).json({
                success: false,
                message: `Give a reason of ${REASON_MIN}–${REASON_MAX} characters so the resident knows what to fix.`
            });
        }

        const user = await User.findByIdWithPassword(req.params.id);
        if (!user || user.role !== "resident" || !user.verification_status) {
            return res.status(404).json({ success: false, message: "Registration not found." });
        }
        if (user.verification_status !== "Pending") {
            return res.status(409).json({ success: false, message: `This registration was already ${user.verification_status.toLowerCase()}.` });
        }

        const changed = await User.setVerification(user.id, { approved, note: approved ? null : reason, adminId: req.admin.id });
        if (!changed) return res.status(409).json({ success: false, message: "Another staff member just reviewed this registration." });
        // A rejected applicant's ID isn't needed any more (they sign up again
        // with a new one), so it isn't kept.
        if (!approved) await ResidentIdDocument.deleteForUser(user.id);

        if (approved) {
            Notification.create({
                userId: user.id,
                title: "Your account is verified",
                message: "Welcome to SafeConnect! The barangay confirmed that you are a resident of Barangay Santa Fe.",
                notificationType: "account_verified",
                referenceId: user.id
            }).catch((err) => console.error("Verification notification failed:", err));
        }
        sendVerificationResultEmail(user.email_address, user.full_name, { approved, reason }).catch((err) =>
            console.error("Verification email failed:", err)
        );
        notifyAdmins("admin-notifications");

        res.json({ success: true, status: approved ? "Approved" : "Rejected" });
    } catch (err) {
        sendServerError(res, err, "decideVerification", "Could not save the decision. Please try again.");
    }
};
