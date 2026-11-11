import React, { useState } from "react";
import useReportMedia from "../../../shared/useReportMedia";
import MediaLightbox from "../../../shared/media/MediaLightbox";
import { tx } from "../../../../i18n/adminText";

// Further than this from the report's pin, the photo counts as taken
// somewhere else (phone GPS and a looked-up home address are both rough).
const LOCATION_TOLERANCE_M = 300;

const distanceM = (a, b) => {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
};

// What staff should know about the media, from the backend's check of its
// details: taken the day before, or taken away from the report's location.
const mediaWarnings = (report) => {
  const check = report.mediaCheck || {};
  const warnings = [];
  if ((check.flags || []).includes("day_old")) warnings.push(tx("Taken a day before the report"));
  const lat = Number(report.latitude);
  const lng = Number(report.longitude);
  if (check.latitude != null && check.longitude != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    const meters = distanceM({ lat: check.latitude, lng: check.longitude }, { lat, lng });
    if (meters > LOCATION_TOLERANCE_M) {
      warnings.push(`${tx("Image not taken at the report's location")} (${tx("about {{distance}} away", { distance: meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m` })})`);
    }
  }
  return warnings;
};

// The report's photo or video, loaded only when its details are open
// (the report lists leave the media out and only say hasMedia). Clicking it
// opens it full size on the same page.
const ReportImage = ({ type, report }) => {
  const { id, hasMedia, mediaType } = report;
  const { media, loading, failed } = useReportMedia(type, id, hasMedia);
  const [open, setOpen] = useState(false);
  if (!hasMedia) return null;

  const kind = media?.mediaType || mediaType;
  const isVideo = kind === "video" || Boolean(media?.photoUrl.startsWith("data:video/"));
  const takenAt = report.mediaCheck?.takenAt ? new Date(report.mediaCheck.takenAt) : null;
  const warnings = mediaWarnings(report);
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
        flex: "0 0 auto",
        maxWidth: "240px"
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
        <div>
          <video src={media.photoUrl} controls controlsList="nodownload" style={{ ...mediaStyle, background: "#000" }} />
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{ display: "block", marginTop: 4, padding: 0, border: "none", background: "none", color: "#2563eb", fontSize: ".8rem", fontWeight: 600, cursor: "pointer" }}
          >
            <i className="bi bi-arrows-fullscreen" aria-hidden="true"></i> {tx("View full size")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={tx("View full size")}
          style={{ display: "block", padding: 0, border: "none", background: "none", cursor: "zoom-in" }}
        >
          <img src={media.photoUrl} alt={tx("Attachment")} style={mediaStyle} />
        </button>
      )}

      {(report.mediaCheck?.flags || []).includes("camera_no_date") && (
        <div style={{ marginTop: 6, fontSize: ".78rem", color: "#6b7280" }}>
          <i className="bi bi-camera" aria-hidden="true"></i> {tx("Taken with the form's camera (the photo has no date in its details)")}
        </div>
      )}
      {takenAt && !Number.isNaN(takenAt.getTime()) && (
        <div style={{ marginTop: 6, fontSize: ".78rem", color: "#6b7280" }}>
          <i className="bi bi-camera" aria-hidden="true"></i>{" "}
          {tx("Taken {{date}}", {
            date: takenAt.toLocaleString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
          })}
        </div>
      )}
      {warnings.map((w) => (
        <div key={w} role="note" style={{ marginTop: 4, fontSize: ".78rem", fontWeight: 600, color: "#dc2626", lineHeight: 1.35 }}>
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true"></i> {w}
        </div>
      ))}

      <MediaLightbox
        src={open && media ? media.photoUrl : null}
        isVideo={isVideo}
        alt={tx("Attachment")}
        closeLabel={tx("Close")}
        onClose={() => setOpen(false)}
      />
    </div>
  );
};

export default ReportImage;
