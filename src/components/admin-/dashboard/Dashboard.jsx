import AdminStats from "../layout/AdminStats";

import DashboardCharts from "./DashboardCharts";
import DashboardAlerts from "./DashboardAlerts";
import DashboardRecentReports from "./DashboardRecentReports";
import DashboardQuickActions from "./DashboardQuickActions";
import DashboardSummary from "./DashboardSummary";

export default function Dashboard(props) {

    return (
        <>
            <h1 className="font-bold text-2xl mb-5">
                DASHBOARD
            </h1>
            <DashboardSummary
                emergencyReports={props.emergencyReports}
                assistanceRequests={props.assistanceRequests}
                pettyCrimeReports={props.pettyCrimeReports}
            />

            <AdminStats {...props} />

            <DashboardCharts
                emergencyReports={props.emergencyReports}
                assistanceRequests={props.assistanceRequests}
            />

            <DashboardAlerts
                emergencyReports={props.emergencyReports}
                assistanceRequests={props.assistanceRequests}
                pettyCrimeReports={props.pettyCrimeReports}
            />

            <DashboardRecentReports
                emergencyReports={props.emergencyReports}
                assistanceRequests={props.assistanceRequests}
                pettyCrimeReports={props.pettyCrimeReports}
            />

            <DashboardQuickActions
                onNavigate={props.onStatCardClick}
            />

        </>

    );

}