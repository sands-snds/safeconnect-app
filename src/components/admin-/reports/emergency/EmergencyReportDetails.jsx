import React from "react";

import DetailField from "../../shared/DetailField";
import ReportImage from "../shared/ReportImage";

const EmergencyReportDetails = ({ report }) => {
  const photo =
    report.photoUrl ||
    report.photo_url ||
    report.imageUrl;

  return (
    <div
      style={{
        display: "flex",
        gap: "24px",
        flexWrap: "wrap"
      }}
    >
      <div
        style={{
          flex: "1 1 280px",
          minWidth: "260px"
        }}
      >
        <DetailField
          label="Reporter Name"
          value={report.reporter}
        />

        <DetailField
          label="Contact Number"
          value={report.phone}
        />

        <DetailField
          label="Emergency Type"
          value={report.emergency}
        />

        <DetailField
          label="Severity"
          value={report.severity}
        />

        <DetailField
          label="Location"
          value={report.location}
        />

        <DetailField
          label="Description"
          value={report.description}
        />

        <DetailField
          label="Date"
          value={report.date}
        />

        <DetailField
          label="Status"
          value={report.status}
        />
      </div>

      <ReportImage photo={photo} />
    </div>
  );
};

export default EmergencyReportDetails;