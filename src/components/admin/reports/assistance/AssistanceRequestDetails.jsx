import React from "react";

import ReportDetailsPanel from "../shared/ReportDetailsPanel";
import { isForOthers } from "../shared/ReportFor";
import { tx } from "../../../../i18n/adminText";

// An assistance request's opened row. The requester, help needed, location,
// people, date and status are already in the table row, so only the rest is
// here.
const AssistanceRequestDetails = ({ request, actions }) => (
  <ReportDetailsPanel
    type="assistance"
    report={request}
    accentColor="#6B2C3E"
    descriptionLabel="Situation / Description"
    personLabel={tx("Person Needing Help")}
    actions={actions}
    facts={[
      request.urgency && {
        icon: "bi-speedometer2",
        label: tx("Urgency Level"),
        value: tx(request.urgency),
        warn: /high|critical|urgent/i.test(request.urgency)
      },
      {
        icon: "bi-telephone-fill",
        label: isForOthers(request) ? tx("Requester Contact") : tx("Contact Number"),
        value: request.phone || tx("Not provided"),
        muted: !request.phone
      },
      request.email && { icon: "bi-envelope-fill", label: tx("Email"), value: request.email },
      {
        icon: "bi-heart-pulse-fill",
        label: tx("Special Needs"),
        value: request.specialNeeds || tx("None"),
        muted: !request.specialNeeds,
        warn: Boolean(request.specialNeeds)
      }
    ]}
  />
);

export default AssistanceRequestDetails;
