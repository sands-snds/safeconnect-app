import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { SANTA_FE_BOUNDARY } from './santaFeArea';

// Shared pieces of the Santa Fe maps (LocationPickerMap, IncidentMap).

const SANTA_FE_BOUNDS = L.latLngBounds(SANTA_FE_BOUNDARY);

// Every map stays on Barangay Santa Fe: it can't be dragged away from the
// barangay (a small margin keeps the boundary line off the edge), and zooming
// out stops once the whole barangay fits. Zooming in works as usual. The fit
// is worked out from the map's size, so it also fits phones, and recalculated
// when the map is resized. A GPS pin outside Santa Fe stays out of view; the
// form says why it can't be used.
const MARGIN = 0.08;
export function LimitToSantaFe() {
  const map = useMap();
  useEffect(() => {
    const area = L.latLngBounds(SANTA_FE_BOUNDARY).pad(MARGIN);
    map.options.maxBoundsViscosity = 1.0; // a hard edge, not a rubber band
    map.setMaxBounds(area);
    const apply = () => {
      const fit = map.getBoundsZoom(SANTA_FE_BOUNDS, false);
      if (!Number.isFinite(fit)) return;
      map.setMinZoom(fit);
      if (map.getZoom() < fit) map.setZoom(fit);
      map.panInsideBounds(area, { animate: false });
    };
    apply();
    map.on('resize', apply);
    return () => { map.off('resize', apply); };
  }, [map]);
  return null;
}

const switchButton = (active) => ({
  padding: '5px 10px',
  border: 'none',
  background: active ? '#1f2937' : '#fff',
  color: active ? '#fff' : '#374151',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer'
});

// The "Map | Satellite" switch, over the map's top-right corner. The map's
// wrapper must have `position: relative; isolation: isolate` (MAP_FRAME) so
// the switch stays above the map but under the page's own menus and headers.
export function MapTypeSwitch({ basemap, onChange }) {
  return (
    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 500, display: 'flex', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.3)' }}>
      {[['map', 'Map'], ['satellite', 'Satellite']].map(([key, label]) => (
        <button key={key} type="button" onClick={() => onChange(key)} aria-pressed={basemap === key} style={switchButton(basemap === key)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export const MAP_FRAME = { position: 'relative', isolation: 'isolate' };

// Google Street View of a spot, shown in the page. With a Google Maps Embed
// API key (REACT_APP_GOOGLE_MAPS_EMBED_KEY, free) it uses Google's official
// embed; without one, Google's keyless Street View embed.
const EMBED_KEY = process.env.REACT_APP_GOOGLE_MAPS_EMBED_KEY;
export const streetViewEmbedUrl = ({ lat, lng }) => (EMBED_KEY
  ? `https://www.google.com/maps/embed/v1/streetview?key=${encodeURIComponent(EMBED_KEY)}&location=${lat},${lng}&fov=90`
  : `https://www.google.com/maps?layer=c&cbll=${lat},${lng}&cbp=11,0,0,0,0&output=svembed`);

// The Street View pane beside a map. Without a usable pin, a short note.
export function StreetViewPane({ pin, height, emptyText }) {
  const lat = pin ? Number(pin.lat).toFixed(6) : null;
  const lng = pin ? Number(pin.lng).toFixed(6) : null;
  return (
    <div style={{ position: 'relative', height, background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d1d5db' }}>
      {pin ? (
        <iframe
          key={`${lat},${lng}`}
          title="Street View"
          src={streetViewEmbedUrl({ lat, lng })}
          style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '12px', lineHeight: 1.4 }}>
          <i className="bi bi-person-walking" style={{ fontSize: '22px' }} aria-hidden="true"></i>
          {emptyText}
        </div>
      )}
    </div>
  );
}
