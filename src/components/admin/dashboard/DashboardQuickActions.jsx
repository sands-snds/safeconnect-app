import { tx } from "../../../i18n/adminText";
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
                    {tx("Emergency Reports")}
                </button>

                <button
                    className="button button-primary"
                    onClick={() =>
                        onNavigate("assistance-requests")
                    }
                >
                    {tx("Assistance Requests")}
                </button>

                <button
                    className="button button-primary"
                    onClick={() =>
                        onNavigate("petty-crime-reports")
                    }
                >
                    {tx("Petty Crime Reports")}
                </button>

                <button
                    className="button button-primary"
                    onClick={() =>
                        onNavigate("announcement-page")
                    }
                >
                    {tx("Announcements")}
                </button>

            </div>

        </div>

    );

}