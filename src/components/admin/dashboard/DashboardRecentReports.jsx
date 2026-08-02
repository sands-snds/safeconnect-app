export default function DashboardRecentReports({
    emergencyReports = [],
    assistanceRequests = [],
    pettyCrimeReports = []
}) {

    const reports = [

        ...emergencyReports.map(r => ({
            type: "Emergency",
            reporter: r.reporter,
            date: r.date,
            status: r.status
        })),

        ...assistanceRequests.map(r => ({
            type: "Assistance",
            reporter: r.requester,
            date: r.date,
            status: r.status
        })),

        ...pettyCrimeReports.map(r => ({
            type: "Petty Crime",
            reporter: r.reporter,
            date: r.date,
            status: r.status
        }))
    ].slice(0, 5);
    return (
        <div className="dashboard-card">
            <h3>Recent Reports</h3>
            <table className="table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Name</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {reports.map((report, index) => (
                        <tr key={index}>
                            <td>{report.type}</td>
                            <td>{report.reporter}</td>
                            <td>{report.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}