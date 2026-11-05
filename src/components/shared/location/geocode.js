import { SANTA_FE_BOUNDARY, isWithinSantaFe } from './santaFeArea';

// OpenStreetMap Nominatim, both ways: a map pin to an address (reverse) and a
// typed address to a map pin (forward). Nominatim allows about one request a
// second, so callers debounce the forward search.
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const AREA_SUFFIX = 'Santa Fe, Dasmariñas, Cavite, Philippines';

// The barangay's bounding box, so a search only finds places inside Santa Fe.
const lats = SANTA_FE_BOUNDARY.map(([lat]) => lat);
const lngs = SANTA_FE_BOUNDARY.map(([, lng]) => lng);
const VIEWBOX = [Math.min(...lngs), Math.max(...lats), Math.max(...lngs), Math.min(...lats)].join(',');

export const reverseGeocode = async (lat, lng) => {
  const res = await fetch(
    `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
  );
  const data = await res.json();
  const addr = data?.address || {};
  const houseNumber = addr.house_number || '';
  const street = addr.road || addr.pedestrian || addr.footway || '';
  // The subdivision or purok, when OpenStreetMap knows it.
  const area = addr.residential || addr.quarter || addr.neighbourhood || '';
  const line = [houseNumber, street || area].filter(Boolean).join(' ');
  return {
    houseNumber,
    street: street || area,
    area: street ? area : '',
    fullAddress: `${line ? line + ', ' : ''}Barangay Sta. Fe, Dasmariñas, Cavite, Philippines`
  };
};

const search = async (query) => {
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: `${query}, ${AREA_SUFFIX}`,
    countrycodes: 'ph',
    viewbox: VIEWBOX,
    bounded: '1',
    limit: '1'
  });
  const res = await fetch(`${NOMINATIM}/search?${params}`);
  const [hit] = await res.json();
  if (!hit) return null;
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  return Number.isFinite(lat) && Number.isFinite(lng) && isWithinSantaFe(lat, lng) ? { lat, lng } : null;
};

// A typed address to { lat, lng } inside Santa Fe, or null when it can't be
// found. House numbers are rarely mapped here, so it looks for the street
// (with the subdivision or purok first, then without it).
export const forwardGeocode = async ({ street = '', area = '' } = {}) => {
  const s = street.trim();
  const a = area.trim();
  if (!s && !a) return null;
  if (s && a) {
    const withArea = await search(`${s}, ${a}`);
    if (withArea) return withArea;
  }
  return search(s || a);
};
