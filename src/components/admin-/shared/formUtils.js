// Form helpers shared by the "Add New Report" modal flow.
//
// This used to exist as three separate, slightly different copies:
//   - modals/formUtils.js + modals/formHandlers.js (unused, and formHandlers.js
//     had a bug where the exported function only defined an identical inner
//     function and never called it)
//   - an inline copy inside hooks/useAdminData.js (the one actually running)
// This is now the one copy. hooks/useAdminData.js calls the builders below.

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  });
};

// Turns the raw <FormModal> FormData into a new emergency report record.
export const buildEmergencyReportFromForm = (formData, currentList) => ({
  id: currentList.length + 1,
  reporter: formData.get("reporter"),
  phone: formData.get("phone"),
  emergency: formData.get("emergency"),
  severity: formData.get("severity"),
  location: formData.get("location"),
  description: formData.get("description"),
  date: formatDate(formData.get("date")),
  status: "Received"
});

// Turns the raw <FormModal> FormData into a new assistance request record.
export const buildAssistanceRequestFromForm = (formData, currentList) => ({
  id: currentList.length + 1,
  requester: formData.get("requester"),
  phone: formData.get("phone"),
  email: formData.get("email"),
  assistanceType: formData.get("assistanceType"),
  peopleAffected: parseInt(formData.get("peopleAffected")),
  location: formData.get("location"),
  description: formData.get("description"),
  date: formatDate(formData.get("date")),
  status: "Pending"
});
