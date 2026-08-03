import React, { useState } from "react";

import ListView from "../../shared/ListView";
import ReportCard from "../../shared/ReportCard";

import EmergencyReportDetails from "./EmergencyReportDetails";
import StatusSelect from "../../shared/StatusSelect";

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
      subtitle={`${report.reporter} · ${report.location} · ${report.date}`}
      statusControl={
        <StatusSelect
          value={report.status}
          reportId={report.id}
          reportType="emergency"
          onUpdateStatus={onUpdateStatus}
        />
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
        "Select",
        ...STATUS_OPTIONS
      ]}
    />
  );
};

export default EmergencyReportsTable;
