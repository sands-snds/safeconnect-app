import React from "react";

import DetailField from "../../shared/DetailField";
import ReportImage from "../shared/ReportImage";
import ReportLocationMap from "../shared/ReportLocationMap";
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

        {report.isAnonymous ? (
          <DetailField
            label={isForOthers(report) ? "Reported By" : "Reporter"}
            value={
              <span>
                <i className="bi bi-incognito" style={{ marginRight: "6px" }}></i>
                Anonymous: the reporter chose to hide their name and contact number
              </span>
            }
          />
        ) : (
          <>
            <DetailField
              label={isForOthers(report) ? "Reported By" : "Reporter Name"}
              value={report.reporter}
            />

            <DetailField
              label={isForOthers(report) ? "Reporter Contact" : "Contact Number"}
              value={report.phone}
            />
          </>
        )}

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

      <ReportImage photo={photo} mediaType={report.mediaType || report.media_type} />

      <ReportLocationMap latitude={report.latitude} longitude={report.longitude} />
    </div>
  );
};

export default PettyCrimeReportDetails;