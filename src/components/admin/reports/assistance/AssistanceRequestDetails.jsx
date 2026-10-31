import React from "react";

import DetailField from "../../shared/DetailField";
import ReportImage from "../shared/ReportImage";
import ReportLocationMap from "../shared/ReportLocationMap";
import { ReportForDetails, isForOthers } from "../shared/ReportFor";
import { tx } from "../../../../i18n/adminText";

const AssistanceRequestDetails = ({ request }) => {
  const photo =
    request.photoUrl ||
    request.photo_url ||
    request.imageUrl;

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
        <ReportForDetails report={request} personLabel="Person Needing Help" />

        <DetailField
          label={isForOthers(request) ? "Requested By" : "Requester Name"}
          value={request.requester}
        />

        <DetailField
          label={isForOthers(request) ? "Requester Contact" : "Contact Number"}
          value={request.phone}
        />

        <DetailField
          label={tx("Email")}
          value={request.email}
        />

        <DetailField
          label={tx("Assistance Type")}
          value={tx(request.assistanceType)}
        />

        <DetailField
          label={tx("Victim of Emergency")}
          value={tx(request.victimOfEmergency)}
        />

        {/* Only older requests have one: residents no longer choose an urgency. */}
        {request.urgency && (
          <DetailField
            label={tx("Urgency Level")}
            value={request.urgency}
          />
        )}

        <DetailField
          label={tx("People Needing Help")}
          value={request.peopleAffected}
        />

        <DetailField
          label={tx("Location")}
          value={request.location}
        />

        <DetailField
          label={tx("Situation / Description")}
          value={request.description}
        />

        <DetailField
          label={tx("Special Needs")}
          value={request.specialNeeds || "None"}
        />

        <DetailField
          label={tx("Date")}
          value={request.date}
        />
      </div>

      <ReportImage photo={photo} mediaType={request.mediaType || request.media_type} />

      <ReportLocationMap latitude={request.latitude} longitude={request.longitude} />
    </div>
  );
};

export default AssistanceRequestDetails;