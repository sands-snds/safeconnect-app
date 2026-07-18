import React from "react";
import ImageUploadField from "./ImageUploadField";
import LinkPreviewCard from "./LinkPreviewCard";
import { ANNOUNCEMENT_CATEGORIES } from "./constants";

const AnnouncementForm = ({
  isEditMode,

  title,
  setTitle,

  category,
  setCategory,

  message,
  setMessage,

  date,
  setDate,

  imageFile,
  imageError,
  existingImageUrl,
  removeImage,
  setRemoveImage,
  handleImageChange,

  sourceUrl,
  setSourceUrl,

  previewLoading,
  previewError,
  linkPreview,

  submitting,

  onSubmit,
  onCancel
}) => {
  return (
    <div>
      <h1 className="font-bold text-2xl mb-5">
        {isEditMode ? "EDIT ANNOUNCEMENT" : "CREATE ANNOUNCEMENT"}
      </h1>

      <div
        className="section"
        style={{
          padding: "24px"
        }}
      >
        <form onSubmit={onSubmit}>
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
                onChange={(e) => setTitle(e.target.value)}
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
                onChange={(e) => setCategory(e.target.value)}
              >
                {ANNOUNCEMENT_CATEGORIES.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
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
                onChange={(e) => setDate(e.target.value)}
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
              onChange={(e) => setMessage(e.target.value)}
              required
            />

          </div>

          <div className="form-grid">

            <ImageUploadField
              isEditMode={isEditMode}
              imageError={imageError}
              imageFile={imageFile}
              existingImageUrl={existingImageUrl}
              removeImage={removeImage}
              handleImageChange={handleImageChange}
              setRemoveImage={setRemoveImage}
            />

            <div className="form-field">

              <label className="form-label">
                News Article URL (optional)
              </label>

              <input
                type="url"
                className="form-input"
                placeholder="https://..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />

            </div>

          </div>

          <LinkPreviewCard
            previewLoading={previewLoading}
            previewError={previewError}
            linkPreview={linkPreview}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "25px"
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

export default AnnouncementForm;