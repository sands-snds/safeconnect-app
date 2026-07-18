const DashboardOverview = ({
    emergencyReports,
    assistanceRequests,
    pettyCrimeReports,
    announcements
}) => {
    return (
        <div className="dashboard-overview">
            <h2>Today's Summary</h2>
            <ul>
                <li>
                    Emergency Reports:
                    {emergencyReports.length}
                </li>
                <li>
                    Assistance Requests:
                    {assistanceRequests.length}
                </li>
                <li>
                    Petty Crime Reports:
                    {pettyCrimeReports.length}
                </li>
                <li>
                    Announcements:
                    {announcements.length}
                </li>
            </ul>
        </div>
    );
};

export default DashboardOverview;