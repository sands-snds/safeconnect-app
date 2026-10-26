import React from "react";
import { useLanguage } from "../../../i18n/LanguageContext";

// News page: today's weather in Barangay Sta. Fe (sidebar widget).
// The bell's rain advisory scrolls here (#news-item-weather).
export default function WeatherCard({
    weather,
    formatNewsDate,
    describeWeatherCode,
    RAIN_ALERT_THRESHOLD
}) {

    const { t } = useLanguage();

    if (!weather) {
        return null;
    }

    const weatherInfo = describeWeatherCode(weather.code);
    const rainy = weather.rainChance >= RAIN_ALERT_THRESHOLD;
    const chance = Math.max(0, Math.min(100, Number(weather.rainChance) || 0));

    return (
        // A div, not <section>: styles/App.css zeroes every section's padding.
        <div
            role="region"
            id="news-item-weather"
            className={`news-weather ${rainy ? "rainy" : ""}`}
            aria-label={t('weather.widgetTitle')}
        >
            <div className="news-weather-head">
                <span className="news-weather-label">
                    <i className="bi bi-geo-alt-fill" aria-hidden="true" /> {t('weather.widgetTitle')}
                </span>
                <span className="news-weather-date">{formatNewsDate(new Date().toISOString())}</span>
            </div>

            <div className="news-weather-main">
                <i className={`bi ${weatherInfo.icon} news-weather-icon`} aria-hidden="true" />
                <div>
                    <p className="news-weather-cond">{t(`weather.codes.${weatherInfo.key}`)}</p>
                    <p className="news-weather-temps">
                        <span><i className="bi bi-thermometer-high" aria-hidden="true" />{t('weather.high')} <strong>{weather.tMax}°C</strong></span>
                        <span><i className="bi bi-thermometer-low" aria-hidden="true" />{t('weather.low')} <strong>{weather.tMin}°C</strong></span>
                    </p>
                </div>
            </div>

            <div className="news-weather-rain">
                <div className="news-weather-rain-row">
                    <span><i className="bi bi-droplet-fill" aria-hidden="true" /> {t('weather.rainChance')}</span>
                    <strong>{chance}%</strong>
                </div>
                <div className="news-weather-bar" role="progressbar" aria-valuenow={chance} aria-valuemin={0} aria-valuemax={100} aria-label={t('weather.rainChance')}>
                    <span style={{ width: `${chance}%` }} />
                </div>
                <p className="news-weather-note">
                    {rainy
                        ? t('weather.rainLikely', { chance })
                        : t('weather.rainUnlikely', { chance })}
                </p>
            </div>
        </div>
    );

}
