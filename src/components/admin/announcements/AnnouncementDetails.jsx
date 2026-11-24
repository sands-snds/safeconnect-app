import React from "react";
import { tx } from "../../../i18n/adminText";
import { stripFormatting } from "../../shared/FormattedText";

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

// The announcement's information, shown inside its card when the admin
// expands it (AnnouncementsTable): status, dates, who posted it, likes,
// comments and what's attached.
const AnnouncementDetails = ({ announcement: a }) => {
  const archived = Boolean(a.archivedAt);
  const edited = a.updatedAt && a.publishedAt && new Date(a.updatedAt) - new Date(a.publishedAt) > 60000;

  const rows = [
    [tx("Status"), archived ? tx("Archived") : tx("Active")],
    [tx("Category"), tx(a.category || "General")],
    [tx("Announcement date"), formatDay(a.rawDate) || a.date],
    [tx("Posted on"), formatDateTime(a.publishedAt)],
    edited ? [tx("Last edited"), formatDateTime(a.updatedAt)] : null,
    archived ? [tx("Archived on"), formatDateTime(a.archivedAt)] : null,
    a.postedBy ? [tx("Posted by"), a.postedBy] : null,
    [tx("Likes"), String(a.likeCount || 0)],
    [tx("Comments"), String(a.commentCount || 0)],
    [tx("Photo"), a.imageUrl ? tx("Uploaded photo") : a.sourceImage ? tx("From the news link") : tx("None")],
    a.sourceUrl ? [tx("News link"), a.sourceTitle || a.sourceSite || a.sourceUrl] : null,
    [tx("Message length"), tx("{{count}} characters", { count: stripFormatting(a.message).length })]
  ].filter((row) => row && row[1]);

  return (
    <section className="announcement-admin-details" aria-label={tx("Announcement information")}>
      <span className="announcement-admin-details-kicker">{tx("INFORMATION")}</span>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default AnnouncementDetails;
