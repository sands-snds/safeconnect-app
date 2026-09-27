import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SANTA_FE_BOUNDARY, SANTA_FE_CENTER } from './santaFeArea';

// Map of Barangay Santa Fe with its boundary and a pin.
// - Report forms: the resident places the pin by tapping the map or dragging
//   it (or via "Use my current location", handled in useLocationPin).
// - Admin report details (readOnly): shows where the report was pinned.
// A Map / Satellite switch helps where streets aren't labelled: residents
// can recognise their own roof.
//
// Props:
//   pin        - { lat, lng } or null
//   onPick     - (lat, lng) => void, when the resident taps or drags
//   isOutside  - pin is outside Santa Fe (shows `outsideMessage`)
//   disabled   - e.g. while submitting
//   readOnly   - display only: no tapping/dragging, no hints
//   height     - map height in px

// OpenStreetMap blocks tile requests that arrive without a Referer
// ("Access blocked"). Azure Static Web Apps sends Referrer-Policy:
// same-origin, which strips it, so the policy is set on the tiles too (and
// site-wide in staticwebapp.config.json).
const BASEMAPS = {
  map: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxNativeZoom: 19
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
    maxNativeZoom: 18 // Esri has no finer imagery here; zooms past it are upscaled
  }
};

// A drawn pin (Leaflet's default marker images don't survive the CRA build).
const pinIcon = (color) => L.divIcon({
  className: '',
  html: `<i class="bi bi-geo-alt-fill" style="font-size:36px;color:${color};text-shadow:0 2px 4px rgba(0,0,0,.45);line-height:1"></i>`,
  iconSize: [36, 36],
  iconAnchor: [18, 34]
});

const ClickToPin = ({ onPick, disabled }) => {
  useMapEvents({
    click: (e) => { if (!disabled) onPick(e.latlng.lat, e.latlng.lng); }
  });
  return null;
};

// Pans to the pin when it moves off-screen (e.g. after "Use my current
// location"), and fixes the map's size once the modal has finished opening.
const FollowPin = ({ pin }) => {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(t);
  }, [map]);
  useEffect(() => {
    // Only when the pin is off-screen, so tapping the map doesn't jump it around.
    if (pin && !map.getBounds().contains([pin.lat, pin.lng])) {
      map.panTo([pin.lat, pin.lng], { animate: true });
    }
  }, [map, pin]);
  return null;
};

const switchButton = (active) => ({
  padding: '5px 10px',
  border: 'none',
  background: active ? '#1f2937' : '#fff',
  color: active ? '#fff' : '#374151',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer'
});

const LocationPickerMap = ({
  pin,
  onPick,
  isOutside = false,
  outsideMessage,
  disabled = false,
  readOnly = false,
  height = 240
}) => {
  const [basemap, setBasemap] = useState('map');
  const markerRef = useRef(null);
  const icon = useMemo(() => pinIcon(isOutside ? '#6b7280' : '#dc3545'), [isOutside]);
  const tiles = BASEMAPS[basemap];
  const canPick = !readOnly && !disabled && typeof onPick === 'function';

  const markerHandlers = useMemo(() => ({
    dragend: () => {
      const m = markerRef.current;
      if (m && onPick) {
        const { lat, lng } = m.getLatLng();
        onPick(lat, lng);
      }
    }
  }), [onPick]);

  // On satellite the boundary needs to stand out against the imagery.
  const boundaryStyle = basemap === 'satellite'
    ? { color: '#facc15', weight: 3, dashArray: '6 4', fillOpacity: 0 }
    : { color: '#dc3545', weight: 2, dashArray: '6 4', fillColor: '#dc3545', fillOpacity: 0.06 };

  return (
    <div style={{ marginTop: readOnly ? 0 : '10px' }}>
      <div
        style={{
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
          border: `1px solid ${isOutside ? '#dc3545' : '#d1d5db'}`
        }}
      >
        <MapContainer
          center={pin ? [pin.lat, pin.lng] : [SANTA_FE_CENTER.lat, SANTA_FE_CENTER.lng]}
          zoom={17}
          minZoom={14}
          maxZoom={19}
          scrollWheelZoom={false}
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
          {pin && (
            <Marker
              position={[pin.lat, pin.lng]}
              icon={icon}
              draggable={canPick}
              eventHandlers={markerHandlers}
              ref={markerRef}
            />
          )}
          {!readOnly && <ClickToPin onPick={onPick} disabled={!canPick} />}
          <FollowPin pin={pin} />
        </MapContainer>

        {/* Map / Satellite switch (top-right, clear of the zoom buttons). */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 500,
            display: 'flex',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,.3)'
          }}
        >
          {[['map', 'Map'], ['satellite', 'Satellite']].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setBasemap(key)}
              aria-pressed={basemap === key}
              style={switchButton(basemap === key)}
            >
              {label}
            </button>
          ))}
        </div>

        {!pin && !readOnly && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '10px',
              transform: 'translateX(-50%)',
              zIndex: 500,
              background: 'rgba(17,24,39,0.8)',
              color: '#fff',
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: '999px',
              pointerEvents: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="bi bi-hand-index-thumb"></i> Tap the map to pin the location
          </div>
        )}
      </div>

      {readOnly ? null : isOutside ? (
        <div
          role="alert"
          style={{
            marginTop: '8px',
            padding: '8px 10px',
            borderRadius: '6px',
            background: '#fee2e2',
            color: '#991b1b',
            fontSize: '12.5px',
            lineHeight: 1.4
          }}
        >
          <i className="bi bi-exclamation-octagon-fill"></i> {outsideMessage}
        </div>
      ) : pin ? (
        <div style={{ marginTop: '6px', fontSize: '15px', color: '#6b7280' }}>
          <i className="bi bi-geo-alt-fill"></i> Pinned. Drag the pin to adjust (try Satellite if streets aren't labelled).
          House number and street are now optional, but a landmark helps responders find you.
        </div>
      ) : (
        <div style={{ marginTop: '6px', fontSize: '15px', color: '#6b7280' }}>
          The dashed line marks Barangay Santa Fe. Reports can only be made from inside it.
        </div>
      )}
    </div>
  );
};

export default LocationPickerMap;
