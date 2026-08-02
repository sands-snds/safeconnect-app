import React from "react";

export default function AnnouncementCard({
    announcement,
    formatNewsDate
}) {
    const photo =
        announcement.imageUrl ||
        announcement.sourceImage;

    return (
        <div
            id={`news-item-${announcement.id}`}
            className="news-card"
        >
            <div
                className="news-card-media"
                style={{
                    backgroundImage: photo
                        ? `url(${photo})`
                        : undefined
                }}
            />
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
                        {announcement.sourceSite &&
                            ` on ${announcement.sourceSite}`}
                    </a>
                )}
            </div>
        </div>
    );
}