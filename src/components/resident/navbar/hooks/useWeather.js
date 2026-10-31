import { useState, useEffect, useCallback } from "react";
import { markSyncedRead, useSyncedReadItems } from "../../../shared/useSyncedState";

const WEATHER_LAT = 14.3294;
const WEATHER_LON = 120.9367;

const WEATHER_CACHE_KEY = "sf_weatherCache";
const WEATHER_DISMISSED_KEY = "sf_weatherNoticeDismissed";

const RAIN_ALERT_THRESHOLD = 40;

// The hour-by-hour forecast changes during the day, so a saved copy is
// fetched again once it is an hour old.
const WEATHER_MAX_AGE_MS = 60 * 60 * 1000;

const getTodayKey = () =>
    new Date().toISOString().split("T")[0];

// Dismissing the advisory is saved for the account (useSyncedState), so it
// stays dismissed that day on every device; this browser also remembers it.
const weatherKey = () => `weather:${getTodayKey()}`;

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

    const readItems = useSyncedReadItems();

    const [weatherDismissed, setWeatherDismissed] =
        useState(loadWeatherDismissed);

    const showRainNotice =
        weather &&
        weather.rainChance >=
        RAIN_ALERT_THRESHOLD &&
        !weatherDismissed &&
        !readItems.has(weatherKey());

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

        // Older copies don't have the hourly forecast: fetch again for those.
        if (
            cached &&
            cached.date === today &&
            Date.now() - (cached.fetchedAt || 0) < WEATHER_MAX_AGE_MS &&
            Array.isArray(cached.data && cached.data.hours)
        ) {
            setWeather(cached.data);
            return;
        }

        const response = await fetch(

            `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}&daily=precipitation_probability_max,weathercode,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weathercode,precipitation_probability,is_day&timezone=Asia%2FManila&forecast_days=7`

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
            ),

            // Today and the next 6 days.
            days: json.daily.time.map((day, i) => ({
                date: day,
                code: json.daily.weathercode[i],
                rainChance: json.daily.precipitation_probability_max[i],
                tMax: Math.round(json.daily.temperature_2m_max[i]),
                tMin: Math.round(json.daily.temperature_2m_min[i])
            })),

            // Every hour of those 7 days, in Manila time ("2026-10-31T13:00").
            hours: json.hourly.time.map((time, i) => ({
                time,
                temp: Math.round(json.hourly.temperature_2m[i]),
                code: json.hourly.weathercode[i],
                rainChance: json.hourly.precipitation_probability[i],
                isDay: json.hourly.is_day[i] === 1
            }))

        };

        localStorage.setItem(
            WEATHER_CACHE_KEY,
            JSON.stringify({
            date: today,
            fetchedAt: Date.now(),
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
        markSyncedRead([weatherKey()]);
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