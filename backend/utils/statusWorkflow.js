const STATUS_ORDER = ["Received", "In Progress", "Resolved"];

const DISMISSED = "Dismissed";
const CLOSED_STATUSES = ["Resolved", DISMISSED];
const DISMISSAL_REASON_MIN = 5;
const DISMISSAL_REASON_MAX = 500;

const STATUS_MESSAGES = {
    "In Progress": "Update on your report: help is on the way. Our responders have received your report and are on their way.",
    "Resolved": "Your report has been marked as resolved. Thank you for helping keep our community safe."
};

const validateStatusTransition = (currentStatus, newStatus) => {
    if (currentStatus === DISMISSED) {
        throw new Error("This report was dismissed, so its status can't be changed.");
    }
    if (newStatus === DISMISSED) {
        if (currentStatus === "Resolved") {
            throw new Error("A resolved report can't be dismissed.");
        }
        return null;
    }

    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    const newIndex = STATUS_ORDER.indexOf(newStatus);

    if (newIndex === -1) {
        throw new Error(`"${newStatus}" is not a valid status.`);
    }

    if (currentIndex === -1) {
        if (newIndex !== 0) {
            throw new Error(`This report must first be moved to "${STATUS_ORDER[0]}".`);
        }
    } else if (newIndex !== currentIndex + 1) {
        if (newIndex <= currentIndex) {
            throw new Error(`Status cannot be moved backward from "${currentStatus}" to "${newStatus}".`);
        }
        throw new Error(`Status must move to "${STATUS_ORDER[currentIndex + 1]}" next, not "${newStatus}".`);
    }

    return STATUS_MESSAGES[newStatus] || null;
};

const validateDismissalReason = (reason) => {
    const text = typeof reason === "string" ? reason.trim() : "";
    if (text.length < DISMISSAL_REASON_MIN) {
        throw new Error(`Please give a reason for dismissing this report (at least ${DISMISSAL_REASON_MIN} characters).`);
    }
    if (text.length > DISMISSAL_REASON_MAX) {
        throw new Error(`The reason can be up to ${DISMISSAL_REASON_MAX} characters.`);
    }
    return text;
};

const dismissalMessage = (reason) =>
    `Your report was dismissed by the barangay. Reason: ${reason} If you think this is a mistake, please contact the barangay.`;

module.exports = {
    STATUS_ORDER,
    STATUS_MESSAGES,
    DISMISSED,
    CLOSED_STATUSES,
    validateStatusTransition,
    validateDismissalReason,
    dismissalMessage
};
