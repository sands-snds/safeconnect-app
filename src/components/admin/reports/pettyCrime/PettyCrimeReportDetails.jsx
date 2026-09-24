import React from "react";

import DetailField from "../../shared/DetailField";
import ReportImage from "../shared/ReportImage";
import { ReportForDetails, isForOthers } from "../shared/ReportFor";

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
        <ReportForDetails report={report} personLabel="Victim" />

        <DetailField
          label={isForOthers(report) ? "Reported By" : "Reporter Name"}
          value={report.reporter}
        />

        <DetailField
          label={isForOthers(report) ? "Reporter Contact" : "Contact Number"}
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