import React from "react";

import DetailField from "../../shared/DetailField";
import ReportImage from "../shared/ReportImage";

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
        <DetailField
          label="Requester Name"
          value={request.requester}
        />

        <DetailField
          label="Contact Number"
          value={request.phone}
        />

        <DetailField
          label="Email"
          value={request.email}
        />

        <DetailField
          label="Assistance Type"
          value={request.assistanceType}
        />

        <DetailField
          label="Urgency Level"
          value={request.urgency}
        />

        <DetailField
          label="People Needing Help"
          value={request.peopleAffected}
        />

        <DetailField
          label="Location"
          value={request.location}
        />

        <DetailField
          label="Situation / Description"
          value={request.description}
        />

        <DetailField
          label="Special Needs"
          value={request.specialNeeds || "None"}
        />

        <DetailField
          label="Date"
          value={request.date}
        />
      </div>

      <ReportImage photo={photo} />
    </div>
  );
};

export default AssistanceRequestDetails;