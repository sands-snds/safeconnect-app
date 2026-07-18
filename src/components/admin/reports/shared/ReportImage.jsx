import React from "react";

const ReportImage = ({ photo }) => {
  if (!photo) return null;

  return (
    <div
      style={{
        flex: "0 0 auto"
      }}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: "8px",
          fontSize: ".85rem",
          color: "#374151"
        }}
      >
        Uploaded Photo
      </div>

      <a
        href={photo}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src={photo}
          alt="Attachment"
          style={{
            width: "220px",
            maxHeight: "220px",
            objectFit: "cover",
            borderRadius: "6px",
            border: "1px solid #e5e7eb"
          }}
        />
      </a>
    </div>
  );
};

export default ReportImage;