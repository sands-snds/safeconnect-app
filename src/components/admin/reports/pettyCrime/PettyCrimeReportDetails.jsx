import React from "react";

import ReportDetailsPanel from "../shared/ReportDetailsPanel";
import { isForOthers } from "../shared/ReportFor";
import { tx } from "../../../../i18n/adminText";

// A petty crime report's opened row. The reporter, crime type, location, date
// and status are already in the table row, so only the rest is here.
const PettyCrimeReportDetails = ({ report, actions }) => (
  <ReportDetailsPanel
    type="pettyCrime"
    report={report}
    accentColor="#b45309"
    personLabel={tx("Victim")}
    actions={actions}
    facts={[
      report.isAnonymous
        ? {
            icon: "bi-incognito",
            label: isForOthers(report) ? tx("Reported By") : tx("Reporter"),
            value: tx("Anonymous: the reporter chose to hide their name and contact number")
          }
        : {
            icon: "bi-telephone-fill",
            label: isForOthers(report) ? tx("Reporter Contact") : tx("Contact Number"),
            value: report.phone || tx("Not provided"),
            muted: !report.phone
          },
      {
        icon: "bi-person-bounding-box",
        label: tx("Suspect Information"),
        value: report.suspectInfo || tx("None"),
        muted: !report.suspectInfo,
        warn: Boolean(report.suspectInfo)
      }
    ]}
  />
);

export default PettyCrimeReportDetails;
