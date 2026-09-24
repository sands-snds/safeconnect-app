import React, { useState } from "react";

import ListView, { allOption } from "../../shared/ListView";
import ReportCard from "../../shared/ReportCard";

import AssistanceRequestDetails from "./AssistanceRequestDetails";
import StatusSelect from "../../shared/StatusSelect";
import { ReportForTag, ReportForFilter } from "../shared/ReportFor";

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
      tag={<ReportForTag report={request} />}
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
        allOption("All Statuses"),
        ...STATUS_OPTIONS
      ]}
      extraFilters={
        <ReportForFilter filterType="assistance" filters={filters} setFilters={setFilters} />
      }
      exportType="assistance"
      itemLabel="requests"
    />
  );
};

export default AssistanceRequestsTable;