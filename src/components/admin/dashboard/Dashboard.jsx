import React from "react";

import AdminStats from "../layout/AdminStats";
import DashboardSummary from "./DashboardSummary";
import DashboardCharts from "./DashboardCharts";
import ReportsOverTimeChart from "./ReportsOverTimeChart";
import DashboardRecentReports from "./DashboardRecentReports";
// DashboardAlerts and DashboardQuickActions are intentionally not rendered here.
// Kept in the codebase for potential future use -- see components/admin/dashboard/.

export default function Dashboard({
    emergencyReports,
    assistanceRequests,
    pettyCrimeReports,
    registeredUsers,
    signInLogs,
    adminLogs,
    announcements,
    onStatCardClick,
    onCreateAnnouncement,
    onNavigate
}) {
    return (
        <>
            <DashboardSummary
                emergencyReports={emergencyReports}
                assistanceRequests={assistanceRequests}
                pettyCrimeReports={pettyCrimeReports}
                onCreateAnnouncement={onCreateAnnouncement}
            />

            <AdminStats
                emergencyReports={emergencyReports}
                assistanceRequests={assistanceRequests}
                registeredUsers={registeredUsers}
                signInLogs={signInLogs}
                adminLogs={adminLogs}
                announcements={announcements}
                pettyCrimeReports={pettyCrimeReports}
                onStatCardClick={onStatCardClick}
            />

            <div style={{ marginTop: "24px" }}>
                <ReportsOverTimeChart
                    emergencyReports={emergencyReports}
                    assistanceRequests={assistanceRequests}
                    pettyCrimeReports={pettyCrimeReports}
                />
            </div>

            <DashboardCharts
                emergencyReports={emergencyReports}
                assistanceRequests={assistanceRequests}
                pettyCrimeReports={pettyCrimeReports}
            />

            <DashboardRecentReports
                emergencyReports={emergencyReports}
                assistanceRequests={assistanceRequests}
                pettyCrimeReports={pettyCrimeReports}
            />
        </>
    );
}