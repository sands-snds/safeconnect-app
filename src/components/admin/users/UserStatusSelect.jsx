// Account statuses the backend accepts (see ALLOWED_STATUSES in
// backend/controllers/userController.js).
export const USER_STATUSES = ["Active", "Pending", "Suspended", "Closed"];

const STATUS_COLORS = {
    Active:    { bg: "#d1fae5", color: "#065f46" },
    Pending:   { bg: "#fef3c7", color: "#92400e" },
    Suspended: { bg: "#fee2e2", color: "#991b1b" },
    Closed:    { bg: "#f3f4f6", color: "#374151" }
};

export default function UserStatusSelect({
    value,
    onChange,
    disabled
}) {
    const colors = STATUS_COLORS[value] || STATUS_COLORS.Closed;

    return (
        <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="form-select text-xs"
            style={{
                padding: "4px 8px",
                fontWeight: 600,
                background: colors.bg,
                color: colors.color,
                border: "1px solid transparent",
                borderRadius: 999,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.7 : 1
            }}
        >
            {USER_STATUSES.map((s) => (
                <option key={s} value={s} style={{ background: "#fff", color: "#111827" }}>{s}</option>
            ))}
        </select>
    );
}
