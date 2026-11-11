import React from "react";

import ReportDetailsPanel from "../shared/ReportDetailsPanel";
import { isForOthers } from "../shared/ReportFor";
import { tx } from "../../../../i18n/adminText";

// An emergency report's opened row. The reporter, type, location, people,
// date and status are already in the table row, so only the rest is here.
const EmergencyReportDetails = ({ report, actions }) => (
  <ReportDetailsPanel
    type="emergency"
    report={report}
    accentColor="#dc2626"
    personLabel={tx("Person Affected")}
    actions={actions}
    facts={[
      {
        icon: "bi-telephone-fill",
        label: isForOthers(report) ? tx("Reporter Contact") : tx("Contact Number"),
        value: report.phone || tx("Not provided"),
        muted: !report.phone
      },
      {
        icon: "bi-heart-pulse-fill",
        label: tx("Special Needs"),
        value: report.specialNeeds || tx("None"),
        muted: !report.specialNeeds,
        warn: Boolean(report.specialNeeds)
      }
    ]}
  />
);

export default EmergencyReportDetails;
