export const USER_ROLES = [
    { value: "resident", label: "Resident" },
    { value: "admin", label: "Admin" },
    { value: "super_admin", label: "Super Admin" }
];

const ROLE_COLORS = {
    super_admin: { bg: "#3b0d1b", color: "#fff" },
    admin:    { bg: "#6B2C3E", color: "#fff" },
    resident: { bg: "#eef2ff", color: "#3730a3" }
};

export default function UserRoleSelect({
    value,
    onChange,
    disabled
}) {
    const colors = ROLE_COLORS[value] || ROLE_COLORS.resident;

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
            {USER_ROLES.map((r) => (
                <option key={r.value} value={r.value} style={{ background: "#fff", color: "#111827" }}>
                    {r.label}
                </option>
            ))}
        </select>
    );
}
