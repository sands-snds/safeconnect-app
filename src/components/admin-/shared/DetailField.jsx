import React from "react";

const DetailField = ({
  label,
  value,
  width = "170px"
}) => {
  return (
    <div
      style={{
        display: "flex",
        marginBottom: "8px",
        fontSize: ".85rem",
        alignItems: "flex-start"
      }}
    >
      <div
        style={{
          width,
          flexShrink: 0,
          fontWeight: 600,
          color: "#374151"
        }}
      >
        {label}:
      </div>

      <div
        style={{
          flex: 1,
          color: "#374151",
          wordBreak: "break-word"
        }}
      >
        {value || value === 0 ? value : "N/A"}
      </div>
    </div>
  );
};

export default DetailField;