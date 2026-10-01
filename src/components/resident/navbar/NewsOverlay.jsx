import React from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
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

    const { t } = useLanguage();
    const articleCount = announcements.length;

    return (
        <div
            className={`news-fullscreen ${isOpen ? "show" : ""}`}
        >
            <div className="news-fullscreen-header">
                <div className="news-header-left">
                    <div className="news-header-icon">
                        <i className="bi bi-newspaper" />
                    </div>
                    <div>
                        <h2>{t('news.latestNews')}</h2>
                        <p className="news-header-sub">{t('news.headerSubtitle')}</p>
                    </div>
                </div>

                <div className="news-header-right">
                    {articleCount > 0 && (
                        <span className="news-header-count">
                            {articleCount === 1
                                ? t('news.articleCountSingular', { count: articleCount })
                                : t('news.articleCountPlural', { count: articleCount })}
                        </span>
                    )}
                    <button
                        className="news-close-btn"
                        onClick={onClose}
                        aria-label="Close news"
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>

            <div className="news-fullscreen-body">

                {announcementsLoading &&
                    announcements.length === 0 &&
                    !weather && (
                        <div className="news-state-message">
                            {t('news.loading')}
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
                            {t('news.empty')}
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