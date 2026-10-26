import React from "react";

// The resident's photo or video attachment. Reports store the file as a
// base64 data URL; mediaType ("image" | "video") says which it is, and
// older reports without it are treated as images unless the data URL
// itself says video.
const ReportImage = ({ photo, mediaType }) => {
  if (!photo) return null;

  const isVideo = mediaType === "video" || photo.startsWith("data:video/");
  const mediaStyle = {
    width: "220px",
    maxHeight: "220px",
    objectFit: "cover",
    borderRadius: "6px",
    border: "1px solid #e5e7eb"
  };

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
        {isVideo ? "Uploaded Video" : "Uploaded Photo"}
      </div>

      {isVideo ? (
        <video src={photo} controls style={{ ...mediaStyle, background: "#000" }} />
      ) : (
        <a
          href={photo}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={photo}
            alt="Attachment"
            style={mediaStyle}
          />
        </a>
      )}
    </div>
  );
};

export default ReportImage;
