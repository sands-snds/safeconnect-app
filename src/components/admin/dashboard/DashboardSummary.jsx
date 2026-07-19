export default function DashboardSummary({
    emergencyReports = [],
    assistanceRequests = [],
    pettyCrimeReports = [],
    onNavigate
}) {
    const totalReports =
        emergencyReports.length +
        assistanceRequests.length +
        pettyCrimeReports.length;

    return (
        <div
            style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "28px 32px",
                marginBottom: "24px",
                boxShadow: "0 4px 12px rgba(0,0,0,.08)",
                border: "1px solid #e5e7eb"
            }}
        >
            {/* Top Row */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                    flexWrap: "wrap",
                    gap: "16px"
                }}
            >
                <div>
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
                        SafeConnect Admin
                    </span>

                    <h1
                        style={{
                            margin: 0,
                            fontSize: "2rem",
                            fontWeight: 700
                        }}
                    >
                        Welcome back, Administrator 👋
                    </h1>
                </div>

                <button
                    className="button button-primary"
                    onClick={() =>
                        onNavigate("create-announcement")
                    }
                >
                    + Create Announcement
                </button>
            </div>

            {/* Bottom Row */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "24px"
                }}
            >
                <p
                    style={{
                        color: "#6b7280",
                        maxWidth: "650px",
                        lineHeight: 1.7,
                        margin: 0
                    }}
                >
                    Monitor emergency incidents, assistance requests,
                    petty crime reports, and community announcements
                    from one centralized dashboard.
                </p>

                <div style={{
                        minWidth: "220px",
                        background: "#6B2C3E",
                        color: "#fff",
                        borderRadius: "14px",
                        padding: "24px",
                        textAlign: "center"
                    }}>
                    <div style={{ fontSize: "3rem", fontWeight: "bold" }}                  >
                        {totalReports}
                    </div>
                    <div>Total Reports</div>
                </div>
            </div>
        </div>
    );
}