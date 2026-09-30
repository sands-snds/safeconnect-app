import React from "react";
import { useLanguage } from "../../../i18n/LanguageContext";

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

    const weatherInfo =
        describeWeatherCode(weather.code);

    return (

        <div
            id="news-item-weather"
            className="news-card"
        >

            <div className="news-card-content">

                <span className="news-card-category">
                    {t('notificationPanel.weatherAdvisory')}
                </span>

                <div className="news-card-date">

                    {formatNewsDate(
                        new Date().toISOString()
                    )}

                </div>

                <h3>

                    <i
                        className={`bi ${weatherInfo.icon}`}
                    ></i>

                    {" "}

                    {t(`weather.codes.${weatherInfo.key}`)}

                    {" "}

                    {t('weather.today')}

                </h3>

                <p>

                    {weather.rainChance >=
                    RAIN_ALERT_THRESHOLD

                        ? t('weather.rainLikely', { chance: weather.rainChance })

                        : t('weather.rainUnlikely', { chance: weather.rainChance })
                    }

                    {" "}

                    {t('weather.expectHigh')}

                    {" "}

                    <strong>{weather.tMax}°C</strong>

                    {" "}

                    {t('weather.expectLow')}

                    {" "}

                    <strong>{weather.tMin}°C</strong>.

                </p>

            </div>

        </div>

    );

}