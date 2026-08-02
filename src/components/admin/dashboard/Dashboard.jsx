import React from "react";

import AdminStats from "../layout/AdminStats";
import DashboardSummary from "./DashboardSummary";
import DashboardCharts from "./DashboardCharts";
import DashboardRecentReports from "./DashboardRecentReports";
import DashboardAlerts from "./DashboardAlerts";
import DashboardQuickActions from "./DashboardQuickActions";

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
                onNavigate={onNavigate}
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

            <DashboardAlerts
                emergencyReports={emergencyReports}
                assistanceRequests={assistanceRequests}
                pettyCrimeReports={pettyCrimeReports}
            />

            <DashboardCharts
                emergencyReports={emergencyReports}
                assistanceRequests={assistanceRequests}
                pettyCrimeReports={pettyCrimeReports}
            />

            <DashboardQuickActions
                onNavigate={onNavigate}
            />

            <DashboardRecentReports
                emergencyReports={emergencyReports}
                assistanceRequests={assistanceRequests}
                pettyCrimeReports={pettyCrimeReports}
            />

            {onCreateAnnouncement && (
                <button
                    type="button"
                    className="fab-create-announcement"
                    onClick={onCreateAnnouncement}
                >
                    <i className="bi bi-plus-lg"></i>
                    <span>Create Announcement</span>
                </button>
            )}
        </>
    );
}