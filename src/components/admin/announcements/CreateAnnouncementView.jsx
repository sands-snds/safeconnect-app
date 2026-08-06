import React, { useState, useEffect, useRef } from "react";
import { fetchLinkPreview, createAnnouncement, updateAnnouncement } from "../../../Services/api";
import { ANNOUNCEMENT_CATEGORIES } from "./constants";

const CreateAnnouncementView = ({ editingAnnouncement, onCreated, onCancel }) => {
  const isEditMode = !!editingAnnouncement;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Announcement");
  const [message, setMessage] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [imageError, setImageError] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [linkPreview, setLinkPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (editingAnnouncement) {
      setTitle(editingAnnouncement.title || "");
      setCategory(editingAnnouncement.category || "Announcement");
      setMessage(editingAnnouncement.message || "");
      setDate(editingAnnouncement.date || "");
      setSourceUrl(editingAnnouncement.sourceUrl || "");
      setExistingImageUrl(editingAnnouncement.imageUrl || "");
      setRemoveImage(false);
      setImageFile(null);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
      setImageError("");
      setPreviewError("");

      if (
        editingAnnouncement.sourceTitle ||
        editingAnnouncement.sourceImage ||
        editingAnnouncement.sourceSite
      ) {
        setLinkPreview({
          title: editingAnnouncement.sourceTitle,
          image: editingAnnouncement.sourceImage,
          site: editingAnnouncement.sourceSite
        });
      } else {
        setLinkPreview(null);
      }
    } else {
      resetForm();
    }
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
      loadPreview(sourceUrl.trim());
    }, 700);
    return () => clearTimeout(debounceRef.current);
  }, [sourceUrl]);

  const loadPreview = async (url) => {
    setPreviewLoading(true);
    setPreviewError("");

    const result = await fetchLinkPreview(url);

    if (!result.success) {
      setPreviewError(result.message || "Unable to fetch preview.");
      setLinkPreview(null);
    } else {
      setLinkPreview(result);
    }

    setPreviewLoading(false);
  };

  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageError("");

    if (!file) {
      setImageFile(null);
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Only JPEG, PNG, or WEBP images are allowed.");
      e.target.value = "";
      return;
    }

    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(URL.createObjectURL(file));
    setImageFile(file);
    setRemoveImage(false);
  };

  useEffect(() => {
    // Revoke the object URL when it changes or the form unmounts, so we
    // don't leak memory across repeated image selections.
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const resetForm = () => {
    setTitle("");
    setCategory("Announcement");
    setMessage("");
    setDate(new Date().toISOString().split("T")[0]);
    setImageFile(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
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
      const announcement = {
        title,
        category,
        message,
        date: date || new Date().toISOString().slice(0, 10),
        sourceUrl: sourceUrl.trim() || null,
        imageFile,
        removeImage: isEditMode && removeImage
      };

      const result = isEditMode
        ? await updateAnnouncement(editingAnnouncement.id, announcement)
        : await createAnnouncement(announcement);

      if (!result.success) {
        throw new Error(
          result.message || `Failed to ${isEditMode ? "update" : "create"} announcement.`
        );
      }

      resetForm();
      if (onCreated) onCreated();

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
      <div className="section" style={{ padding: "24px" }}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Announcement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Category *</label>

              <select
                className="form-select"
                value={category}
                onChange={(e) => {
                  const newCategory = e.target.value;

                  const hasContent =
                    title.trim() ||
                    message.trim() ||
                    imageFile ||
                    sourceUrl.trim();

                  if (hasContent) {
                    const confirmed = window.confirm(
                      "Changing the category will clear all the information you've entered. Continue?"
                    );

                    if (!confirmed) {
                      return;
                    }

                    // Reset form
                    setTitle("");
                    setMessage("");
                    setImageFile(null);
                    setImageError("");
                    setSourceUrl("");
                    setLinkPreview(null);

                    // Keep today's date
                    setDate(new Date().toISOString().split("T")[0]);
                  }

                  setCategory(newCategory);
                }}
              >
                {ANNOUNCEMENT_CATEGORIES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Date Posted</label>

              <input
                type="text"
                className="form-input"
                value={new Date(date).toLocaleDateString("en-US")}
                readOnly
                style={{
                  background: "#f9fafb",
                  cursor: "not-allowed"
                }}
              />

              <small
                style={{
                  color: "#6b7280",
                  display: "block",
                  marginTop: "6px"
                }}
              >
                Automatically uses today's date.
              </small>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Message *</label>
            <textarea
              rows={6}
              className="form-textarea"
              placeholder="Write the announcement details..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Upload Image (JPEG, PNG, or WEBP)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="form-input"
                onChange={handleImageChange}
              />
              {imageError && (
                <span style={{ color: "red", fontSize: ".8rem" }}>{imageError}</span>
              )}

              {imagePreviewUrl && (
                <div style={{ marginTop: "10px" }}>
                  <div style={{ fontSize: ".75rem", fontWeight: 600, color: "#6b7280", marginBottom: "6px" }}>
                    PREVIEW
                  </div>
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <img
                      src={imagePreviewUrl}
                      alt="Selected preview"
                      style={{ width: "260px", height: "150px", objectFit: "cover", borderRadius: "10px", border: "1px solid #e5e7eb" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                        setImagePreviewUrl(null);
                        setImageFile(null);
                      }}
                      title="Remove selected image"
                      style={{
                        position: "absolute", top: "8px", right: "8px",
                        width: "26px", height: "26px", borderRadius: "50%",
                        border: "none", background: "rgba(17,24,39,0.7)", color: "#fff",
                        cursor: "pointer", fontSize: "14px", lineHeight: "26px", padding: 0
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ fontSize: ".75rem", color: "#6b7280", marginTop: "4px" }}>
                    {imageFile?.name}
                  </div>
                </div>
              )}

              {isEditMode && existingImageUrl && !imageFile && !removeImage && (
                <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <img
                    src={existingImageUrl}
                    alt="Current"
                    style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e5e7eb" }}
                  />
                  <button
                    type="button"
                    onClick={() => setRemoveImage(true)}
                    style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: ".8rem", padding: 0 }}
                  >
                    Remove current image
                  </button>
                </div>
              )}

              {isEditMode && removeImage && (
                <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px", fontSize: ".8rem", color: "#6b7280" }}>
                  Current image will be removed on save.
                  <button
                    type="button"
                    onClick={() => setRemoveImage(false)}
                    style={{ background: "none", border: "none", color: "#6B2C3E", cursor: "pointer", fontSize: ".8rem", padding: 0 }}
                  >
                    Undo
                  </button>
                </div>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">News Article URL (optional)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />
            </div>
          </div>

          {previewLoading && (
            <div style={{ marginTop: "15px", color: "#6b7280", fontSize: ".9rem" }}>
              Fetching article preview...
            </div>
          )}

          {previewError && (
            <div style={{ marginTop: "15px", color: "#dc2626", fontSize: ".9rem" }}>
              {previewError}
            </div>
          )}

          {linkPreview && (
            <div style={{ marginTop: "20px", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px", display: "flex", gap: "16px", alignItems: "center", background: "#fafafa" }}>
              {linkPreview.image && (
                <img
                  src={linkPreview.image}
                  alt="Preview"
                  style={{ width: "120px", height: "90px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }}
                />
              )}
              <div>
                <h5 style={{ margin: "0 0 6px", fontWeight: 600 }}>{linkPreview.title}</h5>
                {linkPreview.site && (
                  <p style={{ margin: 0, color: "#6b7280", fontSize: ".9rem" }}>{linkPreview.site}</p>
                )}
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "25px" }}>
            {onCancel && (
              <button type="button" className="button button-secondary" onClick={onCancel} disabled={submitting}>
                Cancel
              </button>
            )}
            <button type="submit" className="button button-primary" disabled={submitting}>
              {submitting
                ? (isEditMode ? "Updating..." : "Saving...")
                : (isEditMode ? "Update Announcement" : "Post Announcement")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAnnouncementView;
