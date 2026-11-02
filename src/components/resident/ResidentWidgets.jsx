import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import useAnnouncements from './navbar/hooks/useAnnouncements';
import useWeather from './navbar/hooks/useWeather';
import { manilaHourKey, NIGHT_ICONS } from './navbar/WeatherCard';
import { themeFor } from './navbar/AnnouncementCard';
import { OPEN_NEWS_EVENT, RAIN_ALERT_THRESHOLD, describeWeatherCode } from './ResidentNavbar';

const ARTICLES = 3;
const AUTO_MS = 6000;
const SWIPE_PX = 50;
const PHONE_QUERY = '(max-width: 767px)';

// Both widgets lead to the News page: an article opens there, the weather
// opens the full forecast there.
const openNews = (detail = {}) => window.dispatchEvent(new CustomEvent(OPEN_NEWS_EVENT, { detail }));

const shortDate = (iso, language) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(language === 'tl' ? 'fil-PH' : 'en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' });
};

const usePhone = () => {
  const get = () => typeof window !== 'undefined' && !!window.matchMedia?.(PHONE_QUERY).matches;
  const [phone, setPhone] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia?.(PHONE_QUERY);
    if (!mq) return undefined;
    const onChange = () => setPhone(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange); else mq.addListener(onChange);
    return () => { if (mq.removeEventListener) mq.removeEventListener('change', onChange); else mq.removeListener(onChange); };
  }, []);
  return phone;
};

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Index that moves on by itself (unless paused) and can be set.
function useSlides(count) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => { if (index >= count) setIndex(0); }, [count, index]);
  useEffect(() => {
    if (paused || count < 2 || reducedMotion()) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), AUTO_MS);
    return () => clearInterval(timer);
  }, [paused, count]);
  const go = (i) => setIndex(((i % count) + count) % count);
  return { index, go, setPaused };
}

// A row of slides that follows the finger, then settles on a slide.
function SwipeTrack({ index, count, onGo, onTouch, children }) {
  const trackRef = useRef(null);
  const drag = useRef(null);
  const swipedAt = useRef(0);

  const place = (dx = 0, animate = true) => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = animate && !reducedMotion() ? 'transform 0.4s ease' : 'none';
    track.style.transform = `translateX(calc(${-index * 100}% + ${dx}px))`;
  };
  useEffect(() => { place(0, true); });

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' || count < 2) return;
    drag.current = { x: e.clientX, y: e.clientY, axis: null, id: e.pointerId, dx: 0 };
    if (onTouch) onTouch();
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (d.axis === 'x') { d.dx = dx; place(dx, false); }
  };
  const onPointerEnd = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.axis !== 'x') return;
    if (Math.abs(d.dx) > SWIPE_PX) {
      swipedAt.current = Date.now();
      onGo(index + (d.dx < 0 ? 1 : -1));
    } else {
      place(0, true);
    }
  };
  // The click a browser sends right after a swipe isn't a tap.
  const onClickCapture = (e) => {
    if (Date.now() - swipedAt.current < 400) { e.preventDefault(); e.stopPropagation(); }
  };

  return (
    <div className="rw-viewport" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd} onClickCapture={onClickCapture}>
      <div className="rw-track" ref={trackRef}>{children}</div>
    </div>
  );
}

function Dots({ count, index, onGo, label }) {
  if (count < 2) return null;
  return (
    <span className="rw-dots">
      {Array.from({ length: count }, (_, i) => (
        <button key={i} type="button" className={`rw-dot ${i === index ? 'active' : ''}`} onClick={() => onGo(i)} aria-label={label(i)} aria-current={i === index ? 'true' : undefined} />
      ))}
    </span>
  );
}

// One article, compact: picture, category, title, date.
function ArticleBody({ article }) {
  const { language } = useLanguage();
  const theme = themeFor(article.category);
  const image = article.imageUrl || article.sourceImage;
  return (
    <span className="rw-article">
      <span className={`rw-thumb ${image ? '' : 'empty'}`} style={image ? { backgroundImage: `url("${image}")` } : { background: `linear-gradient(135deg, ${theme.color} 0%, #2b1b20 100%)` }}>
        {!image && <i className={`bi ${theme.icon}`} aria-hidden="true" />}
      </span>
      <span className="rw-article-text">
        <span className="rw-chip" style={{ background: `${theme.color}18`, color: theme.color }}>
          <i className={`bi ${theme.icon}`} aria-hidden="true" /> {article.category}
        </span>
        <span className="rw-article-title">{article.title}</span>
        <span className="rw-article-date"><i className="bi bi-clock" aria-hidden="true" /> {shortDate(article.date, language)}</span>
      </span>
    </span>
  );
}

// single: one article (phones' carousel). Otherwise the latest few, rotating.
function NewsCard({ articles, loading, index = 0, onGo, onTouch, single = null }) {
  const { t } = useLanguage();
  const shown = single ? [single] : articles;
  const article = shown[single ? 0 : index];
  return (
    <div className="rw-card rw-news">
      <div className="rw-card-head">
        <span className="rw-head-icon"><i className="bi bi-newspaper" aria-hidden="true" /></span>
        <span className="rw-head-title">{t('widgets.newsTitle')}</span>
        <button type="button" className="rw-head-link" onClick={() => openNews()}>
          {t('widgets.viewAll')} <i className="bi bi-arrow-right" aria-hidden="true" />
        </button>
      </div>
      {loading && !article ? (
        <div className="rw-body"><span className="rw-skeleton" /></div>
      ) : !article ? (
        <button type="button" className="rw-body rw-empty" onClick={() => openNews()}>
          <i className="bi bi-megaphone" aria-hidden="true" /> {t('widgets.noNews')}
        </button>
      ) : single ? (
        <button type="button" className="rw-body" onClick={() => openNews({ announcementId: article.id })} aria-label={article.title}>
          <ArticleBody article={article} />
        </button>
      ) : (
        <SwipeTrack index={index} count={shown.length} onGo={onGo} onTouch={onTouch}>
          {shown.map((a, i) => (
            <button key={a.id} type="button" className="rw-body rw-slide" onClick={() => openNews({ announcementId: a.id })} aria-hidden={i !== index} tabIndex={i === index ? 0 : -1} aria-label={a.title}>
              <ArticleBody article={a} />
            </button>
          ))}
        </SwipeTrack>
      )}
      <div className="rw-card-foot">
        {!single && <Dots count={shown.length} index={index} onGo={onGo} label={(i) => t('widgets.goTo', { n: i + 1 })} />}
        <span className="rw-foot-hint">{t('widgets.tapForNews')}</span>
      </div>
    </div>
  );
}

// Today only: now, high / low, rain chance. Tap for the full forecast.
function WeatherCard({ weather }) {
  const { t, language } = useLanguage();
  if (!weather) {
    return (
      <div className="rw-card rw-weather">
        <div className="rw-card-head">
          <span className="rw-head-icon"><i className="bi bi-geo-alt-fill" aria-hidden="true" /></span>
          <span className="rw-head-title">{t('widgets.weatherTitle')}</span>
        </div>
        <div className="rw-body"><span className="rw-skeleton light" /></div>
        <div className="rw-card-foot" />
      </div>
    );
  }
  const now = (weather.hours || []).find((h) => h.time === manilaHourKey());
  const info = describeWeatherCode(now ? now.code : weather.code);
  const icon = now && !now.isDay ? (NIGHT_ICONS[info.icon] || info.icon) : info.icon;
  const rainy = weather.rainChance >= RAIN_ALERT_THRESHOLD;
  const today = new Date().toLocaleDateString(language === 'tl' ? 'fil-PH' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Manila' });
  return (
    <button type="button" className={`rw-card rw-weather ${rainy ? 'rainy' : ''}`} onClick={() => openNews({ weather: true })}>
      <span className="rw-card-head">
        <span className="rw-head-icon"><i className="bi bi-geo-alt-fill" aria-hidden="true" /></span>
        <span className="rw-head-title">{t('widgets.weatherTitle')}</span>
        <span className="rw-head-date">{today}</span>
      </span>
      <span className="rw-body rw-weather-body">
        <i className={`bi ${icon} rw-weather-icon`} aria-hidden="true" />
        <span className="rw-weather-main">
          <span className="rw-temp">{now ? now.temp : weather.tMax}°<small>C</small></span>
          <span className="rw-cond">{t(`weather.codes.${info.key}`)}</span>
          <span className="rw-hilo">
            <span><i className="bi bi-arrow-up" aria-hidden="true" /> {weather.tMax}°</span>
            <span><i className="bi bi-arrow-down" aria-hidden="true" /> {weather.tMin}°</span>
          </span>
        </span>
        <span className="rw-rain">
          <i className="bi bi-droplet-fill" aria-hidden="true" />
          <strong>{weather.rainChance}%</strong>
          <span>{t('widgets.rain')}</span>
        </span>
      </span>
      <span className="rw-card-foot">
        <span className="rw-foot-hint">{t('widgets.tapForForecast')} <i className="bi bi-arrow-right" aria-hidden="true" /></span>
      </span>
    </button>
  );
}

// Phones: the news widget and the weather widget taking turns, endlessly.
// The track is [weather copy, news, weather, news copy]; after sliding onto
// a copy it jumps (unseen) to the real widget, so it never reaches an end.
// Each time the news widget comes round it shows the next article.
function WidgetLoop({ articles, loading, weather }) {
  const { t } = useLanguage();
  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(true);
  const [turn, setTurn] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef(null);
  const drag = useRef(null);
  const swipedAt = useRef(0);
  const isNews = (p) => p % 2 === 1;

  const posRef = useRef(pos);
  posRef.current = pos;
  const go = (step) => {
    const p = posRef.current;
    // Still on a copy (a quick second swipe): jump to the real one first.
    const from = p === 0 ? 2 : p === 3 ? 1 : p;
    const target = from + step;
    const move = () => {
      setAnimate(!reducedMotion());
      setPos(target);
      if (isNews(target)) setTurn((n) => n + 1);
    };
    if (from !== p) {
      setAnimate(false);
      setPos(from);
      requestAnimationFrame(() => requestAnimationFrame(move));
    } else {
      move();
    }
  };
  const goRef = useRef(go);
  goRef.current = go;
  const settle = () => {
    if (pos === 0 || pos === 3) { setAnimate(false); setPos(pos === 0 ? 2 : 1); }
  };
  useEffect(() => { if (!animate || reducedMotion()) settle(); });

  useEffect(() => {
    if (paused || reducedMotion()) return undefined;
    const timer = setInterval(() => goRef.current(1), AUTO_MS);
    return () => clearInterval(timer);
  }, [paused]);

  const place = (dx = 0) => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = dx || !animate ? 'none' : 'transform 0.4s ease';
    track.style.transform = `translateX(calc(${-pos} * (var(--rw-slide) + var(--rw-gap)) + (100% - var(--rw-slide)) / 2 + ${dx}px))`;
  };
  useEffect(() => { place(0); });

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse') return;
    drag.current = { x: e.clientX, y: e.clientY, axis: null, id: e.pointerId, dx: 0 };
    setPaused(true);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x;
    if (!d.axis) {
      if (Math.abs(dx) < 8 && Math.abs(e.clientY - d.y) < 8) return;
      d.axis = Math.abs(dx) > Math.abs(e.clientY - d.y) ? 'x' : 'y';
    }
    if (d.axis === 'x') { d.dx = dx; place(dx); }
  };
  const onPointerEnd = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.axis !== 'x') return;
    if (Math.abs(d.dx) > SWIPE_PX) { swipedAt.current = Date.now(); go(d.dx < 0 ? 1 : -1); } else place(0);
  };
  const onClickCapture = (e) => {
    if (Date.now() - swipedAt.current < 400) { e.preventDefault(); e.stopPropagation(); }
  };

  const article = articles.length ? articles[turn % articles.length] : null;
  const news = <NewsCard articles={articles} loading={loading} single={article} />;
  const sky = <WeatherCard weather={weather} />;
  const track = [sky, news, sky, news];

  return (
    <div className="rw-mobile" aria-roledescription="carousel" aria-label={t('widgets.title')}>
      <div className="rw-viewport" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd} onClickCapture={onClickCapture}>
        <div className="rw-track" ref={trackRef} onTransitionEnd={(e) => { if (e.target === e.currentTarget) settle(); }}>
          {track.map((slide, i) => (
            <div key={i} aria-hidden={i !== pos} inert={i !== pos} aria-roledescription="slide">{slide}</div>
          ))}
        </div>
      </div>
      <button type="button" className="rw-sr-nav prev" onClick={() => { setPaused(true); go(-1); }} aria-label={t('widgets.previous')}>
        <i className="bi bi-chevron-left" aria-hidden="true" />
      </button>
      <button type="button" className="rw-sr-nav next" onClick={() => { setPaused(true); go(1); }} aria-label={t('widgets.next')}>
        <i className="bi bi-chevron-right" aria-hidden="true" />
      </button>
    </div>
  );
}

// Resident page: the latest news and today's weather. Side by side on wider
// screens; on phones one endless carousel of the two.
export default function ResidentWidgets() {
  const { t } = useLanguage();
  const phone = usePhone();
  const { announcements, announcementsLoading } = useAnnouncements();
  const { weather, loadWeather } = useWeather();
  const articles = announcements.slice(0, ARTICLES);
  const desk = useSlides(articles.length);

  // Keeps "now" current on a page left open (the forecast itself is cached
  // for an hour, so this rarely fetches).
  useEffect(() => {
    const timer = setInterval(() => { if (document.visibilityState !== 'hidden') loadWeather(); }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [loadWeather]);

  return (
    <section className="resident-widgets">
      <style>{`
        /* Fades into the report section below, which starts white. */
        .rw-outer { padding: 64px 0 72px; background: linear-gradient(180deg, #fbf7f8 0%, #ffffff 100%); }
        .rw-inner { max-width: 1080px; margin: 0 auto; padding: 0 16px; }
        .rw-intro { max-width: 600px; margin: 0 auto 28px; text-align: center; }
        .rw-badge { display: inline-flex; align-items: center; gap: 6px; background: #fff0f3; color: #6B2C3E; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 14px; border-radius: 30px; border: 1.5px solid #f5c6d0; margin-bottom: 14px; }
        .rw-intro h2 { margin: 0 0 8px; font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 900; color: #111; line-height: 1.2; letter-spacing: -0.02em; }
        .rw-intro p { margin: 0; color: #5b6170; line-height: 1.6; font-size: 0.95rem; }

        .rw-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; align-items: stretch; max-width: 920px; margin: 0 auto; }
        .rw-card { width: 100%; height: 100%; display: flex; flex-direction: column; text-align: left; font: inherit; color: inherit; background: #fff; border: 1.5px solid #f0eaec; border-radius: 20px; box-shadow: 0 8px 24px rgba(107, 44, 62, 0.07); overflow: hidden; padding: 0; }
        .rw-card-head { display: flex; align-items: center; gap: 10px; padding: 14px 16px 10px; }
        .rw-head-icon { width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; color: #fff; background: linear-gradient(135deg, #6B2C3E 0%, #8B3A52 100%); }
        .rw-head-title { flex: 1; min-width: 0; font-size: 0.95rem; font-weight: 800; color: #111; }
        .rw-head-link { border: none; background: none; color: #6B2C3E; font-size: 0.8rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; padding: 4px 2px; }
        .rw-head-date { font-size: 0.78rem; font-weight: 600; opacity: 0.9; white-space: nowrap; }
        .rw-body { flex: 1; display: block; width: 100%; min-height: 128px; border: none; background: none; padding: 4px 16px 8px; text-align: left; font: inherit; color: inherit; cursor: pointer; }
        .rw-card-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 38px; padding: 6px 16px 12px; font-size: 0.76rem; color: #6b7280; }
        .rw-foot-hint { display: inline-flex; align-items: center; gap: 5px; font-weight: 600; margin-left: auto; }

        .rw-viewport { flex: 1; display: flex; overflow: hidden; touch-action: pan-y; }
        .rw-track { display: flex; width: 100%; will-change: transform; }
        .rw-track > * { flex: 0 0 100%; min-width: 0; }
        .rw-article { display: flex; gap: 14px; align-items: stretch; height: 100%; }
        .rw-thumb { flex: 0 0 38%; min-height: 112px; border-radius: 14px; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, 0.85); font-size: 1.8rem; }
        .rw-article-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; justify-content: center; }
        .rw-chip { align-self: flex-start; display: inline-flex; align-items: center; gap: 5px; font-size: 0.66rem; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; padding: 3px 9px; border-radius: 999px; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rw-article-title { font-size: 0.95rem; font-weight: 800; line-height: 1.35; color: #111; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .rw-article-date { font-size: 0.75rem; color: #6b7280; }
        .rw-body:hover .rw-article-title { color: #6B2C3E; }
        .rw-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: #9ca3af; font-weight: 600; text-align: center; }
        .rw-empty i { font-size: 1.6rem; }
        .rw-skeleton { display: block; height: 112px; border-radius: 14px; background: linear-gradient(90deg, #f3eef0 25%, #faf6f7 50%, #f3eef0 75%); background-size: 200% 100%; animation: rw-shimmer 1.4s infinite; }
        .rw-skeleton.light { background: linear-gradient(90deg, rgba(255,255,255,0.15) 25%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.15) 75%); background-size: 200% 100%; }
        @keyframes rw-shimmer { to { background-position: -200% 0; } }

        .rw-weather { border: none; color: #fff; background: linear-gradient(150deg, #1d4ed8 0%, #3b82f6 60%, #60a5fa 100%); box-shadow: 0 8px 24px rgba(29, 78, 216, 0.2); cursor: pointer; }
        .rw-weather.rainy { background: linear-gradient(150deg, #1e3a5f 0%, #2563eb 70%, #3b82f6 100%); }
        .rw-weather .rw-head-icon { background: rgba(255, 255, 255, 0.18); }
        .rw-weather .rw-head-title { color: #fff; }
        .rw-weather .rw-card-foot { color: rgba(255, 255, 255, 0.92); }
        .rw-weather-body { display: flex; align-items: center; gap: 14px; }
        .rw-weather-icon { font-size: 3.1rem; color: #fde68a; line-height: 1; flex-shrink: 0; }
        .rw-weather-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .rw-temp { font-size: 2.4rem; font-weight: 900; line-height: 1; }
        .rw-temp small { font-size: 0.95rem; font-weight: 800; vertical-align: top; margin-left: 2px; }
        .rw-cond { font-size: 0.95rem; font-weight: 700; }
        .rw-hilo { display: flex; gap: 12px; font-size: 0.8rem; font-weight: 600; opacity: 0.95; flex-wrap: wrap; }
        .rw-rain { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 76px; padding: 10px 8px; border-radius: 14px; background: rgba(255, 255, 255, 0.16); font-size: 0.7rem; font-weight: 600; text-align: center; }
        .rw-rain i { font-size: 1rem; color: #bfdbfe; }
        .rw-rain strong { font-size: 1.1rem; font-weight: 800; }
        .rw-weather:hover { filter: brightness(1.04); }

        .rw-dots { display: inline-flex; align-items: center; gap: 6px; }
        .rw-dot { width: 8px; height: 8px; border-radius: 999px; border: none; padding: 0; background: #e5d9dc; cursor: pointer; transition: width 0.25s, background 0.25s; }
        .rw-dot.active { width: 20px; background: #6B2C3E; }
        .rw-card:focus-visible, .rw-body:focus-visible, .rw-head-link:focus-visible, .rw-dot:focus-visible, .rw-sr-nav:focus-visible { outline: 3px solid #6B2C3E; outline-offset: 2px; }
        .rw-weather:focus-visible { outline-color: #1d4ed8; }

        /* Phones: one carousel, news and weather taking turns. */
        .rw-mobile { position: relative; margin: 0 -16px; }
        .rw-mobile .rw-viewport { padding: 2px 0 6px; }
        .rw-mobile .rw-track { --rw-slide: 86%; --rw-gap: 10px; gap: var(--rw-gap); }
        .rw-mobile .rw-track > * { display: flex; flex: 0 0 var(--rw-slide); transition: opacity 0.3s ease; }
        .rw-mobile .rw-track > [aria-hidden="true"] { opacity: 0.55; }
        .rw-mobile .rw-card { box-shadow: 0 4px 14px rgba(107, 44, 62, 0.08); }
        .rw-mobile .rw-weather { box-shadow: 0 4px 14px rgba(29, 78, 216, 0.16); }
        .rw-mobile .rw-card-head { padding: 12px 14px 6px; }
        .rw-mobile .rw-head-link, .rw-mobile .rw-card-foot { display: none; }
        .rw-mobile .rw-body { min-height: 0; padding: 4px 14px 14px; }
        .rw-mobile .rw-thumb { min-height: 88px; flex-basis: 36%; }
        .rw-mobile .rw-article-title { -webkit-line-clamp: 2; }
        .rw-sr-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); border: 0; }
        .rw-sr-nav:focus-visible { width: 36px; height: 36px; clip: auto; overflow: visible; border-radius: 50%; background: #fff; color: #6B2C3E; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); z-index: 2; }
        .rw-sr-nav.prev { left: 8px; }
        .rw-sr-nav.next { right: 8px; }

        @media (max-width: 767px) {
          .rw-outer { padding: 52px 0 64px; }
          .rw-body { min-height: 118px; }
          .rw-thumb { min-height: 104px; }
          .rw-temp { font-size: 2.1rem; }
          .rw-weather-icon { font-size: 2.6rem; }
        }
        @media (max-width: 360px) {
          .rw-article { gap: 10px; }
          .rw-rain { min-width: 64px; }
          .rw-head-date { display: none; }
        }
      `}</style>
      <div className="rw-outer">
        <div className="rw-inner">
          <div className="rw-intro">
            <div className="rw-badge"><i className="bi bi-broadcast" aria-hidden="true" /> {t('widgets.badge')}</div>
            <h2>{t('widgets.title')}</h2>
            <p>{t('widgets.subtitle')}</p>
          </div>

          {phone ? (
            <WidgetLoop articles={articles} loading={announcementsLoading} weather={weather} />
          ) : (
            <div className="rw-grid" onMouseEnter={() => desk.setPaused(true)} onMouseLeave={() => desk.setPaused(false)} onFocus={() => desk.setPaused(true)} onBlur={() => desk.setPaused(false)}>
              <NewsCard articles={articles} loading={announcementsLoading} index={desk.index} onGo={desk.go} onTouch={() => desk.setPaused(true)} />
              <WeatherCard weather={weather} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
