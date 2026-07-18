import api from "../../Services/api";

// Create announcement
export const createAnnouncement = async (formData) => {
  const response = await api.post("/announcements", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

// Update announcement
export const updateAnnouncement = async (id, formData) => {
  const response = await api.put(`/announcements/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

// Fetch article preview
export const fetchLinkPreview = async (url) => {
  const response = await api.get("/announcements/preview", {
    params: {
      url
    }
  });
  return response.data;
};