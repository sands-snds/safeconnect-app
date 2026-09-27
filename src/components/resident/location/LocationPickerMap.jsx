import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SANTA_FE_BOUNDARY, SANTA_FE_CENTER } from './santaFeArea';

// Interactive map for the report forms: Barangay Santa Fe's boundary, and a
// pin the resident places by tapping the map or dragging it (or by "Use my
// current location", handled in useLocationPin). Replaces the Google Maps
// embed, which could only show a location, not pick one.
//
// Props:
//   pin        - { lat, lng } or null
//   onPick     - (lat, lng) => void, when the resident taps or drags
//   isOutside  - pin is outside Santa Fe (shows `outsideMessage`)
//   disabled   - e.g. while submitting
//   height     - map height in px

// A drawn pin (Leaflet's default marker images don't survive the CRA build).
const pinIcon = (color) => L.divIcon({
  className: '',
  html: `<i class="bi bi-geo-alt-fill" style="font-size:36px;color:${color};text-shadow:0 2px 4px rgba(0,0,0,.35);line-height:1"></i>`,
  iconSize: [36, 36],
  iconAnchor: [18, 34]
});

const ClickToPin = ({ onPick, disabled }) => {
  useMapEvents({
    click: (e) => { if (!disabled) onPick(e.latlng.lat, e.latlng.lng); }
  });
  return null;
};

// Pans to the pin when it moves (e.g. after "Use my current location"), and
// fixes the map's size once the modal has finished opening.
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

const LocationPickerMap = ({ pin, onPick, isOutside, outsideMessage, disabled = false, height = 240 }) => {
  const markerRef = useRef(null);
  const icon = useMemo(() => pinIcon(isOutside ? '#6b7280' : '#dc3545'), [isOutside]);

  const markerHandlers = useMemo(() => ({
    dragend: () => {
      const m = markerRef.current;
      if (m) {
        const { lat, lng } = m.getLatLng();
        onPick(lat, lng);
      }
    }
  }), [onPick]);

  return (
    <div style={{ marginTop: '10px' }}>
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
          scrollWheelZoom={false}
          style={{ height, width: '100%' }}
          attributionControl
        >
          {/* OpenStreetMap blocks tile requests that arrive without a Referer
              ("Access blocked"). Azure Static Web Apps sends
              Referrer-Policy: same-origin, which strips it, so set the policy
              on the tiles too (also set site-wide in staticwebapp.config.json). */}
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <Polygon
            positions={SANTA_FE_BOUNDARY}
            pathOptions={{ color: '#dc3545', weight: 2, dashArray: '6 4', fillColor: '#dc3545', fillOpacity: 0.06 }}
            interactive={false}
          />
          {pin && (
            <Marker
              position={[pin.lat, pin.lng]}
              icon={icon}
              draggable={!disabled}
              eventHandlers={markerHandlers}
              ref={markerRef}
            />
          )}
          <ClickToPin onPick={onPick} disabled={disabled} />
          <FollowPin pin={pin} />
        </MapContainer>

        {!pin && (
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

      {isOutside ? (
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
        <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#6b7280' }}>
          <i className="bi bi-geo-alt-fill"></i> Pinned at {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}. Drag the pin to adjust.
        </div>
      ) : (
        <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#6b7280' }}>
          The dashed line marks Barangay Santa Fe. Reports can only be made from inside it.
        </div>
      )}
    </div>
  );
};

export default LocationPickerMap;
