import React, { useState } from "react";

import ListView from "../../shared/ListView";
import ReportCard from "../../shared/ReportCard";

import AssistanceRequestDetails from "./AssistanceRequestDetails";
import StatusSelect from "../../shared/StatusSelect";

const STATUS_OPTIONS = [
  "Received",
  "In Progress",
  "Resolved"
];

const AssistanceRequestsTable = ({
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

  const renderRow = (request) => (
    <ReportCard
      key={request.id}
      accentColor="#6B2C3E"
      title={request.assistanceType}
      badge={{
        text: `${request.peopleAffected || 1} people`,
        bg: "#f3f4f6",
        color: "#374151"
      }}
      subtitle={`${request.requester} · ${request.location} · ${request.date}`}
      statusControl={
        <StatusSelect
          value={request.status}
          reportId={request.id}
          reportType="assistance"
          onUpdateStatus={onUpdateStatus}
        />
      }
      expanded={expandedRowId === request.id}
      onToggle={() => toggleDetails(request.id)}
    >
      <AssistanceRequestDetails request={request} />
    </ReportCard>
  );

  return (
    <ListView
      data={data}
      layout="cards"
      filterType="assistance"
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

export default AssistanceRequestsTable;
