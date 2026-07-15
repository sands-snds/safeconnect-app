import React, { useState, useEffect, useRef } from "react";


const API_BASE = "http://localhost/safeconnect-app/backend";

const CreateAnnouncementView = ({ editingAnnouncement, onCreated, onCancel }) => {

  const isEditMode = !!editingAnnouncement;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Announcement");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [removeImage, setRemoveImage] = useState(false);

  const [sourceUrl, setSourceUrl] = useState("");
  const [linkPreview, setLinkPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const debounceRef = useRef(null);

  // When we're handed an announcement to edit, pre-fill every field.
  // When editingAnnouncement goes back to null (e.g. after a cancel/save),
  // fall back to a clean, empty form.
  useEffect(() => {
    if (editingAnnouncement) {
      setTitle(editingAnnouncement.title || "");
      setCategory(editingAnnouncement.category || "Announcement");
      setMessage(editingAnnouncement.message || "");
      setDate(editingAnnouncement.date_posted || "");
      setSourceUrl(editingAnnouncement.source_url || "");
      setExistingImageUrl(editingAnnouncement.image_path || "");
      setRemoveImage(false);
      setImageFile(null);
      setImageError("");
      setPreviewError("");

      if (
        editingAnnouncement.source_title ||
        editingAnnouncement.source_image ||
        editingAnnouncement.source_site
      ) {
        setLinkPreview({
          title: editingAnnouncement.source_title,
          image: editingAnnouncement.source_image,
          site: editingAnnouncement.source_site,
        });
      } else {
        setLinkPreview(null);
      }
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingAnnouncement]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!sourceUrl.trim()) {
      setLinkPreview(null);
      setPreviewError("");
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchPreview(sourceUrl.trim());
    }, 700);

    return () => clearTimeout(debounceRef.current);
  }, [sourceUrl]);

  const fetchPreview = async (url) => {
    setPreviewLoading(true);
    setPreviewError("");

    try {
      const response = await fetch(
        `${API_BASE}/announcements.php?action=link-preview&url=${encodeURIComponent(
          url
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        setPreviewError(data.message || "Unable to fetch preview.");
        setLinkPreview(null);
      } else {
        setLinkPreview(data);
      }
    } catch (err) {
      setPreviewError("Could not connect to the server.");
      setLinkPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    setImageError("");

    if (!file) {
      setImageFile(null);
      return;
    }

    if (file.type !== "image/jpeg") {
      setImageError("Only JPEG images are allowed.");
      e.target.value = "";
      return;
    }

    setImageFile(file);
    setRemoveImage(false);
  };

  const resetForm = () => {
    setTitle("");
    setCategory("Announcement");
    setMessage("");
    setDate("");
    setImageFile(null);
    setExistingImageUrl("");
    setRemoveImage(false);
    setSourceUrl("");
    setLinkPreview(null);
    setPreviewError("");
    setImageError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("title", title);
      formData.append("category", category);
      formData.append("message", message);

      formData.append(
        "date",
        date || new Date().toISOString().slice(0, 10)
      );

      if (imageFile) {
        formData.append("image", imageFile);
      } else if (isEditMode && removeImage) {
        formData.append("remove_image", "1");
      }

      if (sourceUrl.trim()) {
        formData.append("source_url", sourceUrl.trim());
      }

      if (isEditMode) {
        formData.append("id", editingAnnouncement.id);
      }

      const action = isEditMode ? "update" : "create";

      const response = await fetch(
        `${API_BASE}/announcements.php?action=${action}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            `Failed to ${isEditMode ? "update" : "create"} announcement.`
        );
      }

      resetForm();

      if (onCreated) {
        onCreated();
      }

      alert(
        isEditMode
          ? "Announcement updated successfully!"
          : "Announcement posted successfully!"
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="font-bold text-2xl mb-5">
        {isEditMode ? "EDIT ANNOUNCEMENT" : "CREATE ANNOUNCEMENT"}
      </h1>

      <div
        className="section"
        style={{ padding: "24px" }}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            <div className="form-field">
              <label className="form-label">
                Title *
              </label>

              <input
                type="text"
                className="form-input"
                placeholder="Announcement title"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                Category *
              </label>

              <select
                className="form-select"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
              >
                <option>General</option>
                <option>Announcement</option>
                <option>Emergency Alert</option>
                <option>Weather Advisory</option>
                <option>Community Update</option>
                <option>Community Event</option>
                <option>Evacuation</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">
                Date *
              </label>

              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
              />
            </div>

          </div>

          <div className="form-field">
            <label className="form-label">
              Message *
            </label>

            <textarea
              rows={6}
              className="form-textarea"
              placeholder="Write the announcement details..."
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              required
            />
          </div>

          <div className="form-grid">

            <div className="form-field">
              <label className="form-label">
                Upload Image (JPEG only)
              </label>

              <input
                type="file"
                accept="image/jpeg"
                className="form-input"
                onChange={handleImageChange}
              />

              {imageError && (
                <span
                  style={{
                    color: "red",
                    fontSize: ".8rem",
                  }}
                >
                  {imageError}
                </span>
              )}

              {isEditMode && existingImageUrl && !imageFile && !removeImage && (
                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <img
                    src={existingImageUrl}
                    alt="Current"
                    style={{
                      width: "56px",
                      height: "56px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "1px solid #e5e7eb",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setRemoveImage(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#dc2626",
                      cursor: "pointer",
                      fontSize: ".8rem",
                      padding: 0,
                    }}
                  >
                    Remove current image
                  </button>
                </div>
              )}

              {isEditMode && removeImage && (
                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: ".8rem",
                    color: "#6b7280",
                  }}
                >
                  Current image will be removed on save.
                  <button
                    type="button"
                    onClick={() => setRemoveImage(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#6B2C3E",
                      cursor: "pointer",
                      fontSize: ".8rem",
                      padding: 0,
                    }}
                  >
                    Undo
                  </button>
                </div>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">
                News Article URL (optional)
              </label>

              <input
                type="url"
                className="form-input"
                placeholder="https://..."
                value={sourceUrl}
                onChange={(e) =>
                  setSourceUrl(e.target.value)
                }
              />
            </div>

          </div>
                    {previewLoading && (
            <div
              style={{
                marginTop: "15px",
                color: "#6b7280",
                fontSize: ".9rem",
              }}
            >
              Fetching article preview...
            </div>
          )}

          {previewError && (
            <div
              style={{
                marginTop: "15px",
                color: "#dc2626",
                fontSize: ".9rem",
              }}
            >
              {previewError}
            </div>
          )}

          {linkPreview && (
            <div
              style={{
                marginTop: "20px",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                gap: "16px",
                alignItems: "center",
                background: "#fafafa",
              }}
            >
              {linkPreview.image && (
                <img
                  src={linkPreview.image}
                  alt="Preview"
                  style={{
                    width: "120px",
                    height: "90px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    flexShrink: 0,
                  }}
                />
              )}

              <div>
                <h5
                  style={{
                    margin: "0 0 6px",
                    fontWeight: 600,
                  }}
                >
                  {linkPreview.title}
                </h5>

                {linkPreview.site && (
                  <p
                    style={{
                      margin: 0,
                      color: "#6b7280",
                      fontSize: ".9rem",
                    }}
                  >
                    {linkPreview.site}
                  </p>
                )}
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "25px",
            }}
          >
            {onCancel && (
              <button
                type="button"
                className="button button-secondary"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="button button-primary"
              disabled={submitting}
            >
              {submitting
                ? isEditMode
                  ? "Updating..."
                  : "Saving..."
                : isEditMode
                ? "Update Announcement"
                : "Post Announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAnnouncementView;