import React, { useState } from "react";

import ListView, { allOption } from "../../shared/ListView";
import ReportCard from "../../shared/ReportCard";

import EmergencyReportDetails from "./EmergencyReportDetails";
import StatusSelect from "../../shared/StatusSelect";
import ArchiveButton from "../shared/ArchiveButton";
import { ReportForTag, ReportForFilter } from "../shared/ReportFor";

const STATUS_OPTIONS = [
  "Received",
  "In Progress",
  "Resolved"
];

const EmergencyReportsTable = ({
  data,
  filters,
  setFilters,
  onUpdateStatus,
  onArchive,
  getSeverityColor
}) => {
  const [expandedRowId, setExpandedRowId] = useState(null);

  const toggleDetails = (id) => {
    setExpandedRowId((prev) =>
      prev === id ? null : id
    );
  };

  const renderRow = (report) => (
    <ReportCard
      key={report.id}
      accentColor={getSeverityColor(report.severity)}
      title={report.emergency}
      badge={{
        text: report.severity,
        bg: "#f3f4f6",
        color: getSeverityColor(report.severity)
      }}
      tag={<ReportForTag report={report} />}
      subtitle={`${report.reporter} · ${report.location} · ${report.date}`}
      statusControl={
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <StatusSelect
            value={report.status}
            reportId={report.id}
            reportType="emergency"
            onUpdateStatus={onUpdateStatus}
          />
          <ArchiveButton report={report} reportType="emergency" onArchive={onArchive} />
        </div>
      }
      expanded={expandedRowId === report.id}
      onToggle={() => toggleDetails(report.id)}
    >
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
      exportTitle="Emergency Reports"
      itemLabel="reports"
    />
  );
};

export default EmergencyReportsTable;