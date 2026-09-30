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

    getSeverityColor
}) => {
    // Archived reports are still loaded (the dashboard counts them) but
    // only listed here when the "Archived" tab is selected.
    const [showArchived, setShowArchived] = useState(false);

    const filterData = (data, filterType, statusKey = "status") => {
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
                        emergencyReports={filteredEmergencyReports}
                        filters={filters}
                        setFilters={setFilters}
                        onUpdateStatus={onUpdateStatus}
                        onArchive={onArchive}
                        getSeverityColor={getSeverityColor}
                    />
                </>
            );

        case "assistance-requests":
            return (
                <>
                    {renderToolbar(assistanceRequests)}
                    <AssistancePage
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
