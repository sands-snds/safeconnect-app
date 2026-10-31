import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";

const HOT_DAY_C = 34;

// Clear / partly cloudy hours after dark get a moon instead of a sun.
const NIGHT_ICONS = { "bi-sun-fill": "bi-moon-stars-fill", "bi-cloud-sun-fill": "bi-cloud-moon-fill" };

// The forecast hours are Manila time ("2026-10-31T13:00"); this is the
// current hour in the same form, whatever the device's own time zone.
const manilaHourKey = () => {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    const part = (type) => parts.find((p) => p.type === type)?.value;
    return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:00`;
};

// A row that scrolls sideways: swipe on phones; on computers drag it, use
// the arrows, or scroll with a trackpad. A drag doesn't count as a click.
function useSideScroll(deps) {
    const ref = useRef(null);
    const drag = useRef(null);
    const dragged = useRef(false);
    const [edges, setEdges] = useState({ prev: false, next: false });

    const updateEdges = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        setEdges({ prev: el.scrollLeft > 2, next: el.scrollLeft < max - 2 });
    }, []);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        updateEdges();
        el.addEventListener("scroll", updateEdges, { passive: true });
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateEdges) : null;
        if (ro) ro.observe(el);
        return () => {
            el.removeEventListener("scroll", updateEdges);
            if (ro) ro.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [updateEdges, ...deps]);

    // One full view of cards (plus the gap) at a time.
    const page = (dir) => {
        const el = ref.current;
        if (el) el.scrollBy({ left: dir * (el.clientWidth + 8), behavior: "smooth" });
    };

    const handlers = {
        onPointerDown: (e) => {
            dragged.current = false;
            // Touch already swipes natively; only mice need help.
            if (e.pointerType !== "mouse" || e.button !== 0) return;
            drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false };
        },
        onPointerMove: (e) => {
            const d = drag.current;
            if (!d) return;
            const dx = e.clientX - d.x;
            if (!d.moved && Math.abs(dx) > 4) {
                d.moved = true;
                dragged.current = true;
                ref.current.classList.add("dragging");
                ref.current.setPointerCapture?.(e.pointerId);
            }
            if (d.moved) ref.current.scrollLeft = d.left - dx;
        },
        onPointerUp: () => endDrag(),
        onPointerCancel: () => endDrag(),
        onLostPointerCapture: () => endDrag(),
        onDragStart: (e) => e.preventDefault(),
        onClickCapture: (e) => {
            if (dragged.current) {
                e.preventDefault();
                e.stopPropagation();
                dragged.current = false;
            }
        }
    };

    function endDrag() {
        if (!drag.current) return;
        drag.current = null;
        ref.current?.classList.remove("dragging");
    }

    return { ref, edges, page, handlers };
}

function ScrollButtons({ edges, page, prevLabel, nextLabel }) {
    if (!edges.prev && !edges.next) return null;
    return (
        <div className="news-weather-scroll-btns">
            <button type="button" className="news-weather-scroll-btn prev" onClick={() => page(-1)} disabled={!edges.prev} aria-label={prevLabel}>
                <i className="bi bi-chevron-left" aria-hidden="true" />
            </button>
            <button type="button" className="news-weather-scroll-btn next" onClick={() => page(1)} disabled={!edges.next} aria-label={nextLabel}>
                <i className="bi bi-chevron-right" aria-hidden="true" />
            </button>
        </div>
    );
}

// News page: today's weather in Barangay Sta. Fe, the 7-day forecast, and
// hour by hour for whichever day is picked. The bell's rain advisory scrolls
// here (#news-item-weather).
export default function WeatherCard({
    weather,
    formatNewsDate,
    describeWeatherCode,
    RAIN_ALERT_THRESHOLD
}) {

    const { t, language } = useLanguage();
    const locale = language === "tl" ? "fil-PH" : "en-US";
    const days = weather && Array.isArray(weather.days) ? weather.days : [];
    const [selected, setSelected] = useState(0);
    const day = days[Math.min(selected, Math.max(0, days.length - 1))];

    // The picked day's hours; for today, from the current hour on.
    const dayHours = useMemo(() => {
        const hours = weather && Array.isArray(weather.hours) ? weather.hours : [];
        if (!day) return [];
        const all = hours.filter((h) => h.time.startsWith(day.date));
        const now = manilaHourKey();
        const upcoming = all.filter((h) => h.time >= now);
        return upcoming.length ? upcoming : all;
    }, [weather, day]);

    const week = useSideScroll([days.length]);
    const hourly = useSideScroll([dayHours.length, selected]);

    // A new day starts at its first hour.
    useEffect(() => {
        if (hourly.ref.current) hourly.ref.current.scrollLeft = 0;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected]);

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

    // "2026-10-29" read as a local date (not UTC midnight).
    const dateOf = (iso) => new Date(`${iso}T00:00:00`);
    const shortDay = (d, i) => (i === 0 ? t('weather.todayShort') : dateOf(d.date).toLocaleDateString(locale, { weekday: 'short' }));
    const longDay = (d, i) => {
        const full = dateOf(d.date).toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' });
        return i === 0 ? `${t('weather.todayShort')} · ${full}` : full;
    };
    const nowKey = manilaHourKey();
    const hourLabel = (h) => (h.time === nowKey
        ? t('weather.now')
        : new Date(`${h.time}:00`).toLocaleTimeString(locale, { hour: 'numeric' }));
    const dayInfo = day ? describeWeatherCode(day.code) : null;

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

            {days.length > 1 && (
                <div className="news-weather-week">
                    <div className="news-weather-week-head">
                        <p className="news-weather-week-title">{t('weather.weekTitle')}</p>
                        <ScrollButtons edges={week.edges} page={week.page} prevLabel={t('weather.prevDays')} nextLabel={t('weather.nextDays')} />
                    </div>
                    <ol className="news-weather-days" ref={week.ref} aria-label={t('weather.weekTitle')} {...week.handlers}>
                        {days.map((d, i) => {
                            const info = describeWeatherCode(d.code);
                            return (
                                <li key={d.date}>
                                    <button
                                        type="button"
                                        className={`news-weather-day-btn ${i === selected ? "selected" : ""}`}
                                        aria-pressed={i === selected}
                                        onClick={() => setSelected(i)}
                                        title={`${t(`weather.codes.${info.key}`)} · ${t('weather.rainChance')} ${d.rainChance}%`}
                                    >
                                        <span className="news-weather-day">{shortDay(d, i)}</span>
                                        <i className={`bi ${info.icon}`} aria-hidden="true" />
                                        <span className="news-weather-day-rain"><i className="bi bi-droplet-fill" aria-hidden="true" />{d.rainChance}%</span>
                                        <span className="news-weather-day-max">{d.tMax}°</span>
                                        <span className="news-weather-day-min">{d.tMin}°</span>
                                        <span className="visually-hidden">{t(`weather.codes.${info.key}`)}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ol>

                    {day && dayHours.length > 0 && (
                        <div className="news-weather-hourly" aria-live="polite">
                            <div className="news-weather-week-head">
                                <div className="news-weather-hourly-heading">
                                    <p className="news-weather-week-title">{t('weather.hourlyTitle')}</p>
                                    <p className="news-weather-hourly-day">{longDay(day, selected)}</p>
                                </div>
                                <ScrollButtons edges={hourly.edges} page={hourly.page} prevLabel={t('weather.prevHours')} nextLabel={t('weather.nextHours')} />
                            </div>
                            <p className="news-weather-hourly-summary">
                                {t(`weather.codes.${dayInfo.key}`)} · {t('weather.high')} {day.tMax}° · {t('weather.low')} {day.tMin}° · <i className="bi bi-droplet-fill" aria-hidden="true" /> {day.rainChance}%
                            </p>
                            <ol className="news-weather-hours" ref={hourly.ref} aria-label={`${t('weather.hourlyTitle')}: ${longDay(day, selected)}`} {...hourly.handlers}>
                                {dayHours.map((h) => {
                                    const info = describeWeatherCode(h.code);
                                    const icon = h.isDay === false ? (NIGHT_ICONS[info.icon] || info.icon) : info.icon;
                                    return (
                                        <li key={h.time} className={h.time === nowKey ? "now" : ""}>
                                            <span className="news-weather-hour-time">{hourLabel(h)}</span>
                                            <i className={`bi ${icon}`} aria-hidden="true" />
                                            <span className="news-weather-hour-temp">{h.temp}°</span>
                                            <span className="news-weather-day-rain"><i className="bi bi-droplet-fill" aria-hidden="true" />{h.rainChance ?? 0}%</span>
                                            <span className="visually-hidden">{t(`weather.codes.${info.key}`)}</span>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    )}
                </div>
            )}

            <p className="news-weather-tip">
                <i className={`bi ${tip.icon}`} aria-hidden="true" />
                {tip.text}
            </p>
        </div>
    );

}
