import React from "react";
import AnnouncementCard from "./AnnouncementCard";
import WeatherCard from "./WeatherCard";

const NewsOverlay = ({
    isOpen,
    onClose,

    weather,
    announcements,

    announcementsLoading,
    announcementsError,

    formatNewsDate,
    describeWeatherCode,

    RAIN_ALERT_THRESHOLD
}) => {

    return (
        <div
            className={`news-fullscreen ${isOpen ? "show" : ""}`}
        >
            <div className="news-fullscreen-header">
                <h2>
                    <i className="bi bi-newspaper"></i>
                    {" "}
                    Latest News
                </h2>

                <button
                    className="news-close-btn"
                    onClick={onClose}
                    aria-label="Close news"
                >
                    <i className="bi bi-x-lg"></i>
                </button>

            </div>

            <div className="news-fullscreen-body">

                {announcementsLoading &&
                    announcements.length === 0 &&
                    !weather && (
                        <div className="news-state-message">
                            Loading news...
                        </div>
                    )}

                {!announcementsLoading &&
                    announcementsError &&
                    announcements.length === 0 &&
                    !weather && (
                        <div className="news-state-message">
                            {announcementsError}
                        </div>
                    )}

                {!announcementsLoading &&
                    !announcementsError &&
                    announcements.length === 0 &&
                    !weather && (
                        <div className="news-state-message">
                            No announcements yet.
                            Check back soon.
                        </div>
                    )}

                {(announcements.length > 0 || weather) && (
                    <div className="news-list">
                        <WeatherCard
                            weather={weather}
                            formatNewsDate={formatNewsDate}
                            describeWeatherCode={describeWeatherCode}
                            RAIN_ALERT_THRESHOLD={RAIN_ALERT_THRESHOLD}
                        />

                        {announcements.map((item) => (
                            <AnnouncementCard
                                key={item.id}
                                announcement={item}
                                formatNewsDate={formatNewsDate}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsOverlay;