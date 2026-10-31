import React from "react";

import DetailField from "../../shared/DetailField";
import ReportImage from "../shared/ReportImage";
import ReportLocationMap from "../shared/ReportLocationMap";
import { ReportForDetails, isForOthers } from "../shared/ReportFor";
import { tx } from "../../../../i18n/adminText";

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
                {tx("Anonymous: the reporter chose to hide their name and contact number")}
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
          label={tx("Crime Type")}
          value={tx(report.crimeType)}
        />

        <DetailField
          label={tx("Location")}
          value={report.location}
        />

        <DetailField
          label={tx("Description")}
          value={report.description}
        />

        <DetailField
          label={tx("Suspect Information")}
          value={report.suspectInfo || "None"}
        />

        <DetailField
          label={tx("Report Date")}
          value={report.date}
        />

        <DetailField
          label={tx("Status")}
          value={report.status}
        />
      </div>

      <ReportImage photo={photo} mediaType={report.mediaType || report.media_type} />

      <ReportLocationMap latitude={report.latitude} longitude={report.longitude} />
    </div>
  );
};

export default PettyCrimeReportDetails;