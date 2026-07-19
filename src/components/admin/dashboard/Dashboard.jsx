import AdminStats from "../layout/AdminStats";

import DashboardCharts from "./DashboardCharts";
import DashboardAlerts from "./DashboardAlerts";
import DashboardRecentReports from "./DashboardRecentReports";
import DashboardQuickActions from "./DashboardQuickActions";
import DashboardSummary from "./DashboardSummary";

export default function Dashboard(props) {

    return (
        <>
            <DashboardSummary
                emergencyReports={props.emergencyReports}
                assistanceRequests={props.assistanceRequests}
                pettyCrimeReports={props.pettyCrimeReports}
                onNavigate={props.onNavigate}
            />

            <AdminStats {...props} />

            <DashboardCharts
                emergencyReports={props.emergencyReports}
                assistanceRequests={props.assistanceRequests}
            />

            <DashboardRecentReports
                emergencyReports={props.emergencyReports}
                assistanceRequests={props.assistanceRequests}
                pettyCrimeReports={props.pettyCrimeReports}
            />

        </>

    );

}