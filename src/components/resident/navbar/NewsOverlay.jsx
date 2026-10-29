import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import AnnouncementCard from "./AnnouncementCard";
import WeatherCard from "./WeatherCard";
import DemoVideoCard from "./DemoVideoCard";
import { useSiteMedia, hasVideo } from "../../shared/useSiteContent";

// News page, laid out as a grid:
//   phones / tablets: search + categories, then the weather, then the feed
//   desktop:          search + categories and the feed on the left, the
//                     weather on the right
// The residents' video (if an Admin turned it on for News) sits under the
// weather.
//
// Filters reset whenever the page opens, so a notification that jumps to
// a post (ResidentNavbar scrolls to #news-item-<id>) always finds it.
const NewsOverlay = ({
    isOpen,

    weather,
    announcements,

    announcementsLoading,
    announcementsError,

    formatNewsDate,
    formatPublishedAt,
    describeWeatherCode,

    RAIN_ALERT_THRESHOLD
}) => {

    const { t } = useLanguage();
    const { systemDemo } = useSiteMedia();
    const [category, setCategory] = useState("all");
    const [query, setQuery] = useState("");

    useEffect(() => {
        if (isOpen) {
            setCategory("all");
            setQuery("");
        }
    }, [isOpen]);

    const articleCount = announcements.length;

    // Categories in use, most common first, with counts.
    const categories = useMemo(() => {
        const counts = new Map();
        announcements.forEach((a) => counts.set(a.category, (counts.get(a.category) || 0) + 1));
        return [...counts.entries()].sort((a, b) => b[1] - a[1]);
    }, [announcements]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return announcements.filter((a) =>
            (category === "all" || a.category === category) &&
            (!q || `${a.title} ${a.message}`.toLowerCase().includes(q))
        );
    }, [announcements, category, query]);

    const filtering = category !== "all" || query.trim() !== "";
    const showVideo = Boolean(systemDemo?.showInNews && hasVideo(systemDemo));
    const hasSide = Boolean(weather) || showVideo;
    const hasContent = announcements.length > 0 || hasSide;

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
                </div>
            </div>

            <div className="news-fullscreen-body">

                {announcementsLoading && !hasContent && (
                    <div className="news-state-message">
                        <div className="spinner-border spinner-border-sm" aria-hidden="true" />
                        <p>{t('news.loading')}</p>
                    </div>
                )}

                {!announcementsLoading && announcementsError && !hasContent && (
                    <div className="news-state-message">
                        <i className="bi bi-exclamation-circle" aria-hidden="true" />
                        <p>{announcementsError}</p>
                    </div>
                )}

                {!announcementsLoading && !announcementsError && !hasContent && (
                    <div className="news-state-message">
                        <i className="bi bi-megaphone" aria-hidden="true" />
                        <p>{t('news.empty')}</p>
                    </div>
                )}

                {hasContent && (
                    <div className={`news-layout ${hasSide ? "with-weather" : ""}`}>

                        {announcements.length > 0 && (
                            <div className="news-toolbar">
                                <label className="news-search">
                                    <i className="bi bi-search" aria-hidden="true" />
                                    <input
                                        type="search"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={t('news.searchPlaceholder')}
                                        aria-label={t('news.searchPlaceholder')}
                                    />
                                </label>

                                {categories.length > 1 && (
                                    <div className="news-filters" role="group" aria-label={t('news.filterLabel')}>
                                        <button
                                            type="button"
                                            className={`news-filter ${category === "all" ? "active" : ""}`}
                                            aria-pressed={category === "all"}
                                            onClick={() => setCategory("all")}
                                        >
                                            {t('news.filterAll')} <span>{articleCount}</span>
                                        </button>
                                        {categories.map(([name, count]) => (
                                            <button
                                                key={name}
                                                type="button"
                                                className={`news-filter ${category === name ? "active" : ""}`}
                                                aria-pressed={category === name}
                                                onClick={() => setCategory(name)}
                                            >
                                                {name} <span>{count}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {hasSide && (
                            <div className="news-weather-slot">
                                {weather && (
                                    <WeatherCard
                                        weather={weather}
                                        formatNewsDate={formatNewsDate}
                                        describeWeatherCode={describeWeatherCode}
                                        RAIN_ALERT_THRESHOLD={RAIN_ALERT_THRESHOLD}
                                    />
                                )}
                                <DemoVideoCard />
                            </div>
                        )}

                        <div className="news-feed">
                            {filtering && visible.length === 0 && (
                                <div className="news-state-message news-no-match">
                                    <i className="bi bi-search" aria-hidden="true" />
                                    <p>{t('news.noMatch')}</p>
                                    <button type="button" onClick={() => { setCategory("all"); setQuery(""); }}>
                                        {t('news.clearFilters')}
                                    </button>
                                </div>
                            )}

                            <div className="news-list">
                                {visible.map((item, index) => (
                                    <AnnouncementCard
                                        key={item.id}
                                        announcement={item}
                                        featured={!filtering && index === 0}
                                        formatNewsDate={formatPublishedAt || formatNewsDate}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsOverlay;
