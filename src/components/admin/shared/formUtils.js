














export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  });
};


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
