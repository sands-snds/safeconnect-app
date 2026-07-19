import React, { useState } from "react";

import ListView from "../../shared/ListView";

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

  const renderRow = (report) => {
    const expanded = expandedRowId === report.id;

    return (
      <React.Fragment key={report.id}>
        <tr>

          <td className="table-cell">
            <div className="font-medium text-sm">
              {report.reporter}
            </div>

            <div className="text-gray-500 text-xs">
              {report.phone}
            </div>
          </td>

          <td className="table-cell">
            {report.emergency}
          </td>

          <td className="table-cell">
            <span
              style={{
                color: getSeverityColor(report.severity),
                fontWeight: 600
              }}
            >
              {report.severity}
            </span>
          </td>

          <td className="table-cell">
            {report.location}
          </td>

          <td className="table-cell">
            {report.date}
          </td>

          <td className="table-cell">

            <StatusSelect
              value={report.status}
              reportId={report.id}
              reportType="emergency"
              options={STATUS_OPTIONS}
              onUpdateStatus={onUpdateStatus}
            />

          </td>

          <td className="table-cell">

            <button
              type="button"
              className="text-xs font-medium"
              onClick={() => toggleDetails(report.id)}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                background: "#f9fafb",
                cursor: "pointer"
              }}
            >
              {expanded
                ? "Hide Details"
                : "View Details"}
            </button>

          </td>

        </tr>

        {expanded && (
          <tr>

            <td
              colSpan={7}
              style={{
                background: "#f9fafb",
                padding: "16px",
                borderTop: "1px solid #e5e7eb"
              }}
            >
              <EmergencyReportDetails
                report={report}
              />
            </td>

          </tr>
        )}

      </React.Fragment>
    );
  };

  return (
    <ListView
      title="EMERGENCY REPORTS"
      data={data}
      filterType="emergency"
      filters={filters}
      setFilters={setFilters}
      headers={[
        "REPORTER",
        "TYPE",
        "SEVERITY",
        "LOCATION",
        "DATE",
        "STATUS",
        "ACTIONS"
      ]}
      renderRow={renderRow}
      statusOptions={[
        "All Items",
        ...STATUS_OPTIONS
      ]}
    />
  );
};

export default EmergencyReportsTable;