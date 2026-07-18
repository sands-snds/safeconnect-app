export default function DashboardQuickActions({
    onNavigate
}) {

    return (

        <div className="dashboard-card">

            <h3>Quick Actions</h3>

            <div className="dashboard-actions">

                <button
                    className="button button-primary"
                    onClick={() =>
                        onNavigate("emergency-reports")
                    }
                >
                    Emergency Reports
                </button>

                <button
                    className="button button-primary"
                    onClick={() =>
                        onNavigate("assistance-requests")
                    }
                >
                    Assistance Requests
                </button>

                <button
                    className="button button-primary"
                    onClick={() =>
                        onNavigate("petty-crime-reports")
                    }
                >
                    Petty Crime Reports
                </button>

                <button
                    className="button button-primary"
                    onClick={() =>
                        onNavigate("announcement-page")
                    }
                >
                    Announcements
                </button>

            </div>

        </div>

    );

}