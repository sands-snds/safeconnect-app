import React, { useState } from "react";

import ListView from "../../shared/ListView";

import AssistanceRequestDetails from "./AssistanceRequestDetails";
import StatusSelect from "../shared/StatusSelect";

const STATUS_OPTIONS = [
  "Pending",
  "In Progress",
  "Approved",
  "Rejected"
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

  const renderRow = (request) => {
    const expanded = expandedRowId === request.id;

    return (
      <React.Fragment key={request.id}>
        <tr>

          <td className="table-cell">
            <div className="font-medium text-sm">
              {request.requester}
            </div>

            <div className="text-gray-500 text-xs">
              {request.phone}
            </div>
          </td>

          <td className="table-cell">
            <div className="font-medium text-sm">
              {request.assistanceType}
            </div>

            <div className="text-gray-500 text-xs">
              People: {request.peopleAffected}
            </div>
          </td>

          <td className="table-cell text-sm">
            {request.location}
          </td>

          <td className="table-cell text-sm">
            {request.date}
          </td>

          <td className="table-cell">

            <StatusSelect
              value={request.status}
              reportId={request.id}
              reportType="assistance"
              options={STATUS_OPTIONS}
              onUpdateStatus={onUpdateStatus}
            />

          </td>

          <td className="table-cell">

            <button
              type="button"
              className="text-xs font-medium"
              onClick={() => toggleDetails(request.id)}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                background: "#f9fafb",
                cursor: "pointer",
                whiteSpace: "nowrap"
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
              colSpan={6}
              style={{
                backgroundColor: "#f9fafb",
                padding: "16px",
                borderTop: "1px solid #e5e7eb"
              }}
            >
              <AssistanceRequestDetails
                request={request}
              />
            </td>

          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <ListView
      title="ASSISTANCE REQUESTS"
      data={data}
      filterType="assistance"
      filters={filters}
      setFilters={setFilters}
      headers={[
        "REQUESTER",
        "TYPE",
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

export default AssistanceRequestsTable;