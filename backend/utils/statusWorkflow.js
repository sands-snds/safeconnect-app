// Shared, strict forward-only status workflow used by emergency reports,
// assistance requests, and petty crime reports. A report can only move to
// the very next status in this order -- never backward, never skipped.
const STATUS_ORDER = ["Received", "In Progress", "Resolved"];

// Officials and Admins can also dismiss a report that isn't resolved yet (a
// repeat report, a prank, a known false accusation) instead of escalating
// the reporter's account. A reason is required and is sent to the reporter.
// Dismissed is final, like Resolved.
const DISMISSED = "Dismissed";
const CLOSED_STATUSES = ["Resolved", DISMISSED];
const DISMISSAL_REASON_MIN = 5;
const DISMISSAL_REASON_MAX = 500;

// Canned auto-reply sent to the reporter when their report's status changes.
// Keyed by the status being moved INTO.
const STATUS_MESSAGES = {
    "In Progress": "Update on your report: help is on the way. Our responders have received your report and are on their way.",
    "Resolved": "Your report has been marked as resolved. Thank you for helping keep our community safe."
};

// Throws with a user-facing message if the transition isn't allowed.
// Returns the canned reply message for the new status (or null if none).
const validateStatusTransition = (currentStatus, newStatus) => {
    if (currentStatus === DISMISSED) {
        throw new Error("This report was dismissed, so its status can't be changed.");
    }
    if (newStatus === DISMISSED) {
        if (currentStatus === "Resolved") {
            throw new Error("A resolved report can't be dismissed.");
        }
        return null; // the controller sends the reason instead (dismissalMessage)
    }

    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    const newIndex = STATUS_ORDER.indexOf(newStatus);

    if (newIndex === -1) {
        throw new Error(`"${newStatus}" is not a valid status.`);
    }

    if (currentIndex === -1) {
        // Existing report has a legacy status (e.g. "Dispatched", "Cancelled")
        // from before this workflow -- allow moving it forward into the new
        // 3-step flow starting from the beginning.
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

// Checks the reason sent with a dismissal. Returns the trimmed reason, or
// throws with a user-facing message.
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

// The notification the reporter gets when their report is dismissed.
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
