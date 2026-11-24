import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SANTA_FE_BOUNDARY } from './santaFeArea';
import { BASEMAPS } from './LocationPickerMap';
import { LimitToSantaFe, MapTypeSwitch } from './mapLimits';
import { MAP_TYPES, RESOLVED_COLOR, isOpenStatus, geocodeInSantaFe } from './mapReports';

// Barangay Santa Fe with a marker per report, at the spot it was pinned.
// Open reports pulse until they are resolved; the colour, shape and icon
// tell the type. Same tiles, boundary and Map/Satellite switch as the
// report forms' LocationPickerMap.

const STYLE = `
  .im-wrap { position: relative; isolation: isolate; }
  .im-mk { position: relative; width: 34px; height: 34px; display: block; }
  .im-dot { position: absolute; inset: 0; border-radius: 50%; background: var(--c); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2.5px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,.45); }
  .im-mk.quake .im-dot { border-radius: 8px; transform: rotate(45deg) scale(.92); }
  .im-mk.quake .im-dot i { transform: rotate(-45deg); }
  .im-ring { position: absolute; inset: -2px; border-radius: 50%; border: 3px solid var(--c); opacity: 0; pointer-events: none; }
  .im-mk.open .im-ring { animation: im-ping var(--speed) ease-out infinite; }
  .im-mk.open .im-ring.r2 { animation-delay: calc(var(--speed) / 2); }
  .im-mk.resolved .im-dot { background: ${RESOLVED_COLOR}; box-shadow: 0 1px 3px rgba(0,0,0,.35); }
  .im-mk.selected .im-dot { box-shadow: 0 0 0 3px #111827, 0 2px 6px rgba(0,0,0,.45); }
  @keyframes im-ping { 0% { transform: scale(.7); opacity: .9; } 100% { transform: scale(2.4); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .im-mk.open .im-ring { animation: none; opacity: .55; transform: scale(1.5); } }
  .im-icon { background: none; border: 0; }
  .im-home { width: 30px; height: 30px; border-radius: 8px; background: #fff; color: var(--c); border: 2.5px solid var(--c); display: flex; align-items: center; justify-content: center; font-size: 15px; box-shadow: 0 2px 6px rgba(0,0,0,.35); }
  .im-popup .leaflet-popup-content-wrapper { border-radius: 12px; }
  .im-popup .leaflet-popup-content { margin: 12px 14px; min-width: 200px; font-family: inherit; overflow-y: auto; overscroll-behavior: contain; }
  .im-popup.im-popup-below .leaflet-popup-tip-container { position: absolute; top: -20px; left: 50%; margin-left: -20px; transform: rotate(180deg); }
  .im-popup .leaflet-popup-tip-container { left: 50%; margin-left: -20px; }
`;

const markerIcon = (report, selected) => {
  const t = MAP_TYPES[report.type] || MAP_TYPES.emergency;
  const open = isOpenStatus(report.status);
  return L.divIcon({
    className: 'im-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
    html: `<span class="im-mk ${report.type} ${open ? 'open' : 'resolved'}${selected ? ' selected' : ''}" style="--c:${t.color};--speed:${t.speed}">`
      + '<span class="im-ring"></span><span class="im-ring r2"></span>'
      + `<span class="im-dot"><i class="bi ${t.icon}" aria-hidden="true"></i></span></span>`
  });
};

// The resident's home (the pin from sign-up / Settings).
export const HOME_COLOR = '#0f766e';
const HOME_ICON = L.divIcon({
  className: 'im-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  html: `<span class="im-home" style="--c:${HOME_COLOR}"><i class="bi bi-house-heart-fill" aria-hidden="true"></i></span>`
});

// Fire on top, then the other open reports, resolved ones underneath.
const Z_ORDER = { fire: 600, quake: 500, flood: 400, typhoon: 300, emergency: 350, assist: 200, crime: 100 };

function FitSantaFe() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(SANTA_FE_BOUNDARY, { padding: [24, 24] });
    // The container may still be settling (a page or panel just opened).
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

// Keeps every report popup fully inside the map. The map can't be dragged
// past the Santa Fe edge (LimitToSantaFe), so Leaflet's own auto-pan can't
// make room for a popup on a pin near the top boundary, and the popup was
// cut off. Instead each popup places itself: above the pin when it fits,
// otherwise below it (the arrow flips to point up), slid sideways to stay
// clear of the left / right edges, and, when it's taller than the room on
// either side, capped to that room with its own scroll. It's worked out again
// whenever the map moves, zooms or resizes, or the popup's content changes.
const EDGE = 8;        // px kept free along the map's edges
const PIN_HALF = 18;   // the report marker's popupAnchor
const TIP = 12;        // visible height of the popup's arrow
export function placePopup(map, popup) {
  const container = popup.getElement && popup.getElement();
  if (!map || !container || !popup.getLatLng()) return;
  const wrapper = container.querySelector('.leaflet-popup-content-wrapper');
  const content = container.querySelector('.leaflet-popup-content');
  const tip = container.querySelector('.leaflet-popup-tip-container');
  if (!wrapper || !content) return;

  // Measure at the natural size.
  container.classList.remove('im-popup-below');
  content.style.maxHeight = '';
  if (tip) tip.style.marginLeft = '';
  const size = map.getSize();
  const pin = map.latLngToContainerPoint(popup.getLatLng());
  const height = wrapper.offsetHeight;
  const width = container.offsetWidth;
  const above = pin.y - PIN_HALF - TIP - EDGE;
  const below = size.y - pin.y - PIN_HALF - TIP - EDGE;

  let putBelow = false;
  let room = null;
  if (height > above) {
    if (height <= below) putBelow = true;
    else { putBelow = below > above; room = Math.max(80, putBelow ? below : above); }
  }
  if (room !== null) {
    const chrome = wrapper.offsetHeight - content.offsetHeight; // the wrapper's padding / margins
    content.style.maxHeight = `${Math.max(40, room - chrome)}px`;
  }
  if (putBelow) container.classList.add('im-popup-below');
  const shownHeight = wrapper.offsetHeight;

  // Slide sideways to stay inside the map; the arrow stays on the pin.
  let dx = 0;
  if (width < size.x - 2 * EDGE) {
    const left = pin.x - width / 2;
    if (left < EDGE) dx = EDGE - left;
    else if (left + width > size.x - EDGE) dx = size.x - EDGE - (left + width);
  }
  if (tip) tip.style.marginLeft = dx ? `${-20 - dx}px` : '';

  // Leaflet sets the popup's bottom at (pin anchor - offset.y); below the pin
  // that is the full pin height, the arrow and the popup itself further down.
  const dy = putBelow ? 2 * PIN_HALF + TIP + shownHeight : 7;
  popup.options.offset = L.point(Math.round(dx), Math.round(dy));
  if (typeof popup._updatePosition === 'function') popup._updatePosition();
  else popup.update();
}

function KeepPopupsInView() {
  const map = useMap();
  useEffect(() => {
    let open = null;
    let observer = null;
    let frame = 0;
    const replace = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => open && placePopup(map, open));
    };
    const onOpen = (e) => {
      open = e.popup;
      replace();
      if (observer) observer.disconnect();
      const body = open.getElement()?.querySelector('.leaflet-popup-content > *');
      if (body && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(replace);
        observer.observe(body);
      }
    };
    const onClose = (e) => {
      if (e.popup !== open) return;
      open = null;
      if (observer) { observer.disconnect(); observer = null; }
    };
    map.on('popupopen', onOpen);
    map.on('popupclose', onClose);
    map.on('moveend zoomend resize', replace);
    return () => {
      cancelAnimationFrame(frame);
      if (observer) observer.disconnect();
      map.off('popupopen', onOpen);
      map.off('popupclose', onClose);
      map.off('moveend zoomend resize', replace);
    };
  }, [map]);
  return null;
}

// Opens the selected report's popup and brings it into view.
function FollowSelection({ selectedKey, markers }) {
  const map = useMap();
  useEffect(() => {
    const marker = selectedKey && markers.current[selectedKey];
    if (!marker) return;
    map.panTo(marker.getLatLng(), { animate: true });
    marker.openPopup();
  }, [map, selectedKey, markers]);
  return null;
}

// placeAll: also look up the address of finished reports without a pin (the
// resident's own map shows every report; the staff map only the open ones).
// home: { lat, lng, label } shows the resident's home pin (Your Reports on the Map).
export default function IncidentMap({ reports, selectedKey, onSelect, renderPopup, height = 470, label = 'Map of Barangay Santa Fe', placeAll = false, home = null }) {
  const [basemap, setBasemap] = useState('satellite'); // satellite first; Map is one tap away
  const [found, setFound] = useState({});
  const markers = useRef({});
  const tiles = BASEMAPS[basemap];

  // Open reports with no pin: place them from their address when it's found inside Santa Fe.
  useEffect(() => {
    let cancelled = false;
    reports
      .filter((r) => !r.position && (placeAll || isOpenStatus(r.status)) && r.location && !(r.key in found))
      .forEach((r) => {
        geocodeInSantaFe(r.location).then((pos) => {
          if (!cancelled) setFound((prev) => (r.key in prev ? prev : { ...prev, [r.key]: pos }));
        });
      });
    return () => { cancelled = true; };
  }, [reports, found, placeAll]);

  const placed = useMemo(() => reports
    .map((r) => ({ ...r, position: r.position || found[r.key] || null }))
    .filter((r) => r.position), [reports, found]);

  const boundaryStyle = basemap === 'satellite'
    ? { color: '#facc15', weight: 3, dashArray: '6 4', fillOpacity: 0 }
    : { color: '#dc3545', weight: 2, dashArray: '6 4', fillColor: '#dc3545', fillOpacity: 0.06 };

  return (
    <div className="im-wrap" role="region" aria-label={label}>
      <style>{STYLE}</style>
      <MapContainer
        bounds={SANTA_FE_BOUNDARY}
        minZoom={14}
        maxZoom={19}
        scrollWheelZoom
        style={{ height, width: '100%' }}
        attributionControl
      >
        <TileLayer
          key={basemap}
          url={tiles.url}
          attribution={tiles.attribution}
          maxNativeZoom={tiles.maxNativeZoom}
          maxZoom={19}
          referrerPolicy="strict-origin-when-cross-origin"
        />
        <Polygon positions={SANTA_FE_BOUNDARY} pathOptions={boundaryStyle} interactive={false} />
        {home && (
          <Marker position={[home.lat, home.lng]} icon={HOME_ICON} zIndexOffset={-100} title={home.label} keyboard={false} />
        )}
        {placed.map((r) => (
          <Marker
            key={r.key}
            position={r.position}
            icon={markerIcon(r, r.key === selectedKey)}
            zIndexOffset={(isOpenStatus(r.status) ? 1000 : 0) + (Z_ORDER[r.type] || 0)}
            title={`${(MAP_TYPES[r.type] || MAP_TYPES.emergency).name} ${r.reference || ''}`.trim()}
            keyboard
            ref={(m) => { if (m) markers.current[r.key] = m; else delete markers.current[r.key]; }}
            eventHandlers={{ click: () => onSelect && onSelect(r.key) }}
          >
            {renderPopup && (
              <Popup className="im-popup" autoPan={false} maxWidth={Math.max(220, Math.min(320, window.innerWidth - 48))} eventHandlers={{ remove: () => onSelect && selectedKey === r.key && onSelect(null) }}>
                {renderPopup(r)}
              </Popup>
            )}
          </Marker>
        ))}
        <FitSantaFe />
        <LimitToSantaFe />
        <FollowSelection selectedKey={selectedKey} markers={markers} />
        <KeepPopupsInView />
      </MapContainer>

      <MapTypeSwitch basemap={basemap} onChange={setBasemap} />
    </div>
  );
}

