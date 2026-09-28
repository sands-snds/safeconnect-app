import React, { useState } from "react";

import AdminStats from "../layout/AdminStats";
import DashboardSummary from "./DashboardSummary";
import DashboardCharts from "./DashboardCharts";
import ReportsOverTimeChart from "./ReportsOverTimeChart";
import DashboardRecentReports from "./DashboardRecentReports";
import useIsMobile from "../hooks/useIsMobile";

// Phones: only the summary card, then a toggle between Recent Reports (the
// default) and Analytics (the charts), instead of one very long page.
const MOBILE_TABS = [
    { key: "recent", label: "Recent Reports" },
    { key: "analytics", label: "Analytics" }
];

const tabStyle = (active) => ({
    flex: 1,
    padding: "9px 12px",
    borderRadius: 8,
    border: `1px solid ${active ? "#6B2C3E" : "#d1d5db"}`,
    background: active ? "#6B2C3E" : "#fff",
    color: active ? "#fff" : "#374151",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer"
});
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
    onNavigate,
    adminName,
    isSuperAdmin = false
}) {
    const isMobile = useIsMobile();
    const [mobileTab, setMobileTab] = useState("recent");

    const charts = (
        <>
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
        </>
    );

    const recent = (
        <DashboardRecentReports
            emergencyReports={emergencyReports}
            assistanceRequests={assistanceRequests}
            pettyCrimeReports={pettyCrimeReports}
            onNavigate={onNavigate}
        />
    );

    if (isMobile) {
        return (
            <>
                <DashboardSummary
                    emergencyReports={emergencyReports}
                    assistanceRequests={assistanceRequests}
                    pettyCrimeReports={pettyCrimeReports}
                    onCreateAnnouncement={onCreateAnnouncement}
                    adminName={adminName}
                />

                <div role="tablist" style={{ display: "flex", gap: 8 }}>
                    {MOBILE_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            role="tab"
                            aria-selected={mobileTab === tab.key}
                            onClick={() => setMobileTab(tab.key)}
                            style={tabStyle(mobileTab === tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {mobileTab === "recent" ? recent : charts}
            </>
        );
    }

    return (
        <>
            <DashboardSummary
                emergencyReports={emergencyReports}
                assistanceRequests={assistanceRequests}
                pettyCrimeReports={pettyCrimeReports}
                onCreateAnnouncement={onCreateAnnouncement}
                adminName={adminName}
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
                isSuperAdmin={isSuperAdmin}
            />

            {charts}

            {recent}
        </>
    );
}