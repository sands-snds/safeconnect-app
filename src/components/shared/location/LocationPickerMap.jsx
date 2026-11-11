import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SANTA_FE_BOUNDARY, SANTA_FE_CENTER } from './santaFeArea';
import { useLanguage } from '../../../i18n/LanguageContext';
import { LimitToSantaFe, MapTypeSwitch, MAP_FRAME, StreetViewPane } from './mapLimits';




















export const BASEMAPS = {
  map: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxNativeZoom: 19
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
    maxNativeZoom: 18 
  }
};


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



const FollowPin = ({ pin }) => {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(t);
  }, [map]);
  useEffect(() => {
    if (pin && !map.getBounds().contains([pin.lat, pin.lng])) {
      map.panTo([pin.lat, pin.lng], { animate: true });
    }
  }, [map, pin]);
  return null;
};

const LocationPickerMap = ({
  pin: rawPin,
  onPick,
  isOutside = false,
  outsideMessage,
  disabled = false,
  readOnly = false,
  height = 240,
  streetView = true,
  // notes: other wording for the line under the map ({ outside, pinned, empty });
  // the report forms' wording is the default.
  notes = null
}) => {
  const { t } = useLanguage();
  const pinLat = Number(rawPin?.lat);
  const pinLng = Number(rawPin?.lng);
  const hasPin = rawPin != null && Number.isFinite(pinLat) && Number.isFinite(pinLng);
  const pin = useMemo(() => (hasPin ? { lat: pinLat, lng: pinLng } : null), [hasPin, pinLat, pinLng]);
  const [basemap, setBasemap] = useState('satellite'); // satellite first; Map is one tap away
  // Street View opens beside the map only when asked for (the button on the
  // map): Google's street photos cover only some of Santa Fe's roads.
  const [showStreet, setShowStreet] = useState(false);
  const canShowStreet = streetView && Boolean(pin) && !isOutside;
  const streetOpen = canShowStreet && showStreet;
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

  
  const boundaryStyle = basemap === 'satellite'
    ? { color: '#facc15', weight: 3, dashArray: '6 4', fillOpacity: 0 }
    : { color: '#dc3545', weight: 2, dashArray: '6 4', fillColor: '#dc3545', fillOpacity: 0.06 };

  return (
    <div style={{ marginTop: readOnly ? 0 : '10px' }}>
      {/* The map and, when opened, Google Street View of the pin beside it. */}
      <div style={{ display: 'grid', gridTemplateColumns: streetOpen ? '1fr 1fr' : '1fr', gap: '8px' }}>
      <div
        style={{
          ...MAP_FRAME,
          minWidth: 0,
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
          <LimitToSantaFe include={isOutside ? pin : null} />
        </MapContainer>

        
        <MapTypeSwitch basemap={basemap} onChange={setBasemap} />

        {canShowStreet && (
          <button
            type="button"
            onClick={() => setShowStreet((v) => !v)}
            aria-pressed={streetOpen}
            title={streetOpen ? t('reportForm.streetViewHide') : t('reportForm.streetViewShow')}
            style={{
              position: 'absolute',
              left: '10px',
              bottom: '22px',
              zIndex: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              border: 'none',
              borderRadius: '6px',
              background: streetOpen ? '#1f2937' : '#fff',
              color: streetOpen ? '#fff' : '#1f2937',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,.3)'
            }}
          >
            <i className={`bi ${streetOpen ? 'bi-x-lg' : 'bi-person-walking'}`} aria-hidden="true"></i> Street View
          </button>
        )}


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
            <i className="bi bi-hand-index-thumb"></i> {t('reportForm.mapTapToPin')}
          </div>
        )}
      </div>
      {streetOpen && (
        <StreetViewPane pin={pin} height={height} emptyText={t('reportForm.streetViewEmpty')} />
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
          <i className="bi bi-exclamation-octagon-fill"></i> {notes?.outside || t('reportForm.outsideSantaFe')}
        </div>
      ) : pin ? (
        <div style={{ marginTop: '6px', fontSize: '15px', color: '#6b7280' }}>
          <i className="bi bi-geo-alt-fill"></i> {notes?.pinned || t('reportForm.mapPinnedHint')}
        </div>
      ) : (
        <div style={{ marginTop: '6px', fontSize: '15px', color: '#6b7280' }}>
          {notes?.empty || 'The dashed line marks Barangay Sta. Fe. Reports can only be made from inside it.'}
        </div>
      )}
    </div>
  );
};

export default LocationPickerMap;
