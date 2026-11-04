import React from "react";
import useReportMedia from "../../../shared/useReportMedia";
import { tx } from "../../../../i18n/adminText";

// The report's photo or video, loaded only when its details are open
// (the report lists leave the media out and only say hasMedia).
const ReportImage = ({ type, id, hasMedia, mediaType }) => {
  const { media, loading, failed } = useReportMedia(type, id, hasMedia);
  if (!hasMedia) return null;

  const kind = media?.mediaType || mediaType;
  const isVideo = kind === "video" || Boolean(media?.photoUrl.startsWith("data:video/"));
  const mediaStyle = {
    width: "220px",
    maxHeight: "220px",
    objectFit: "cover",
    borderRadius: "6px",
    border: "1px solid #e5e7eb"
  };
  const placeholderStyle = {
    ...mediaStyle,
    height: "140px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f4f6",
    color: "#6b7280",
    fontSize: ".8rem",
    textAlign: "center",
    padding: "8px"
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
        {isVideo ? tx("Uploaded Video") : tx("Uploaded Photo")}
      </div>

      {loading ? (
        <div style={placeholderStyle}>{isVideo ? tx("Loading video…") : tx("Loading photo…")}</div>
      ) : failed || !media ? (
        <div style={placeholderStyle}>{tx("The attachment couldn't be loaded. Try refreshing.")}</div>
      ) : isVideo ? (
        <video src={media.photoUrl} controls style={{ ...mediaStyle, background: "#000" }} />
      ) : (
        <a
          href={media.photoUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={media.photoUrl}
            alt="Attachment"
            style={mediaStyle}
          />
        </a>
      )}
    </div>
  );
};

export default ReportImage;
