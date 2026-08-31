import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GpsSample } from '../routes/demoRoute';
import type { Tunnel } from '../lib/tunnelDb';

// Fix Leaflet's default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icons
const realIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const ghostIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Portal Icons
const entryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [32, 32]
});

const exitIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -28],
  shadowSize: [32, 32]
});

interface MapViewProps {
  route: GpsSample[];
  currentPos: { lat: number, lon: number } | null;
  isGhost: boolean;
  activeTunnel: Tunnel | null;
  allTunnels: Tunnel[];
}

const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

export const MapView = ({ route, currentPos, isGhost, activeTunnel, allTunnels }: MapViewProps) => {
  const defaultCenter: [number, number] = [32.355, 77.18]; // Centered on Atal Tunnel
  const center: [number, number] = currentPos ? [currentPos.lat, currentPos.lon] : defaultCenter;
  const routePositions: [number, number][] = route.map(s => [s.lat, s.lon]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=876e366e-f63a-4ce8-bff9-3ae90c489f52"
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Full Open Road Path (Blue) */}
        <Polyline positions={routePositions} color="#3b82f6" weight={4} opacity={0.6} dashArray="4, 8" />

        {/* All Mapped Tunnels in Database (Distinct Golden Glow) */}
        {allTunnels.map((tun) => {
          const coords = tun.geometry.coordinates.map((c: any) => [c[1], c[0]]) as [number, number][];
          const isCurrent = activeTunnel?.id === tun.id;
          return (
            <Polyline
              key={tun.id}
              positions={coords}
              color={isCurrent ? '#ef4444' : '#f59e0b'}
              weight={isCurrent ? 8 : 5}
              opacity={isCurrent ? 1 : 0.8}
            />
          );
        })}

        {/* Portal Markers */}
        {allTunnels.map((tun) => (
          <div key={`portal-${tun.id}`}>
            <Marker position={[tun.entryPoint[1], tun.entryPoint[0]]} icon={entryIcon}>
              <Popup>
                <div style={{ color: '#000', fontSize: '11px' }}>
                  <b>🟢 {tun.name} South Portal (Entry)</b><br />
                  GPS Blackout Starts Here
                </div>
              </Popup>
            </Marker>
            <Marker position={[tun.exitPoint[1], tun.exitPoint[0]]} icon={exitIcon}>
              <Popup>
                <div style={{ color: '#000', fontSize: '11px' }}>
                  <b>🔴 {tun.name} North Portal (Exit)</b><br />
                  GPS Reacquisition Target
                </div>
              </Popup>
            </Marker>
          </div>
        ))}

        {/* Current Vehicle Marker */}
        {currentPos && (
          <>
            <MapUpdater center={center} />
            <Marker position={center} icon={isGhost ? ghostIcon : realIcon}>
              <Popup>
                <div style={{ color: '#000', fontSize: '12px' }}>
                  <b>{isGhost ? '🚇 DR Synthetic Position' : '🛰️ GNSS Fix'}</b><br />
                  Lat: {currentPos.lat.toFixed(4)}, Lon: {currentPos.lon.toFixed(4)}
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
};
