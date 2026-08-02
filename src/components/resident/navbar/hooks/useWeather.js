import { useState, useEffect, useCallback } from "react";

const WEATHER_LAT = 14.3294;
const WEATHER_LON = 120.9367;

const WEATHER_CACHE_KEY = "sf_weatherCache";
const WEATHER_DISMISSED_KEY = "sf_weatherNoticeDismissed";

const RAIN_ALERT_THRESHOLD = 40;

const getTodayKey = () =>
    new Date().toISOString().split("T")[0];

const loadWeatherDismissed = () => {
    try {
        return (
        localStorage.getItem(
            WEATHER_DISMISSED_KEY
        ) === getTodayKey()
        );
    } catch {
        return false;
    }
    };

    export default function useWeather() {

    const [weather, setWeather] = useState(null);

    const [weatherDismissed, setWeatherDismissed] =
        useState(loadWeatherDismissed);

    const showRainNotice =
        weather &&
        weather.rainChance >=
        RAIN_ALERT_THRESHOLD &&
        !weatherDismissed;

    const loadWeather = useCallback(async () => {
        try {

        const today = getTodayKey();

        const cachedRaw =
            localStorage.getItem(
            WEATHER_CACHE_KEY
            );

        const cached = cachedRaw
            ? JSON.parse(cachedRaw)
            : null;

        if (
            cached &&
            cached.date === today
        ) {
            setWeather(cached.data);
            return;
        }

        const response = await fetch(

            `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}&daily=precipitation_probability_max,weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FManila`

        );

        const json =
            await response.json();

        const data = {

            date: today,

            rainChance:
            json.daily
                .precipitation_probability_max[0],

            code:
            json.daily.weathercode[0],

            tMax: Math.round(
            json.daily.temperature_2m_max[0]
            ),
            tMin: Math.round(
            json.daily.temperature_2m_min[0]
            )

        };

        localStorage.setItem(
            WEATHER_CACHE_KEY,
            JSON.stringify({
            date: today,
            data
            })
        );

        setWeather(data);
        if (
            localStorage.getItem(
            WEATHER_DISMISSED_KEY
            ) !== today
        ) {
            setWeatherDismissed(false);
        }

        } catch (err) {
        console.error(
            "Weather fetch failed:",
            err
        );
        }
    }, []);

    useEffect(() => {
        loadWeather();
    }, [loadWeather]);

    const dismissWeatherNotice = () => {

        try {
        localStorage.setItem(
            WEATHER_DISMISSED_KEY,
            getTodayKey()
        );
        } catch {}
        setWeatherDismissed(true);
    };

    return {
        weather,
        showRainNotice,
        loadWeather,
        dismissWeatherNotice,
        weatherDismissed,
        setWeatherDismissed,
        RAIN_ALERT_THRESHOLD
    };
    }