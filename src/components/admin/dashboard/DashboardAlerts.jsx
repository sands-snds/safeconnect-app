export default function DashboardAlerts({
    emergencyReports = [],
    assistanceRequests = [],
    pettyCrimeReports = []
}) {

    const emergencyPending =
        emergencyReports.filter(
            r => r.status !== "Resolved"
        ).length;

    const assistancePending =
        assistanceRequests.filter(
            r => r.status !== "Approved"
        ).length;

    const crimePending =
        pettyCrimeReports.filter(
            r => r.status !== "Resolved"
        ).length;

    const alerts = [
        {
            icon: "🚨",
            title: "Emergency Reports",
            count: emergencyPending,
            subtitle: "Immediate attention required",
            color: "#dc2626",
            background: "#fef2f2"
        },
        {
            icon: "🤝",
            title: "Assistance Requests",
            count: assistancePending,
            subtitle: "Waiting for barangay review",
            color: "#ca8a04",
            background: "#fefce8"
        },
        {
            icon: "🚔",
            title: "Petty Crime Reports",
            count: crimePending,
            subtitle: "Awaiting investigation",
            color: "#2563eb",
            background: "#eff6ff"
        }
    ];

    return (
        <div className="dashboard-card">

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "18px"
                }}
            >
                <span style={{ fontSize: "1.3rem" }}>
                    🔔
                </span>

                <h3 style={{ margin: 0 }}>
                    System Alerts
                </h3>
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px"
                }}
            >
                {alerts.map(alert => (
                    <div
                        key={alert.title}
                        style={{
                            background: alert.background,
                            borderLeft: `5px solid ${alert.color}`,
                            borderRadius: "12px",
                            padding: "16px 18px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontWeight: 600,
                                    marginBottom: "4px"
                                }}
                            >
                                {alert.icon} {alert.title}
                            </div>

                            <div
                                style={{
                                    fontSize: ".9rem",
                                    color: "#6b7280"
                                }}
                            >
                                {alert.subtitle}
                            </div>
                        </div>

                        <div
                            style={{
                                textAlign: "right"
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "2rem",
                                    fontWeight: "bold",
                                    color: alert.color
                                }}
                            >
                                {alert.count}
                            </div>

                            <div
                                style={{
                                    fontSize: ".85rem",
                                    color: "#6b7280"
                                }}
                            >
                                Pending
                            </div>
                        </div>

                    </div>
                ))}
            </div>

        </div>
    );
}