import React, { useEffect, useState } from "react";

import ListView, { allOption } from "../../shared/ListView";
import ReportCard from "../../shared/ReportCard";

import EmergencyReportDetails from "./EmergencyReportDetails";
import StatusSelect, { statusBadge } from "../../shared/StatusSelect";
import ArchiveButton from "../shared/ArchiveButton";
import DismissalNote from "../shared/DismissalNote";
import { ReportForTag, ReportForFilter } from "../shared/ReportFor";
import { tx } from "../../../../i18n/adminText";

const STATUS_OPTIONS = [
  "Received",
  "In Progress",
  "Resolved",
  "Dismissed"
];

const EmergencyReportsTable = ({
  data,
  filters,
  setFilters,
  onUpdateStatus,
  onArchive,
  // Opened from a notification: start with that report's details open.
  focusId
}) => {
  const [expandedRowId, setExpandedRowId] = useState(focusId ?? null);

  useEffect(() => {
    if (focusId != null) setExpandedRowId(focusId);
  }, [focusId]);

  const toggleDetails = (id) => {
    setExpandedRowId((prev) =>
      prev === id ? null : id
    );
  };

  const renderRow = (report) => (
    <ReportCard
      key={report.id}
      accentColor="#dc2626"
      title={tx(report.emergency)}
      badge={statusBadge(report.status)}
      tag={<ReportForTag report={report} />}
      subtitle={`${report.reporter} · ${report.location} · ${report.date}`}
      statusControl={
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <StatusSelect
            value={report.status}
            reportId={report.id}
            reportType="emergency"
            onUpdateStatus={onUpdateStatus}
            showBadge={false}
          />
          <ArchiveButton report={report} reportType="emergency" onArchive={onArchive} />
        </div>
      }
      expanded={expandedRowId === report.id}
      onToggle={() => toggleDetails(report.id)}
    >
      <DismissalNote report={report} />
      <EmergencyReportDetails report={report} />
    </ReportCard>
  );

  return (
    <ListView
      data={data}
      layout="cards"
      filterType="emergency"
      filters={filters}
      setFilters={setFilters}
      renderRow={renderRow}
      statusOptions={[
        allOption("All Statuses"),
        ...STATUS_OPTIONS
      ]}
      extraFilters={
        <ReportForFilter filterType="emergency" filters={filters} setFilters={setFilters} />
      }
      exportType="emergency"
      exportWithOptions
      exportTitle={tx("Emergency Reports")}
      itemLabel={tx("reports")}
    />
  );
};

export default EmergencyReportsTable;