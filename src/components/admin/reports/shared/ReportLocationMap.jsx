import React from "react";
import LocationPickerMap from "../../../shared/location/LocationPickerMap";
import { isWithinSantaFe } from "../../../shared/location/santaFeArea";

// Where the resident pinned the report, for the report details view.
// Renders nothing for reports without a pin (older reports, or typed
// address only).
const ReportLocationMap = ({ latitude, longitude }) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (latitude == null || longitude == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const outside = !isWithinSantaFe(lat, lng);

  return (
    <div style={{ marginTop: "20px", width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "8px"
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
          Pinned Location
        </span>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: "13px", fontWeight: 600, color: "#6B2C3E", textDecoration: "none" }}
        >
          <i className="bi bi-sign-turn-right-fill"></i> Directions in Google Maps
        </a>
      </div>

      <LocationPickerMap pin={{ lat, lng }} isOutside={outside} readOnly height={260} />

      <div style={{ marginTop: "6px", fontSize: "12px", color: "#6b7280" }}>
        {lat.toFixed(6)}, {lng.toFixed(6)}
        {outside && (
          <span style={{ color: "#b91c1c", fontWeight: 600 }}> · Outside Barangay Sta. Fe</span>
        )}
      </div>
    </div>
  );
};

export default ReportLocationMap;
