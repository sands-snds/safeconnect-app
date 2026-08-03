import React, { useState } from "react";

import ListView from "../../shared/ListView";
import ReportCard from "../../shared/ReportCard";

import PettyCrimeReportDetails from "./PettyCrimeReportDetails";
import StatusSelect from "../../shared/StatusSelect";

const STATUS_OPTIONS = [
  "Received",
  "In Progress",
  "Resolved"
];

const PettyCrimeReportsTable = ({
  data,
  filters,
  setFilters,
  onUpdateStatus
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
      accentColor="#b45309"
      title={report.crimeType}
      subtitle={`${report.reporter} · ${report.location} · ${report.date}`}
      statusControl={
        <StatusSelect
          value={report.status}
          reportId={report.id}
          reportType="pettyCrime"
          onUpdateStatus={onUpdateStatus}
        />
      }
      expanded={expandedRowId === report.id}
      onToggle={() => toggleDetails(report.id)}
    >
      <PettyCrimeReportDetails report={report} />
    </ReportCard>
  );

  return (
    <ListView
      data={data}
      layout="cards"
      filterType="pettyCrime"
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

export default PettyCrimeReportsTable;
