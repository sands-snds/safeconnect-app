// Shared, strict forward-only status workflow used by emergency reports,
// assistance requests, and petty crime reports. A report can only move to
// the very next status in this order -- never backward, never skipped.
const STATUS_ORDER = ["Received", "In Progress", "Resolved"];

// Canned auto-reply sent to the reporter when their report's status changes.
// Keyed by the status being moved INTO.
const STATUS_MESSAGES = {
    "In Progress": "Update on your report: help is on the way. Our responders have received your report and are on their way.",
    "Resolved": "Your report has been marked as resolved. Thank you for helping keep our community safe."
};

// Throws with a user-facing message if the transition isn't allowed.
// Returns the canned reply message for the new status (or null if none).
const validateStatusTransition = (currentStatus, newStatus) => {
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

module.exports = { STATUS_ORDER, STATUS_MESSAGES, validateStatusTransition };
