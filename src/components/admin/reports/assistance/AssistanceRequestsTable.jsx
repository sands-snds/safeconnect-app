import React, { useEffect, useState } from "react";

import ListView, { allOption } from "../../shared/ListView";
import ReportCard from "../../shared/ReportCard";

import AssistanceRequestDetails from "./AssistanceRequestDetails";
import StatusSelect, { statusBadge } from "../../shared/StatusSelect";
import ArchiveButton from "../shared/ArchiveButton";
import DismissalNote from "../shared/DismissalNote";
import { ReportForTag, ReportForFilter } from "../shared/ReportFor";

const STATUS_OPTIONS = [
  "Received",
  "In Progress",
  "Resolved",
  "Dismissed"
];

const AssistanceRequestsTable = ({
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

  const renderRow = (request) => (
    <ReportCard
      key={request.id}
      accentColor="#6B2C3E"
      title={request.victimOfEmergency ? `${request.assistanceType} · ${request.victimOfEmergency}` : request.assistanceType}
      badge={statusBadge(request.status)}
      tag={
        <>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#f3f4f6", color: "#374151", fontWeight: 600, whiteSpace: "nowrap" }}>
            {request.peopleAffected || 1} people
          </span>
          <ReportForTag report={request} />
        </>
      }
      subtitle={`${request.requester} · ${request.location} · ${request.date}`}
      statusControl={
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <StatusSelect
            value={request.status}
            reportId={request.id}
            reportType="assistance"
            onUpdateStatus={onUpdateStatus}
            showBadge={false}
          />
          <ArchiveButton report={request} reportType="assistance" onArchive={onArchive} />
        </div>
      }
      expanded={expandedRowId === request.id}
      onToggle={() => toggleDetails(request.id)}
    >
      <DismissalNote report={request} />
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
      exportWithOptions
      exportTitle="Assistance Requests"
      itemLabel="requests"
    />
  );
};

export default AssistanceRequestsTable;