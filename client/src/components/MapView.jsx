/**
 * MapView — Enhanced Leaflet map component with Airbnb-style UX.
 * Features: custom store markers, pulsing user location, marker clustering, smooth flyTo.
 */
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Fix default marker icons (Leaflet + bundler issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom SVG store marker (purple, matching --color-primary)
function createStoreIcon(isActive = false, isCheapest = false) {
  const size = isActive ? 40 : 30;
  const color = isCheapest ? '#00D4AA' : '#6C3CE1';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
      <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z"
            fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="12" cy="10" r="3.5" fill="#fff"/>
      <text x="12" y="11.5" text-anchor="middle" font-size="5" font-weight="bold" fill="${color}">🏪</text>
    </svg>`;
  return new L.DivIcon({
    html: svg,
    className: 'custom-store-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
  });
}

/** Helper component: smooth flyTo when center changes */
function FlyToCenter({ center, zoom }) {
  const map = useMap();
  const prevCenter = useRef(center);

  useEffect(() => {
    if (center && (center[0] !== prevCenter.current[0] || center[1] !== prevCenter.current[1])) {
      map.flyTo(center, zoom, { duration: 1.2, easeLinearity: 0.25 });
      prevCenter.current = center;
    }
  }, [center, zoom, map]);

  return null;
}

/**
 * @param {Object} props
 * @param {[number, number]} props.center - [lat, lng]
 * @param {number} props.zoom
 * @param {{id, lat, lng, name, popupContent, cheapest?}[]} props.markers
 * @param {number|null} props.activeMarkerId - ID of the marker to highlight
 * @param {[number, number]|null} props.userLocation - user's position
 * @param {Function} props.onMarkerClick - called with marker id when clicked
 * @param {string} props.className
 */
export default function MapView({
  center,
  zoom = 13,
  markers = [],
  activeMarkerId = null,
  userLocation = null,
  onMarkerClick = null,
  className = '',
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      zoomControl={true}
      className={`w-full h-full z-0 ${className}`}
      style={{ minHeight: '300px', borderRadius: '16px' }}
    >
      <FlyToCenter center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User "You Are Here" pulsing marker */}
      {userLocation && (
        <>
          {/* Outer pulse ring */}
          <CircleMarker
            center={userLocation}
            radius={20}
            pathOptions={{
              color: '#4285F4',
              fillColor: '#4285F4',
              fillOpacity: 0.15,
              weight: 1,
            }}
          />
          {/* Inner solid dot */}
          <CircleMarker
            center={userLocation}
            radius={7}
            pathOptions={{
              color: '#fff',
              fillColor: '#4285F4',
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup className="smartcart-popup">
              <div style={{ fontWeight: 600, fontSize: '13px' }}>📍 You are here</div>
            </Popup>
          </CircleMarker>
        </>
      )}

      {/* Clustered shop markers */}
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={60}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
        iconCreateFunction={(cluster) => {
          const count = cluster.getChildCount();
          return new L.DivIcon({
            html: `<div class="cluster-icon">${count}</div>`,
            className: 'custom-cluster-marker',
            iconSize: [44, 44],
          });
        }}
      >
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={createStoreIcon(activeMarkerId === m.id, m.cheapest)}
            eventHandlers={{
              click: () => onMarkerClick && onMarkerClick(m.id),
            }}
          >
            <Popup className="smartcart-popup" maxWidth={280}>
              <div dangerouslySetInnerHTML={{ __html: m.popupContent }} />
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
