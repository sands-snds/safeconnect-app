import { isWithinSantaFe } from './santaFeArea';

// The Incident Map (admin Incident Map page, resident "Your Reports on the
// Map"): each report's type, how it is drawn, and where it sits.

// Colour, Bootstrap icon and pulse speed per type. Fire pulses fastest,
// then earthquake, then flood.
export const MAP_TYPES = {
  fire:      { label: 'Fire',          name: 'Fire Emergency',     color: '#dc2626', icon: 'bi-fire',                    speed: '0.9s' },
  flood:     { label: 'Flood',         name: 'Flood Emergency',    color: '#2563eb', icon: 'bi-water',                   speed: '1.8s' },
  quake:     { label: 'Earthquake',    name: 'Earthquake',         color: '#b45309', icon: 'bi-activity',                speed: '1.25s' },
  typhoon:   { label: 'Typhoon',       name: 'Typhoon',            color: '#0f766e', icon: 'bi-tropical-storm',          speed: '1.6s' },
  emergency: { label: 'Emergency',     name: 'Emergency',          color: '#be123c', icon: 'bi-exclamation-triangle-fill', speed: '1.4s' },
  assist:    { label: 'Assistance',    name: 'Assistance Request', color: '#ea580c', icon: 'bi-box2-heart-fill',         speed: '2s' },
  crime:     { label: 'Petty crime',   name: 'Petty Crime',        color: '#7c3aed', icon: 'bi-shield-fill-exclamation', speed: '2s' }
};
export const LEGEND_TYPES = ['fire', 'flood', 'quake', 'typhoon', 'assist', 'crime'];
export const MAIN_TYPES = ['fire', 'flood', 'quake'];
export const RESOLVED_COLOR = '#9ca3af';

const EMERGENCY_TYPE = { 'Fire Emergency': 'fire', 'Flood Emergency': 'flood', Earthquake: 'quake', Typhoon: 'typhoon' };

export const isOpenStatus = (status) => status !== 'Resolved' && status !== 'Dismissed';

const coords = (lat, lng) => {
  const la = Number(lat), ln = Number(lng);
  return lat != null && lng != null && Number.isFinite(la) && Number.isFinite(ln) ? [la, ln] : null;
};

// kind: emergency | assistance | pettyCrime (the admin lists, see api.js)
export const fromAdminReport = (kind, r) => {
  const type = kind === 'emergency' ? (EMERGENCY_TYPE[r.emergency] || 'emergency') : kind === 'assistance' ? 'assist' : 'crime';
  return {
    key: `${kind}-${r.id}`,
    kind,
    id: r.id,
    type,
    title: kind === 'emergency' ? (r.emergency || 'Emergency') : kind === 'assistance' ? (r.assistanceType || 'Assistance Request') : (r.crimeType || 'Petty Crime'),
    reference: r.reference,
    status: r.status || 'Received',
    at: r.rawDate ? new Date(r.rawDate).getTime() : null,
    location: r.location || '',
    who: kind === 'pettyCrime' && r.isAnonymous ? 'Anonymous' : (r.reporter || r.fullName || ''),
    position: coords(r.latitude, r.longitude),
    archived: Boolean(r.archivedAt)
  };
};

// The resident's own reports (GET /reports/user/:id)
const MY_KIND = { Emergency: 'emergency', Assistance: 'assistance', 'Petty Crime': 'pettyCrime' };
export const fromMyReport = (r) => {
  const kind = MY_KIND[r.type] || 'emergency';
  const type = kind === 'emergency' ? (EMERGENCY_TYPE[r.title] || 'emergency') : kind === 'assistance' ? 'assist' : 'crime';
  return {
    key: `${kind}-${r.id}`,
    kind,
    id: r.id,
    reportType: r.type,
    type,
    title: r.title || MAP_TYPES[type].name,
    reference: r.report_reference || '',
    status: r.status || 'Received',
    at: r.date ? new Date(r.date).getTime() : null,
    location: r.location || '',
    who: '',
    position: coords(r.latitude, r.longitude),
    closedAt: r.resolved_at ? new Date(r.resolved_at).getTime() : null,
    archived: Boolean(r.archived_at)
  };
};

export const timeAgo = (t, now = Date.now()) => {
  if (!t) return '';
  const m = Math.max(1, Math.round((now - t) / 60000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} hr ago` : `${Math.round(h / 24)} days ago`;
};

// ── Reports without a pin ───────────────────────────────────────────────────
// Placed from the address only when OpenStreetMap finds it inside Santa Fe;
// otherwise listed without a marker, never guessed. One lookup a second
// (Nominatim's limit), remembered in this browser.
const GEO_CACHE_KEY = 'sf_mapGeocode';
const readGeoCache = () => { try { return JSON.parse(localStorage.getItem(GEO_CACHE_KEY) || '{}'); } catch { return {}; } };
const writeGeoCache = (cache) => { try { localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache)); } catch { /* storage full or blocked */ } };

// "Blk 5 Lot 2 Rizal St, Barangay Sta. Fe, Dasmariñas, ..." → the part a search can use
const searchText = (location) => String(location || '')
  .replace(/\(Landmark:[^)]*\)/i, '')
  .replace(/Pinned location,?/i, '')
  .replace(/Barangay Sta\. Fe/i, 'Santa Fe')
  .trim();

let queue = Promise.resolve();
export const geocodeInSantaFe = (location) => {
  const text = searchText(location);
  if (!text) return Promise.resolve(null);
  const cache = readGeoCache();
  if (text in cache) return Promise.resolve(cache[text]);
  const run = async () => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&countrycodes=ph&viewbox=120.9600,14.3260,120.9700,14.3140&bounded=1&q=${encodeURIComponent(text)}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const hits = res.ok ? await res.json() : [];
      const hit = (Array.isArray(hits) ? hits : []).map((h) => [Number(h.lat), Number(h.lon)]).find(([la, ln]) => isWithinSantaFe(la, ln)) || null;
      const next = readGeoCache();
      next[text] = hit;
      writeGeoCache(next);
      return hit;
    } catch {
      return null;
    } finally {
      await new Promise((r) => setTimeout(r, 1100));
    }
  };
  const result = queue.then(run);
  queue = result.catch(() => null);
  return result;
};

// ── New report alert (admin) ────────────────────────────────────────────────
// Whether the new-report sounds are on (admin/map/reportSounds.js plays them).
const SOUND_KEY = 'sf_reportSound';
export const readReportSound = () => { try { return localStorage.getItem(SOUND_KEY) === 'on'; } catch { return false; } };
export const saveReportSound = (on) => { try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch { /* blocked */ } };
