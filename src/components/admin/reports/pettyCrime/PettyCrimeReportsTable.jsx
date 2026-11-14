import React, { useEffect, useState } from "react";

import ListView, { allOption } from "../../shared/ListView";

import PettyCrimeReportDetails from "./PettyCrimeReportDetails";
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
  { key: "crime", label: "Crime type", width: 170, render: (r) => tx(r.crimeType) },
  { key: "location", label: "Location", flex: true, render: (r) => r.location },
  { key: "filed", label: "Filed", width: 150, render: (r) => <span className="rt-muted">{r.date}</span> },
  { key: "status", label: "Status", width: 120, render: (r) => <StatusPill badge={statusBadge(r.status)} /> }
];

const PettyCrimeReportsTable = ({
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
      type="pettyCrime"
      accentColor="#b45309"
      columns={COLUMNS}
      items={items}
      expandedId={expandedRowId}
      onToggle={toggleDetails}
      renderActions={(report) => (
        <>
          <StatusSelect
            value={report.status}
            reportId={report.id}
            reportType="pettyCrime"
            onUpdateStatus={onUpdateStatus}
            showBadge={false}
            showDismiss={false}
          />
          <ArchiveButton report={report} reportType="pettyCrime" onArchive={onArchive} />
        </>
      )}
      renderDetails={(report) => (
        <PettyCrimeReportDetails
          report={report}
          actions={(
            <StatusSelect
              value={report.status}
              reportId={report.id}
              reportType="pettyCrime"
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
      filterType="pettyCrime"
      filters={filters}
      setFilters={setFilters}
      statusOptions={[
        allOption("All Statuses"),
        ...STATUS_OPTIONS
      ]}
      extraFilters={
        <ReportForFilter filterType="pettyCrime" filters={filters} setFilters={setFilters} />
      }
      exportType="pettyCrime"
      exportWithOptions
      exportTitle={tx("Petty Crime Reports")}
      itemLabel={tx("reports")}
    />
  );
};

export default PettyCrimeReportsTable;
