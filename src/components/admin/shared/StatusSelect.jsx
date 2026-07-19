import React from "react";

const StatusSelect = ({
  value,
  reportId,
  reportType,
  onUpdateStatus,
  options = []
}) => {
  return (
    <select
      value={value}
      onChange={(e) =>
        onUpdateStatus(
          reportId,
          e.target.value,
          reportType
        )
      }
      className="form-select text-xs"
      style={{
        padding: "4px 8px"
      }}
    >
      {options.map((status) => (
        <option
          key={status}
          value={status}
        >
          {status}
        </option>
      ))}
    </select>
  );
};

export default StatusSelect;