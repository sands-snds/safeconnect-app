import React, { useState } from "react";
import { EmergencyPage } from "./emergency";
import { AssistancePage } from "./assistance";
import { PettyCrimePage } from "./pettyCrime";
import ArchiveToolbar from "./shared/ArchiveToolbar";

const ReportsPage = ({
    activeView,

    emergencyReports,
    assistanceRequests,
    pettyCrimeReports,

    filters,
    setFilters,

    onUpdateStatus,
    onArchive,
    onRefresh,
    isSuperAdmin,
    // From a notification's "See report": show only that report, opened.
    focusId,
    onClearFocus
}) => {
    // Archived reports are still loaded (the dashboard counts them) but
    // only listed here when the "Archived" tab is selected.
    const [showArchived, setShowArchived] = useState(false);

    const filterData = (data, filterType, statusKey = "status") => {
        const focused = focusId != null && data.find(item => String(item.id) === String(focusId));
        if (focused) return [focused];

        let filtered = data.filter(item => Boolean(item.archivedAt) === showArchived);

        const currentFilter = filters[filterType];

        if (currentFilter.status && currentFilter.status !== "All Items") {
            filtered = filtered.filter(
                item => item[statusKey] === currentFilter.status
            );
        }

        if (currentFilter.reportFor && currentFilter.reportFor !== "all") {
            filtered = filtered.filter(
                item => (item.reportFor || "self") === currentFilter.reportFor
            );
        }

        if (currentFilter.search) {
            const search = currentFilter.search.toLowerCase();

            filtered = filtered.filter(item =>
                Object.values(item).some(value =>
                    String(value)
                        .toLowerCase()
                        .includes(search)
                )
            );
        }

        return filtered;
    };

    const filteredEmergencyReports = filterData(
        emergencyReports,
        "emergency"
    );

    const filteredAssistanceRequests = filterData(
        assistanceRequests,
        "assistance"
    );

    const filteredPettyCrimeReports = filterData(
        pettyCrimeReports,
        "pettyCrime"
    );

    const renderToolbar = (all) => {
        const archivedCount = all.filter(item => item.archivedAt).length;
        if (focusId != null && all.some(item => String(item.id) === String(focusId))) {
            return (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16, padding: "10px 14px", background: "#FDECEC", borderRadius: 10, color: "#6B2C3E", fontSize: 13.5 }}>
                    <span><i className="bi bi-bell-fill" style={{ marginRight: 6 }} />Showing the report from your notification.</span>
                    <button type="button" className="button button-primary" style={{ fontSize: 12.5, padding: "6px 12px" }} onClick={onClearFocus}>
                        Show all reports
                    </button>
                </div>
            );
        }
        return (
            <ArchiveToolbar
                showArchived={showArchived}
                setShowArchived={setShowArchived}
                activeCount={all.length - archivedCount}
                archivedCount={archivedCount}
                isSuperAdmin={isSuperAdmin}
                onSettingsChanged={onRefresh}
            />
        );
    };

    switch (activeView) {

        case "emergency-reports":
            return (
                <>
                    {renderToolbar(emergencyReports)}
                    <EmergencyPage
                        focusId={focusId}
                        emergencyReports={filteredEmergencyReports}
                        filters={filters}
                        setFilters={setFilters}
                        onUpdateStatus={onUpdateStatus}
                        onArchive={onArchive}
                    />
                </>
            );

        case "assistance-requests":
            return (
                <>
                    {renderToolbar(assistanceRequests)}
                    <AssistancePage
                        focusId={focusId}
                        assistanceRequests={filteredAssistanceRequests}
                        filters={filters}
                        setFilters={setFilters}
                        onUpdateStatus={onUpdateStatus}
                        onArchive={onArchive}
                    />
                </>
            );

        case "petty-crime-reports":
            return (
                <>
                    {renderToolbar(pettyCrimeReports)}
                    <PettyCrimePage
                        focusId={focusId}
                        pettyCrimeReports={filteredPettyCrimeReports}
                        filters={filters}
                        setFilters={setFilters}
                        onUpdateStatus={onUpdateStatus}
                        onArchive={onArchive}
                    />
                </>
            );

        default:
            return null;
    }
};

export default ReportsPage;
