import React, { useEffect } from "react";
import FormattedText from "../../shared/FormattedText";
import { CATEGORY_COLORS } from "./constants";
import { tx } from "../../../i18n/adminText";

const formatDateTime = (value) => {
  const d = value ? new Date(value) : null;
  if (!d || isNaN(d)) return "";
  return d.toLocaleString("en-US", {
    month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
  });
};

const formatDay = (value) => {
  const d = value ? new Date(value) : null;
  if (!d || isNaN(d)) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

// View Details: the complete announcement (full message with its formatting,
// photo, link) and its information (status, dates, author, likes, comments).
// Read only; Edit / Archive stay on the card. Closes with X, Close, Esc or a
// click outside (nothing here can be lost).
const AnnouncementDetailsModal = ({ announcement, onClose, onEdit }) => {
  useEffect(() => {
    if (!announcement) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [announcement, onClose]);

  if (!announcement) return null;

  const a = announcement;
  const image = a.imageUrl || a.sourceImage;
  const archived = Boolean(a.archivedAt);
  const pill = CATEGORY_COLORS[a.category] || CATEGORY_COLORS.General;

  const info = [
    [tx("Status"), archived ? tx("Archived") : tx("Active")],
    [tx("Category"), tx(a.category || "General")],
    [tx("Announcement date"), formatDay(a.rawDate) || a.date],
    [tx("Posted on"), formatDateTime(a.publishedAt)],
    a.updatedAt && a.publishedAt && new Date(a.updatedAt) - new Date(a.publishedAt) > 60000
      ? [tx("Last edited"), formatDateTime(a.updatedAt)] : null,
    archived ? [tx("Archived on"), formatDateTime(a.archivedAt)] : null,
    a.postedBy ? [tx("Posted by"), a.postedBy] : null,
    [tx("Likes"), String(a.likeCount || 0)],
    [tx("Comments"), String(a.commentCount || 0)],
    [tx("Photo"), a.imageUrl ? tx("Uploaded photo") : a.sourceImage ? tx("From the news link") : tx("None")],
    [tx("Message length"), tx("{{count}} characters", { count: (a.message || "").length })],
  ].filter((row) => row && row[1]);

  return (
    <div className="and-overlay" onClick={onClose}>
      <style>{DETAILS_STYLE}</style>
      <div
        className="and-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="and-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="and-head">
          <span className="and-head-icon" aria-hidden="true"><i className="bi bi-file-earmark-text" /></span>
          <div className="and-head-text">
            <h2 id="and-title">{tx("Announcement Details")}</h2>
            <p>{archived ? tx("Archived: residents can't see it.") : tx("Shown on the residents' News page.")}</p>
          </div>
          <button type="button" className="and-x" onClick={onClose} aria-label={tx("Close")}>
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>

        <div className="and-body">
          <article className="and-main">
            {image && <img src={image} alt="" className="and-img" />}
            <div className="and-meta">
              <span className="and-pill" style={{ background: pill.bg, color: pill.color }}>{tx(a.category || "General")}</span>
              <span className="and-date">{a.date}</span>
            </div>
            <h3 className="and-title">{a.title}</h3>
            <FormattedText className="and-message" text={a.message} />
            {a.sourceUrl && (
              <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" className="and-source">
                <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
                <span>
                  <strong>{a.sourceTitle || a.sourceSite || tx("View article")}</strong>
                  <small>{a.sourceSite || a.sourceUrl}</small>
                </span>
              </a>
            )}
          </article>

          <aside className="and-info" aria-label={tx("Announcement information")}>
            <span className="and-kicker">{tx("INFORMATION")}</span>
            <dl>
              {info.map(([label, value]) => (
                <div key={label} className="and-row">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>

        <footer className="and-foot">
          {!archived && onEdit && (
            <button type="button" className="button button-soft" onClick={() => onEdit(a)}>
              <i className="bi bi-pencil-square" style={{ marginRight: 6 }} />{tx("Edit")}
            </button>
          )}
          <button type="button" className="button button-primary" onClick={onClose}>{tx("Close")}</button>
        </footer>
      </div>
    </div>
  );
};

const DETAILS_STYLE = `
  .and-overlay { position: fixed; inset: 0; background: rgba(17,17,17,.55); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
  .and-dialog { background: #fff; border-radius: 18px; width: 100%; max-width: 980px; max-height: calc(100dvh - 32px); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,.35); }
  .and-head { display: flex; align-items: center; gap: 14px; padding: 16px 24px; border-bottom: 1px solid #f0eaec; flex-shrink: 0; }
  .and-head-icon { width: 44px; height: 44px; border-radius: 12px; background: #f5e9ec; color: #6B2C3E; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .and-head-text { flex: 1; min-width: 0; }
  .and-head-text h2 { margin: 0; font-size: 19px; font-weight: 700; color: #111827; }
  .and-head-text p { margin: 2px 0 0; font-size: 13px; color: #6b7280; }
  .and-x { width: 44px; height: 44px; border: 0; border-radius: 10px; background: #f3f4f6; color: #374151; font-size: 18px; cursor: pointer; flex-shrink: 0; }
  .and-body { flex: 1; min-height: 0; overflow-y: auto; display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); }
  .and-main { padding: 22px 24px; display: flex; flex-direction: column; gap: 10px; border-right: 1px solid #f0eaec; }
  .and-img { width: 100%; max-height: 360px; object-fit: cover; border-radius: 12px; }
  .and-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .and-pill { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; padding: 4px 12px; border-radius: 999px; }
  .and-date { font-size: 12px; color: #6b7280; }
  .and-title { margin: 0; font-size: 21px; font-weight: 700; color: #111827; line-height: 1.3; overflow-wrap: anywhere; }
  .and-message { margin: 0; font-size: 15px; color: #4b5563; line-height: 1.7; }
  .and-message strong { color: #1f2937; }
  .and-source { display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 12px; color: #6B2C3E; text-decoration: none; }
  .and-source span { display: flex; flex-direction: column; min-width: 0; }
  .and-source strong { font-size: 14px; color: #111827; }
  .and-source small { font-size: 12.5px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .and-info { padding: 22px 24px; background: #faf8f9; }
  .and-kicker { font-size: 12px; font-weight: 700; color: #6b7280; letter-spacing: .05em; }
  .and-info dl { margin: 10px 0 0; }
  .and-row { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid #efe7e9; }
  .and-row:last-child { border-bottom: 0; }
  .and-row dt { font-size: 13px; color: #6b7280; font-weight: 600; }
  .and-row dd { margin: 0; font-size: 13.5px; color: #111827; font-weight: 600; text-align: right; overflow-wrap: anywhere; }
  .and-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 24px; border-top: 1px solid #f0eaec; background: #fff; flex-shrink: 0; }
  @media (max-width: 860px) {
    .and-body { grid-template-columns: 1fr; }
    .and-main { border-right: 0; padding: 16px; }
    .and-info { padding: 16px; border-top: 1px solid #f0eaec; }
    .and-head { padding: 12px 16px; }
    .and-foot { padding: 12px 16px; }
    .and-foot .button { flex: 1; }
  }
`;

export default AnnouncementDetailsModal;
