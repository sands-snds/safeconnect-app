export default function DashboardAlerts({
    emergencyReports = [],
    assistanceRequests = [],
    pettyCrimeReports = []
}) {

    const emergencyPending =
        emergencyReports.filter(r => r.status !== "Resolved").length;

    const assistancePending =
        assistanceRequests.filter(r => r.status !== "Approved").length;

    const crimePending =
        pettyCrimeReports.filter(r => r.status !== "Resolved").length;

    return (
        <div className="dashboard-card">
            <h3>Alerts</h3>

            <div className="dashboard-alert-item">
                🚨 Emergency Reports Pending:
                <strong> {emergencyPending}</strong>
            </div>

            <div className="dashboard-alert-item">
                🤝 Assistance Requests Pending:
                <strong> {assistancePending}</strong>
            </div>

            <div className="dashboard-alert-item">
                🚔 Petty Crime Reports Pending:
                <strong> {crimePending}</strong>
            </div>
        </div>
    );
}