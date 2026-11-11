import React, { useState, useEffect, useRef } from "react";
import { fetchLinkPreview, createAnnouncement, updateAnnouncement, isSessionError } from "../../../Services/api";
import { ANNOUNCEMENT_CATEGORIES, CATEGORY_COLORS } from "./constants";
import ResultPopup from "../../shared/ResultPopup";
import { tx } from "../../../i18n/adminText";

// Local-time YYYY-MM-DD for <input type="date">.
const toInputDate = (value) => {
  const d = value ? new Date(value) : null;
  if (!d || isNaN(d)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const CreateAnnouncementView = ({ editingAnnouncement, onCreated, onCancel, onArchiveToggle }) => {
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

  const [saveError, setSaveError] = useState("");
  // Which of the two optional extras shows: "photo" or "link" (both are kept).
  const [mediaTab, setMediaTab] = useState(editingAnnouncement?.sourceUrl ? "link" : "photo");
  const debounceRef = useRef(null);

  useEffect(() => {
    if (editingAnnouncement) {
      setTitle(editingAnnouncement.title || "");
      setCategory(editingAnnouncement.category || "Announcement");
      setMessage(editingAnnouncement.message || "");

      setDate(toInputDate(editingAnnouncement.rawDate) || today);
      setSourceUrl(editingAnnouncement.sourceUrl || "");
      setMediaTab(editingAnnouncement.sourceUrl ? "link" : "photo");
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
    setMediaTab("photo");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("title", title);
      payload.append("category", category);
      payload.append("message", message);
      payload.append("date", date || new Date().toISOString().slice(0, 10));

      if (sourceUrl.trim()) {
        payload.append("source_url", sourceUrl.trim());

        if (linkPreview) {
          if (linkPreview.title) payload.append("source_title", linkPreview.title);
          if (linkPreview.image) payload.append("source_image", linkPreview.image);
          if (linkPreview.site) payload.append("source_site", linkPreview.site);
        }
      }

      if (imageFile) {
        payload.append("image", imageFile);
      } else if (isEditMode && removeImage) {
        payload.append("remove_image", "1");
      }

      const result = isEditMode
        ? await updateAnnouncement(editingAnnouncement.id, payload)
        : await createAnnouncement(payload);

      if (isSessionError(result)) return;

      if (!result.success) {
        throw new Error(
          result.message || `Failed to ${isEditMode ? "update" : "create"} announcement.`
        );
      }

      resetForm();
      if (onCreated) onCreated({ edited: isEditMode });
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Changing the category wipes what was typed (asks first), as before.
  const chooseCategory = (newCategory) => {
    if (newCategory === category) return;
    const hasContent = title.trim() || message.trim() || imageFile || sourceUrl.trim();
    if (hasContent) {
      const confirmed = window.confirm(
        "Changing the category will clear all the information you've entered. Continue?"
      );
      if (!confirmed) return;
      setTitle("");
      setMessage("");
      setImageFile(null);
      setImageError("");
      setSourceUrl("");
      setLinkPreview(null);
      setDate(new Date().toISOString().split("T")[0]);
    }
    setCategory(newCategory);
  };

  // What residents will see: the new photo, else the current one, else the
  // linked article's picture.
  const previewImage = imagePreviewUrl
    || (isEditMode && existingImageUrl && !removeImage ? existingImageUrl : "")
    || linkPreview?.image
    || "";
  const pill = CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
  const ready = title.trim() && message.trim();

  return (
    <>
      {saveError && (
        <ResultPopup
          type="error"
          title={isEditMode ? "Couldn't Update Announcement" : "Couldn't Post Announcement"}
          message={saveError}
          onClose={() => setSaveError("")}
        />
      )}

      <form className="anf" onSubmit={handleSubmit}>
        <style>{FORM_STYLE}</style>
        <div className="anf-body">
          <div className="anf-fields">
            <div className="anf-field">
              <label htmlFor="anf-title" className="anf-label">{tx("Title")} <span className="anf-req">*</span></label>
              <input
                id="anf-title"
                type="text"
                className="anf-input"
                placeholder={tx("Announcement title")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <fieldset className="anf-field anf-fieldset">
              <legend className="anf-label">{tx("Category")} <span className="anf-req">*</span></legend>
              <div className="anf-chips">
                {ANNOUNCEMENT_CATEGORIES.map((option) => {
                  const on = option === category;
                  const c = CATEGORY_COLORS[option] || CATEGORY_COLORS.General;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={on}
                      className={`anf-chip${on ? " on" : ""}`}
                      style={on ? { background: c.bg, color: c.color, borderColor: c.color } : undefined}
                      onClick={() => chooseCategory(option)}
                    >
                      {tx(option)}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="anf-field">
              <div className="anf-row">
                <label htmlFor="anf-message" className="anf-label">{tx("Message")} <span className="anf-req">*</span></label>
                <span className="anf-count">{tx("{{count}} characters", { count: message.length })}</span>
              </div>
              <textarea
                id="anf-message"
                rows={6}
                className="anf-input anf-textarea"
                placeholder={tx("Write the announcement details...")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <div className="anf-field">
              <span className="anf-label">{tx("Add to it")} <span className="anf-optional">{tx("(optional)")}</span></span>
              <div className="anf-tabs" role="tablist" aria-label={tx("Photo or link")}>
                <button type="button" role="tab" aria-selected={mediaTab === "photo"} className={mediaTab === "photo" ? "on" : ""} onClick={() => setMediaTab("photo")}>
                  <i className="bi bi-image" aria-hidden="true"></i> {tx("Photo")}
                </button>
                <button type="button" role="tab" aria-selected={mediaTab === "link"} className={mediaTab === "link" ? "on" : ""} onClick={() => setMediaTab("link")}>
                  <i className="bi bi-link-45deg" aria-hidden="true"></i> {tx("News link")}
                </button>
              </div>

              {mediaTab === "photo" ? (
                <div role="tabpanel">
                  {imagePreviewUrl ? (
                    <div className="anf-picked">
                      <img src={imagePreviewUrl} alt={tx("Selected photo")} />
                      <div>
                        <strong>{imageFile?.name}</strong>
                        <button
                          type="button"
                          className="anf-link-btn danger"
                          onClick={() => {
                            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                            setImagePreviewUrl(null);
                            setImageFile(null);
                          }}
                        >
                          {tx("Remove photo")}
                        </button>
                      </div>
                    </div>
                  ) : isEditMode && existingImageUrl && !removeImage ? (
                    <div className="anf-picked">
                      <img src={existingImageUrl} alt={tx("Current photo")} />
                      <div>
                        <strong>{tx("Current photo")}</strong>
                        <span className="anf-actions">
                          <label className="anf-link-btn">
                            {tx("Replace")}
                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} hidden />
                          </label>
                          <button type="button" className="anf-link-btn danger" onClick={() => setRemoveImage(true)}>{tx("Remove")}</button>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <label className="anf-drop">
                      <span className="anf-drop-icon"><i className="bi bi-image" aria-hidden="true"></i></span>
                      <span>
                        <strong>{tx("Choose a photo")}</strong>
                        <small>{tx("JPEG, PNG or WEBP, up to 5 MB")}</small>
                      </span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} hidden />
                    </label>
                  )}
                  {isEditMode && removeImage && (
                    <p className="anf-note">
                      {tx("The current photo will be removed when you save.")}{" "}
                      <button type="button" className="anf-link-btn" onClick={() => setRemoveImage(false)}>{tx("Undo")}</button>
                    </p>
                  )}
                  {imageError && <p className="anf-error">{imageError}</p>}
                </div>
              ) : (
                <div role="tabpanel">
                  <input
                    type="url"
                    className="anf-input"
                    placeholder="https://..."
                    aria-label={tx("News article link")}
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                  />
                  {previewLoading && <p className="anf-note">{tx("Fetching article preview...")}</p>}
                  {previewError && <p className="anf-error">{previewError}</p>}
                  {linkPreview && (
                    <div className="anf-linkcard">
                      {linkPreview.image && <img src={linkPreview.image} alt="" />}
                      <div>
                        <strong>{linkPreview.title}</strong>
                        {linkPreview.site && <small>{linkPreview.site}</small>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="anf-preview" aria-label={tx("What residents will see")}>
            <div className="anf-row">
              <span className="anf-kicker">{tx("WHAT RESIDENTS WILL SEE")}</span>
              <span className="anf-count">{new Date(date).toLocaleDateString("en-US")}</span>
            </div>
            <article className="anf-card">
              {previewImage
                ? <img src={previewImage} alt="" className="anf-card-img" />
                : <div className="anf-card-img empty">{tx("No photo")}</div>}
              <div className="anf-card-body">
                <span className="anf-pill" style={{ background: pill.bg, color: pill.color }}>{tx(category)}</span>
                <h3>{title.trim() || tx("Announcement title")}</h3>
                <p>{message.trim() || tx("Write the announcement details...")}</p>
                {linkPreview?.site && <span className="anf-source"><i className="bi bi-box-arrow-up-right" aria-hidden="true"></i> {linkPreview.site}</span>}
                <div className="anf-card-actions"><span>{tx("Like")}</span><span>{tx("Comment")}</span><span>{tx("Share")}</span></div>
              </div>
            </article>
            <p className="anf-note">{isEditMode ? tx("The preview updates as you type.") : tx("The preview updates as you type. Every active resident also gets this by email.")}</p>
          </aside>
        </div>

        <footer className="anf-foot">
          {isEditMode && onArchiveToggle && (
            <button
              type="button"
              className="button button-soft"
              onClick={() => onArchiveToggle(editingAnnouncement)}
              disabled={submitting}
            >
              <i className={`bi ${editingAnnouncement.archivedAt ? "bi-box-arrow-up" : "bi-archive"}`} style={{ marginRight: 6 }} />
              {editingAnnouncement.archivedAt ? tx("Restore") : tx("Archive")}
            </button>
          )}
          <span className={`anf-status${ready ? " ok" : ""}`} role="status">
            {ready ? (isEditMode ? tx("Ready to save") : tx("Ready to post")) : tx("Add a title and a message.")}
          </span>
          {onCancel && (
            <button type="button" className="button button-secondary" onClick={onCancel} disabled={submitting}>
              {tx("Cancel")}
            </button>
          )}
          <button type="submit" className="button button-primary" disabled={submitting}>
            {submitting
              ? (isEditMode ? tx("Updating...") : tx("Saving..."))
              : (isEditMode ? tx("Update Announcement") : tx("Post announcement"))}
          </button>
        </footer>
      </form>
    </>
  );
};

// The redesigned form: fields on the left, a live preview of the resident's
// card on the right (below the fields on narrow screens), Cancel / Post fixed
// at the bottom of the window.
const FORM_STYLE = `
  .anf { display: flex; flex-direction: column; min-height: 0; flex: 1; }
  .anf-body { flex: 1; min-height: 0; overflow-y: auto; display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); }
  .anf-fields { padding: 22px 24px; display: flex; flex-direction: column; gap: 18px; border-right: 1px solid #f0eaec; }
  .anf-field { display: flex; flex-direction: column; gap: 6px; }
  .anf-fieldset { border: 0; padding: 0; margin: 0; }
  .anf-label { font-size: 13px; font-weight: 600; color: #374151; padding: 0; margin-bottom: 2px; }
  .anf-req { color: #dc2626; }
  .anf-optional { font-weight: 400; color: #6b7280; }
  .anf-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
  .anf-count { font-size: 12px; color: #6b7280; }
  .anf-input { width: 100%; height: 44px; border: 1px solid #d1d5db; border-radius: 10px; padding: 0 14px; font-size: 15px; font-family: inherit; background: #fff; box-sizing: border-box; }
  .anf-input:focus { outline: none; border-color: #6B2C3E; box-shadow: 0 0 0 3px rgba(107, 44, 62, .12); }
  .anf-textarea { height: auto; padding: 12px 14px; line-height: 1.5; resize: vertical; min-height: 140px; }
  .anf-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .anf-chip { min-height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid #d1d5db; background: #fff; color: #374151; font-size: 13px; font-weight: 600; cursor: pointer; }
  .anf-chip.on { border-width: 2px; font-weight: 700; }
  .anf-tabs { display: flex; background: #f3f4f6; border-radius: 10px; padding: 4px; gap: 4px; }
  .anf-tabs button { flex: 1; min-height: 38px; border: 0; border-radius: 8px; background: transparent; color: #374151; font-size: 13px; font-weight: 600; cursor: pointer; }
  .anf-tabs button.on { background: #fff; color: #6B2C3E; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,.12); }
  .anf-drop { display: flex; align-items: center; gap: 14px; padding: 16px; border: 2px dashed #d8c3c9; border-radius: 12px; background: #fcf8f9; cursor: pointer; margin-top: 8px; }
  .anf-drop strong { display: block; font-size: 14px; color: #1f2937; }
  .anf-drop small { font-size: 12.5px; color: #6b7280; }
  .anf-drop-icon { width: 48px; height: 48px; border-radius: 12px; background: #fff; border: 1px solid #ecdfe3; color: #6B2C3E; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .anf-picked { display: flex; align-items: center; gap: 14px; margin-top: 8px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .anf-picked img { width: 96px; height: 72px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
  .anf-picked strong { display: block; font-size: 13.5px; word-break: break-all; margin-bottom: 4px; }
  .anf-actions { display: flex; gap: 14px; }
  .anf-link-btn { background: none; border: 0; padding: 0; color: #6B2C3E; font-size: 13px; font-weight: 600; cursor: pointer; }
  .anf-link-btn.danger { color: #dc2626; }
  .anf-linkcard { display: flex; gap: 12px; align-items: center; margin-top: 10px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fafafa; }
  .anf-linkcard img { width: 96px; height: 72px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
  .anf-linkcard strong { display: block; font-size: 14px; }
  .anf-linkcard small { color: #6b7280; font-size: 12.5px; }
  .anf-note { margin: 8px 0 0; font-size: 12.5px; color: #6b7280; line-height: 1.5; }
  .anf-error { margin: 8px 0 0; font-size: 12.5px; color: #dc2626; font-weight: 600; }
  .anf-preview { padding: 22px 24px; background: #faf8f9; display: flex; flex-direction: column; gap: 12px; }
  .anf-kicker { font-size: 12px; font-weight: 700; color: #6b7280; letter-spacing: .05em; }
  .anf-card { background: #fff; border: 1px solid #ece4e6; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,.06); }
  .anf-card-img { display: block; width: 100%; height: 190px; object-fit: cover; }
  .anf-card-img.empty { display: flex; align-items: center; justify-content: center; background: #f3f4f6; color: #6b7280; font-size: 13px; }
  .anf-card-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
  .anf-card-body h3 { margin: 0; font-size: 17px; font-weight: 700; color: #111827; word-break: break-word; }
  .anf-card-body p { margin: 0; font-size: 13.5px; color: #4b5563; line-height: 1.5; white-space: pre-line; word-break: break-word; max-height: 12em; overflow: hidden; }
  .anf-pill { align-self: flex-start; font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
  .anf-source { font-size: 12.5px; color: #6B2C3E; font-weight: 600; }
  .anf-card-actions { display: flex; gap: 16px; padding-top: 8px; border-top: 1px solid #f3f4f6; font-size: 13px; color: #6b7280; font-weight: 600; }
  .anf-foot { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 14px 24px; border-top: 1px solid #f0eaec; background: #fff; }
  .anf-status { margin-right: auto; font-size: 13px; color: #6b7280; font-weight: 600; }
  .anf-status.ok { color: #15803d; }
  @media (max-width: 860px) {
    .anf-body { grid-template-columns: 1fr; }
    .anf-fields { border-right: 0; padding: 16px; }
    .anf-preview { padding: 16px; border-top: 1px solid #f0eaec; }
    .anf-input { font-size: 16px; }
    .anf-foot { padding: 12px 16px; }
    .anf-foot .button { flex: 1; }
    .anf-status { flex-basis: 100%; }
  }
`;

export default CreateAnnouncementView;