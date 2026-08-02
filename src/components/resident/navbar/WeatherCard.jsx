import React from "react";

export default function WeatherCard({
    weather,
    formatNewsDate,
    describeWeatherCode,
    RAIN_ALERT_THRESHOLD
}) {

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
                    Weather Advisory
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

                    {weatherInfo.label}

                    {" "}

                    today

                </h3>

                <p>

                    {weather.rainChance >=
                    RAIN_ALERT_THRESHOLD

                        ? `It's possible to rain today — ${weather.rainChance}% chance of precipitation.`

                        : `Low chance of rain today (${weather.rainChance}%).`
                    }

                    {" "}

                    Expect a high of

                    {" "}

                    <strong>{weather.tMax}°C</strong>

                    {" "}

                    and a low of

                    {" "}

                    <strong>{weather.tMin}°C</strong>.

                </p>

            </div>

        </div>

    );

}