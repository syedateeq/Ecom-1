/**
 * MapView — Modular Leaflet map component.
 * Accepts center, zoom, markers[] props.
 * Designed to be swappable with Google Maps or Mapbox.
 */
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icons (Leaflet + bundler issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom shop marker icon
const shopIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// User location icon (blue)
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/** Helper component to re-center map when center prop changes */
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

/**
 * @param {Object} props
 * @param {[number, number]} props.center - [lat, lng]
 * @param {number} props.zoom
 * @param {{id, lat, lng, name, popupContent}[]} props.markers
 * @param {number|null} props.activeMarkerId - ID of the marker to highlight
 * @param {[number, number]|null} props.userLocation - user's position
 * @param {string} props.className
 */
export default function MapView({ center, zoom = 13, markers = [], activeMarkerId = null, userLocation = null, className = '' }) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      className={`w-full h-full rounded-xl z-0 ${className}`}
      style={{ minHeight: '300px' }}
    >
      <ChangeView center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User location marker */}
      {userLocation && (
        <Marker position={userLocation} icon={userIcon}>
          <Popup className="smartcart-popup">
            <div style={{ fontWeight: 600, fontSize: '13px' }}>📍 Your Location</div>
          </Popup>
        </Marker>
      )}

      {/* Shop markers */}
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={shopIcon}
        >
          <Popup className="smartcart-popup" maxWidth={280}>
            <div dangerouslySetInnerHTML={{ __html: m.popupContent }} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
