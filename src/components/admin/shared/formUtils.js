// Form helpers shared by the "Add New Report" modal flow.
//
// This used to exist as three separate, slightly different copies:
//   - modals/formUtils.js + modals/formHandlers.js (unused, and formHandlers.js
//     had a bug where the exported function only defined an identical inner
//     function and never called it)
//   - an inline copy inside hooks/useAdminData.js (the one actually running)
// This is now the one copy. hooks/useAdminData.js calls the builders below.
//
// Field names in the returned object match what reportService.js /
// assistanceRequestService.js read off req.body on the backend (the same
// shape the resident-facing modals submit) — NOT the display shape used by
// the report tables (that comes back from fetchEmergencyReports() etc.
// after the record is created, see useAdminData.js).

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  });
};

// Turns the raw <FormModal> FormData into an emergency report submission.
export const buildEmergencyReportFromForm = (formData) => ({
  emergencyType: formData.get("emergency"),
  severity: formData.get("severity"),
  name: formData.get("reporter"),
  contact: formData.get("phone"),
  location: formData.get("location"),
  details: formData.get("description"),
  people: 0,
  special: null,
  photoUrl: null,
  mediaType: null
});

// Turns the raw <FormModal> FormData into an assistance request submission.
export const buildAssistanceRequestFromForm = (formData) => ({
  type: formData.get("assistanceType"),
  fullname: formData.get("requester"),
  contact: formData.get("phone"),
  email: formData.get("email"),
  location: formData.get("location"),
  situation: formData.get("description"),
  urgency: "Medium",
  special: null,
  peopleAffected: formData.get("peopleAffected") || 1
});
