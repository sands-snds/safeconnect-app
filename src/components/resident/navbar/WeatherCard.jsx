import React, { useCallback, useEffect, useRef, useState } from "react";
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

    const { t, language } = useLanguage();
    const days = weather && Array.isArray(weather.days) ? weather.days : [];

    // The forecast row scrolls sideways. The arrows show which way there is
    // more to see; a mouse can drag it like a finger swipe.
    const daysRef = useRef(null);
    const drag = useRef(null);
    const [edges, setEdges] = useState({ prev: false, next: false });

    const updateEdges = useCallback(() => {
        const el = daysRef.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        setEdges({ prev: el.scrollLeft > 2, next: el.scrollLeft < max - 2 });
    }, []);

    useEffect(() => {
        const el = daysRef.current;
        if (!el) return undefined;
        updateEdges();
        el.addEventListener("scroll", updateEdges, { passive: true });
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateEdges) : null;
        if (ro) ro.observe(el);
        return () => {
            el.removeEventListener("scroll", updateEdges);
            if (ro) ro.disconnect();
        };
    }, [days.length, updateEdges]);

    const scrollDays = (dir) => {
        const el = daysRef.current;
        // One full view of cards (plus the gap) at a time.
        if (el) el.scrollBy({ left: dir * (el.clientWidth + 8), behavior: "smooth" });
    };

    const onPointerDown = (e) => {
        // Touch already swipes natively; only mice need help.
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        drag.current = { x: e.clientX, left: daysRef.current.scrollLeft, moved: false };
    };

    const onPointerMove = (e) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.x;
        if (!d.moved && Math.abs(dx) > 4) {
            d.moved = true;
            daysRef.current.classList.add("dragging");
            daysRef.current.setPointerCapture?.(e.pointerId);
        }
        if (d.moved) daysRef.current.scrollLeft = d.left - dx;
    };

    const endDrag = () => {
        if (!drag.current) return;
        drag.current = null;
        daysRef.current?.classList.remove("dragging");
    };

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

            {days.length > 1 && (
                <div className="news-weather-week">
                    <div className="news-weather-week-head">
                        <p className="news-weather-week-title">{t('weather.weekTitle')}</p>
                        {(edges.prev || edges.next) && (
                            <div className="news-weather-scroll-btns">
                                <button type="button" className="news-weather-scroll-btn prev" onClick={() => scrollDays(-1)} disabled={!edges.prev} aria-label={t('weather.prevDays')}>
                                    <i className="bi bi-chevron-left" aria-hidden="true" />
                                </button>
                                <button type="button" className="news-weather-scroll-btn next" onClick={() => scrollDays(1)} disabled={!edges.next} aria-label={t('weather.nextDays')}>
                                    <i className="bi bi-chevron-right" aria-hidden="true" />
                                </button>
                            </div>
                        )}
                    </div>
                    <ol
                        className="news-weather-days"
                        ref={daysRef}
                        tabIndex={0}
                        aria-label={t('weather.weekTitle')}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        onLostPointerCapture={endDrag}
                        onDragStart={(e) => e.preventDefault()}
                    >
                        {days.map((d, i) => {
                            const info = describeWeatherCode(d.code);
                            // "2026-10-29" read as a local date (not UTC midnight).
                            const date = new Date(`${d.date}T00:00:00`);
                            const label = i === 0
                                ? t('weather.todayShort')
                                : date.toLocaleDateString(language === 'tl' ? 'fil-PH' : 'en-US', { weekday: 'short' });
                            return (
                                <li key={d.date} title={`${t(`weather.codes.${info.key}`)} · ${t('weather.rainChance')} ${d.rainChance}%`}>
                                    <span className="news-weather-day">{label}</span>
                                    <i className={`bi ${info.icon}`} aria-hidden="true" />
                                    <span className="news-weather-day-rain"><i className="bi bi-droplet-fill" aria-hidden="true" />{d.rainChance}%</span>
                                    <span className="news-weather-day-max">{d.tMax}°</span>
                                    <span className="news-weather-day-min">{d.tMin}°</span>
                                    <span className="visually-hidden">{t(`weather.codes.${info.key}`)}</span>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            )}

            <p className="news-weather-tip">
                <i className={`bi ${tip.icon}`} aria-hidden="true" />
                {tip.text}
            </p>
        </div>
    );

}
