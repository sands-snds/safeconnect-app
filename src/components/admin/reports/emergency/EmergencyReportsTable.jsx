import React, { useEffect, useState } from "react";

import ListView, { allOption } from "../../shared/ListView";

import EmergencyReportDetails from "./EmergencyReportDetails";
import StatusSelect, { statusBadge } from "../../shared/StatusSelect";
import ArchiveButton from "../shared/ArchiveButton";
import ReportsTable, { StatusPill, PersonCell } from "../shared/ReportsTable";
import { ReportForTag, ReportForFilter } from "../shared/ReportFor";
import { tx } from "../../../../i18n/adminText";

const STATUS_OPTIONS = [
  "Received",
  "In Progress",
  "Resolved",
  "Dismissed"
];

const COLUMNS = [
  {
    key: "reporter", label: "Reporter", width: 190,
    render: (r) => <PersonCell report={r} name={r.reporter} tag={<ReportForTag report={r} />} />
  },
  { key: "type", label: "Type", width: 150, render: (r) => tx(r.emergency) },
  { key: "location", label: "Location", flex: true, render: (r) => r.location },
  { key: "people", label: "People", width: 80, render: (r) => (r.peopleAffected && r.peopleAffected !== "0" ? r.peopleAffected : <span className="rt-muted">—</span>) },
  { key: "filed", label: "Filed", width: 150, render: (r) => <span className="rt-muted">{r.date}</span> },
  { key: "status", label: "Status", width: 120, render: (r) => <StatusPill badge={statusBadge(r.status)} /> }
];

const EmergencyReportsTable = ({
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
      type="emergency"
      accentColor="#dc2626"
      columns={COLUMNS}
      items={items}
      expandedId={expandedRowId}
      onToggle={toggleDetails}
      renderActions={(report) => (
        <>
          <StatusSelect
            value={report.status}
            reportId={report.id}
            reportType="emergency"
            onUpdateStatus={onUpdateStatus}
            showBadge={false}
            showDismiss={false}
          />
          <ArchiveButton report={report} reportType="emergency" onArchive={onArchive} />
        </>
      )}
      renderDetails={(report) => (
        <EmergencyReportDetails
          report={report}
          actions={(
            <StatusSelect
              value={report.status}
              reportId={report.id}
              reportType="emergency"
              onUpdateStatus={onUpdateStatus}
              showBadge={false}
              showAdvance={false}
            />
          )}
        />
      )}
    />
  );

  return (
    <ListView
      data={data}
      layout="custom"
      renderTable={renderTable}
      filterType="emergency"
      filters={filters}
      setFilters={setFilters}
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
