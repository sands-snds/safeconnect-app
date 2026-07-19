import React from "react";

import DetailField from "../../shared/DetailField";
import ReportImage from "../shared/ReportImage";

const PettyCrimeReportDetails = ({ report }) => {
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
          label="Crime Type"
          value={report.crimeType}
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
          label="Suspect Information"
          value={report.suspectInfo || "None"}
        />

        <DetailField
          label="Report Date"
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

export default PettyCrimeReportDetails;