import React, { useEffect, useState } from "react";

import ListView, { allOption } from "../../shared/ListView";

import AssistanceRequestDetails from "./AssistanceRequestDetails";
import StatusSelect, { statusBadge } from "../../shared/StatusSelect";
import ArchiveButton from "../shared/ArchiveButton";
import DismissalNote from "../shared/DismissalNote";
import ReportsTable, { StatusPill } from "../shared/ReportsTable";
import { ReportForTag, ReportForFilter } from "../shared/ReportFor";
import { tx } from "../../../../i18n/adminText";

const STATUS_OPTIONS = [
  "Received",
  "In Progress",
  "Resolved",
  "Dismissed"
];

const COLUMNS = [
  { key: "id", label: "Report ID", width: 150, render: (r) => <span className="rt-id">{r.reference || `#${r.id}`}</span> },
  {
    key: "help", label: "Help needed", width: 190,
    render: (r) => (
      <>
        <div>{tx(r.assistanceType)}</div>
        {r.victimOfEmergency && <div className="rt-muted">{tx(r.victimOfEmergency)}</div>}
      </>
    )
  },
  {
    key: "requester", label: "Requester", width: 170,
    render: (r) => (
      <>
        <div>{r.requester}</div>
        <ReportForTag report={r} />
      </>
    )
  },
  { key: "location", label: "Location", width: 240, render: (r) => r.location },
  { key: "people", label: "People", width: 80, render: (r) => r.peopleAffected || 1 },
  { key: "filed", label: "Filed", width: 150, render: (r) => <span className="rt-muted">{r.date}</span> },
  { key: "status", label: "Status", width: 120, render: (r) => <StatusPill badge={statusBadge(r.status)} /> }
];

const AssistanceRequestsTable = ({
  data,
  filters,
  setFilters,
  onUpdateStatus,
  onArchive,

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

  const renderTable = (items) => (
    <ReportsTable
      type="assistance"
      accentColor="#6B2C3E"
      columns={COLUMNS}
      items={items}
      expandedId={expandedRowId}
      onToggle={toggleDetails}
      renderActions={(request) => (
        <>
          <StatusSelect
            value={request.status}
            reportId={request.id}
            reportType="assistance"
            onUpdateStatus={onUpdateStatus}
            showBadge={false}
            showDismiss={false}
          />
          <ArchiveButton report={request} reportType="assistance" onArchive={onArchive} />
        </>
      )}
      renderDetails={(request) => (
        <>
          <DismissalNote report={request} />
          <AssistanceRequestDetails request={request} />
          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
            <StatusSelect
              value={request.status}
              reportId={request.id}
              reportType="assistance"
              onUpdateStatus={onUpdateStatus}
              showBadge={false}
              showAdvance={false}
            />
          </div>
        </>
      )}
    />
  );

  return (
    <ListView
      data={data}
      layout="custom"
      renderTable={renderTable}
      filterType="assistance"
      filters={filters}
      setFilters={setFilters}
      statusOptions={[
        allOption("All Statuses"),
        ...STATUS_OPTIONS
      ]}
      extraFilters={
        <ReportForFilter filterType="assistance" filters={filters} setFilters={setFilters} />
      }
      exportType="assistance"
      exportWithOptions
      exportTitle={tx("Assistance Requests")}
      itemLabel="requests"
    />
  );
};

export default AssistanceRequestsTable;
