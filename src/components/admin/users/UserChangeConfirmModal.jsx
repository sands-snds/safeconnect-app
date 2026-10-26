import React from "react";
import { ROLE_LABELS } from "../../shared/roles";

// Confirmation dialog for Users tab changes (role promotion/demotion and
// account status). Same look as shared/StatusConfirmModal.jsx.
const CONSEQUENCES = {
    role: {
        super_admin: "As an Admin, they'll get full access to the admin panel, including the System tabs (users, logs, site contacts). This applies on their next action; no re-login needed.",
        admin: "As an Official, they'll be able to handle reports and announcements, but not the System tabs (users, logs, site contacts). This applies on their next action; no re-login needed.",
        resident: "They'll lose access to the admin panel immediately and go back to being a regular resident account."
    },
    status: {
        Active: "They'll be able to sign in normally.",
        Pending: "They won't be able to sign in until their account is set back to Active.",
        Suspended: "They won't be able to sign in until their account is set back to Active. They'll be asked to contact the barangay administrator.",
        Closed: "The account is closed for good: they won't be able to sign in anymore, and they'll be told the account can no longer be used."
    }
};

const LABELS = ROLE_LABELS;
const ROLE_RANK = { resident: 0, admin: 1, super_admin: 2 };

const UserChangeConfirmModal = ({ change, onConfirm, onCancel, isSubmitting, error }) => {
    if (!change) return null;

    const { user, field, value } = change;
    const displayValue = LABELS[value] || value;
    const isPromotion = field === "role" && (ROLE_RANK[value] ?? 0) > (ROLE_RANK[user.role] ?? 0);

    const title = field === "role"
        ? `${isPromotion ? "Promote" : "Change"} ${user.fullName || user.email} to ${displayValue}?`
        : `Set ${user.fullName || user.email}'s status to "${displayValue}"?`;

    return (
        <div
            onClick={isSubmitting ? undefined : onCancel}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: "24px",
                    width: 400,
                    maxWidth: "90vw"
                }}
            >
                <h3 style={{ margin: "0 0 8px", fontSize: 17 }}>
                    {title}
                </h3>

                <p style={{ margin: "0 0 6px", fontSize: 13, color: "#6b7280" }}>
                    {user.email}
                </p>

                <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "#4b5563" }}>
                    {CONSEQUENCES[field]?.[value]}
                </p>

                {error && (
                    <p style={{ margin: "0 0 14px", fontSize: 13, color: "#dc2626" }}>
                        {error}
                    </p>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="button button-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="button button-primary"
                    >
                        {isSubmitting ? "Saving…" : isPromotion ? "Promote" : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserChangeConfirmModal;
