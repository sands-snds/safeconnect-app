import React from "react";
import { useLanguage } from "../../../i18n/LanguageContext";

const HOT_DAY_C = 34;

// News page: today's weather in Barangay Sta. Fe. The bell's rain advisory
// scrolls here (#news-item-weather).
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
    // A short safety tip for the day.
    const tip = rainy
        ? { icon: "bi-umbrella-fill", text: t('weather.tipRain') }
        : weather.tMax >= HOT_DAY_C
            ? { icon: "bi-brightness-high-fill", text: t('weather.tipHot') }
            : { icon: "bi-emoji-smile-fill", text: t('weather.tipFair') };

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
                <div className="news-weather-now">
                    <p className="news-weather-temp">{weather.tMax}°<span>C</span></p>
                    <p className="news-weather-cond">{t(`weather.codes.${weatherInfo.key}`)}</p>
                    <p className="news-weather-range">
                        <span><i className="bi bi-arrow-up" aria-hidden="true" />{t('weather.high')} {weather.tMax}°C</span>
                        <span><i className="bi bi-arrow-down" aria-hidden="true" />{t('weather.low')} {weather.tMin}°C</span>
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

            <p className="news-weather-tip">
                <i className={`bi ${tip.icon}`} aria-hidden="true" />
                {tip.text}
            </p>
        </div>
    );

}
