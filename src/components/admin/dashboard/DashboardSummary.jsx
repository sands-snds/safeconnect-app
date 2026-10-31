import AdminStats from "../layout/AdminStats";
import { tx } from "../../../i18n/adminText";

// Dashboard top card: welcome line, then the counters (AdminStats), which
// also hold Create Announcement and Total Reports. dash-summary-* classes:
// sizes and the phone layout in styles/admin.css.
export default function DashboardSummary({
    adminName = "Administrator",
    ...stats
}) {
    return (
        <div
            className="dash-summary"
            style={{
                background: "#fff",
                borderRadius: "16px",
                marginBottom: "24px",
                boxShadow: "0 4px 12px rgba(0,0,0,.08)",
                border: "1px solid #e5e7eb"
            }}
        >
            <div style={{ marginBottom: "20px" }}>
                <span
                    style={{
                        display: "inline-block",
                        background: "#FDECEC",
                        color: "#B91C1C",
                        padding: "6px 14px",
                        borderRadius: "999px",
                        fontWeight: 600,
                        fontSize: ".85rem",
                        marginBottom: "12px"
                    }}
                >
                    {tx("SafeConnect Admin")}
                </span>

                <h1
                    className="dash-summary-title"
                    style={{
                        margin: 0,
                        fontWeight: 700
                    }}
                >
                    {tx("Welcome back, {{name}} 👋", { name: adminName })}
                </h1>

                <p
                    className="dash-summary-intro"
                    style={{
                        // One line on computers (no width cap); wraps only on narrower screens.
                        color: "#6b7280",
                        fontSize: "14.5px",
                        lineHeight: 1.6,
                        margin: "6px 0 0"
                    }}
                >
                    {tx("Monitor emergency incidents, assistance requests, petty crime reports, and community announcements from one centralized dashboard.")}
                </p>
            </div>

            <AdminStats {...stats} />
        </div>
    );
}
