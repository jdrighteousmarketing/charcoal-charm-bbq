import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Fix default leaflet marker icons
import 'leaflet/dist/leaflet.css';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const truckIcon = L.divIcon({
  html: `<div style="background:#f59e0b;width:32px;height:32px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;">🚚</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const userIcon = L.divIcon({
  html: `<div style="background:#3b82f6;width:20px;height:20px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function FlyToUser({ coords }) {
  const map = useMap();
  if (coords) map.flyTo([coords.lat, coords.lng], 14, { duration: 1.2 });
  return null;
}

export default function DirectionsMap({ truckLat, truckLng, address }) {
  const [userCoords, setUserCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetDirections = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setError('Unable to retrieve your location. Please allow location access.');
        setLoading(false);
      }
    );
  };

  const directionsUrl = userCoords
    ? `https://www.google.com/maps/dir/${userCoords.lat},${userCoords.lng}/${truckLat},${truckLng}`
    : `https://www.google.com/maps/dir//${truckLat},${truckLng}`;

  const center = userCoords
    ? [(userCoords.lat + truckLat) / 2, (userCoords.lng + truckLng) / 2]
    : [truckLat, truckLng];

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card">
      <div className="h-64 relative">
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Marker position={[truckLat, truckLng]} icon={truckIcon}>
            <Popup>{address || 'Food Truck Location'}</Popup>
          </Marker>
          {userCoords && (
            <>
              <FlyToUser coords={userCoords} />
              <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon}>
                <Popup>You are here</Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>

      <div className="p-4 flex flex-col gap-2">
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button
            onClick={handleGetDirections}
            disabled={loading}
            className="flex-1 gap-2"
            variant={userCoords ? 'outline' : 'default'}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            {loading ? 'Locating...' : userCoords ? 'Update My Location' : 'Get Directions'}
          </Button>
          {userCoords && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button className="w-full gap-2">
                <Navigation className="w-4 h-4" />
                Open in Maps
              </Button>
            </a>
          )}
        </div>
        {!userCoords && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary text-center hover:underline"
          >
            Skip — Open in Google Maps →
          </a>
        )}
      </div>
    </div>
  );
}