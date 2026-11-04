import { useState, useEffect, useCallback } from "react";
import { markSyncedRead, useSyncedReadItems } from "../../../shared/useSyncedState";
import { heatIndexC, windSignal } from "../weatherAlerts";

const WEATHER_LAT = 14.3294;
const WEATHER_LON = 120.9367;

const WEATHER_CACHE_KEY = "sf_weatherCache";
const WEATHER_DISMISSED_KEY = "sf_weatherNoticeDismissed";

const RAIN_ALERT_THRESHOLD = 40;

// Half an hour, so a coming typhoon's winds show up soon.
const WEATHER_MAX_AGE_MS = 30 * 60 * 1000;

// Bumped when the cached shape changes, so older caches are fetched again.
const WEATHER_CACHE_VERSION = 2;

// How far ahead a wind signal is shown: today and tomorrow.
const STORM_DAYS = 2;

const getTodayKey = () =>
    new Date().toISOString().split("T")[0];

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

const maxOf = (values) => {
    const nums = values.filter(Number.isFinite);
    return nums.length ? Math.max(...nums) : null;
};

    export default function useWeather() {
    const [weather, setWeather] = useState(null);

    const readItems = useSyncedReadItems();

    const [weatherDismissed, setWeatherDismissed] =
        useState(loadWeatherDismissed);

    const showRainNotice =
        weather &&
        (weather.rainChance >= RAIN_ALERT_THRESHOLD || Boolean(weather.storm)) &&
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

        if (
            cached &&
            cached.date === today &&
            cached.version === WEATHER_CACHE_VERSION &&
            Date.now() - (cached.fetchedAt || 0) < WEATHER_MAX_AGE_MS &&
            Array.isArray(cached.data && cached.data.hours)
        ) {
            setWeather(cached.data);
            return;
        }

        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}&daily=precipitation_probability_max,weathercode,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_gusts_10m_max&hourly=temperature_2m,relative_humidity_2m,weathercode,precipitation_probability,is_day,wind_speed_10m&wind_speed_unit=kmh&timezone=Asia%2FManila&forecast_days=7`
        );

        const json =
            await response.json();

        const hours = json.hourly.time.map((time, i) => {
            const temp = json.hourly.temperature_2m[i];
            const humidity = json.hourly.relative_humidity_2m?.[i];
            return {
                time,
                temp: Math.round(temp),
                code: json.hourly.weathercode[i],
                rainChance: json.hourly.precipitation_probability[i],
                isDay: json.hourly.is_day[i] === 1,
                humidity: Number.isFinite(humidity) ? Math.round(humidity) : null,
                heatIndex: heatIndexC(temp, humidity),
                wind: Math.round(json.hourly.wind_speed_10m?.[i] ?? 0)
            };
        });

        // Today and the next 6 days.
        const days = json.daily.time.map((day, i) => {
            const windMax = Math.round(json.daily.wind_speed_10m_max?.[i] ?? 0);
            const signal = windSignal(windMax);
            return {
                date: day,
                code: json.daily.weathercode[i],
                rainChance: json.daily.precipitation_probability_max[i],
                tMax: Math.round(json.daily.temperature_2m_max[i]),
                tMin: Math.round(json.daily.temperature_2m_min[i]),
                heatIndexMax: maxOf(hours.filter((h) => h.time.startsWith(day)).map((h) => h.heatIndex)),
                windMax,
                gustMax: Math.round(json.daily.wind_gusts_10m_max?.[i] ?? 0),
                signal: signal ? signal.level : 0
            };
        });

        // The strongest wind signal expected today or tomorrow, if any.
        const stormDay = days
            .slice(0, STORM_DAYS)
            .reduce((best, d) => (d.signal && (!best || d.signal > best.signal) ? d : best), null);
        const storm = stormDay
            ? {
                ...windSignal(stormDay.windMax),
                date: stormDay.date,
                windMax: stormDay.windMax,
                gustMax: stormDay.gustMax
            }
            : null;

        const data = {
            date: today,
            rainChance: days[0].rainChance,
            code: days[0].code,
            tMax: days[0].tMax,
            tMin: days[0].tMin,
            heatIndexMax: days[0].heatIndexMax,
            storm,
            days,
            hours
        };

        localStorage.setItem(
            WEATHER_CACHE_KEY,
            JSON.stringify({
            date: today,
            version: WEATHER_CACHE_VERSION,
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
