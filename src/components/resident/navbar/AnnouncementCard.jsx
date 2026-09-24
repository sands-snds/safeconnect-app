import React, { useState } from "react";

const hostnameOf = (url) => {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return "";
    }
};

// Shown for article links with no image (or one that fails to load), so the
// card shows which site the article is from instead of an empty box.
const MediaPlaceholder = ({ announcement }) => {
    const site = announcement.sourceSite || hostnameOf(announcement.sourceUrl);

    return (
        <a
            href={announcement.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="news-card-media news-card-placeholder"
        >
            <i className="bi bi-newspaper" />
            <span className="news-card-placeholder-site">{site || "External article"}</span>
            {announcement.sourceTitle && (
                <span className="news-card-placeholder-title">{announcement.sourceTitle}</span>
            )}
            <span className="news-card-placeholder-cta">
                Open article <i className="bi bi-box-arrow-up-right" />
            </span>
        </a>
    );
};

export default function AnnouncementCard({
    announcement,
    formatNewsDate
}) {
    const photo =
        announcement.imageUrl ||
        announcement.sourceImage;

    // External article images are sometimes blocked by the other site;
    // fall back to the placeholder instead of a broken image.
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = photo && !imageFailed;

    return (
        <div
            id={`news-item-${announcement.id}`}
            className="news-card"
        >
            {showImage ? (
                <div className="news-card-media">
                    <img
                        src={photo}
                        alt={announcement.title}
                        className="news-card-image"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={() => setImageFailed(true)}
                    />
                </div>
            ) : announcement.sourceUrl ? (
                // Plain text announcements get no media block at all; only
                // article links keep the placeholder (it links to the site).
                <MediaPlaceholder announcement={announcement} />
            ) : null}

            <div className="news-card-content">
                <span className="news-card-category">
                    {announcement.category}
                </span>

                <div className="news-card-date">
                    {formatNewsDate(
                        announcement.date
                    )}
                </div>

                <h3>
                    {announcement.title}
                </h3>

                <p>
                    {announcement.message}
                </p>

                {announcement.sourceUrl && (

                    <a
                        href={announcement.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-card-source-link"
                    >
                        <i className="bi bi-box-arrow-up-right"></i>
                        {" "}
                        Read full article
                        {(announcement.sourceSite || hostnameOf(announcement.sourceUrl)) &&
                            ` on ${announcement.sourceSite || hostnameOf(announcement.sourceUrl)}`}
                    </a>
                )}
            </div>
        </div>
    );
}
