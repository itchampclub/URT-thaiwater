import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, Polyline, Tooltip, Circle } from 'react-leaflet';
import L from 'leaflet';
import { WaterLevelData, RainData, GeoLocation } from '../types';
import StationMarker from './StationMarker';
import RainMarker from './RainMarker';
import { getSituationColor, calculateDistance } from '../utils/geoUtils';

// Default center: Surat Thani City
const DEFAULT_CENTER: GeoLocation = { lat: 9.149, lng: 99.326 };

interface MapComponentProps {
  stations: WaterLevelData[];
  rainStations: RainData[];
  userLocation: GeoLocation;
  onUserLocationChange: (loc: GeoLocation) => void;
  nearestStation: { station: WaterLevelData | null; distance: number };
  nearestRainStation: { station: RainData | null; distance: number };
  showWaterStations: boolean;
  showRainStations: boolean;
}

// Helper to handle map flyTo
const MapController: React.FC<{ center: GeoLocation }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], map.getZoom());
  }, [center, map]);
  return null;
};

// Custom Draggable Marker for User
const UserPin: React.FC<{ position: GeoLocation; onChange: (loc: GeoLocation) => void }> = ({ position, onChange }) => {
  const [draggable, setDraggable] = useState(true);
  const map = useMap();

  const markerRef = React.useRef<L.Marker>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
            const latLng = marker.getLatLng();
            onChange({ lat: latLng.lat, lng: latLng.lng });
            map.flyTo(latLng);
        }
      },
    }),
    [onChange, map],
  );

  // Custom HTML Icon for the user pin
  const icon = L.divIcon({
    className: 'custom-user-icon',
    html: `
      <div class="relative">
        <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg absolute top-[-8px] left-[-8px] animate-pulse"></div>
        <div class="w-8 h-8 bg-blue-500/30 rounded-full absolute top-[-16px] left-[-16px] animate-ping"></div>
      </div>
    `,
    iconSize: [0, 0], // Size handled by CSS/HTML
  });

  return (
    <Marker
      draggable={draggable}
      eventHandlers={eventHandlers}
      position={[position.lat, position.lng]}
      ref={markerRef}
      icon={icon}
      zIndexOffset={1000}
    >
      <Popup minWidth={90}>
        <div className="text-center">
          <span className="font-bold text-blue-600">ตำแหน่งของคุณ</span>
          <br/>
          <span className="text-xs text-slate-500">(ลากเพื่อเปลี่ยนจุด)</span>
        </div>
      </Popup>
    </Marker>
  );
};

const MapComponent: React.FC<MapComponentProps> = ({ 
  stations, 
  rainStations, 
  userLocation, 
  onUserLocationChange, 
  nearestStation,
  nearestRainStation,
  showWaterStations,
  showRainStations
}) => {
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);

  // Calculate stations within 10km radius
  const waterStationsInRadius = useMemo(() => {
    return stations.filter(s => 
      calculateDistance(userLocation.lat, userLocation.lng, s.station.tele_station_lat, s.station.tele_station_long) <= 10
    );
  }, [stations, userLocation]);

  const rainStationsInRadius = useMemo(() => {
    return rainStations.filter(s => 
      calculateDistance(userLocation.lat, userLocation.lng, s.station.tele_station_lat, s.station.tele_station_long) <= 10
    );
  }, [rainStations, userLocation]);

  return (
    <MapContainer 
      center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]} 
      zoom={9} 
      scrollWheelZoom={true} 
      className="w-full h-full z-0 rounded-lg overflow-hidden shadow-inner"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapController center={userLocation} />

      {/* 10km Radius Shadow Cover */}
      <Circle 
        center={[userLocation.lat, userLocation.lng]}
        radius={10000} // 10km in meters
        pathOptions={{
          fillColor: '#64748B', // Slate-500
          fillOpacity: 0.1,
          color: '#94A3B8', // Slate-400
          weight: 1,
          dashArray: '5, 10'
        }}
      />

      <UserPin position={userLocation} onChange={onUserLocationChange} />

      {/* Lines to ALL Water Stations in 10km Radius */}
      {showWaterStations && waterStationsInRadius.map(s => (
         <Polyline
           key={`radius-line-water-${s.id}`}
           positions={[
             [userLocation.lat, userLocation.lng],
             [s.station.tele_station_lat, s.station.tele_station_long]
           ]}
           pathOptions={{
             color: getSituationColor(s.situation_level),
             weight: 1,
             opacity: 0.3,
           }}
         />
      ))}

      {/* Lines to ALL Rain Stations in 10km Radius */}
      {showRainStations && rainStationsInRadius.map(s => (
         <Polyline
           key={`radius-line-rain-${s.id}`}
           positions={[
             [userLocation.lat, userLocation.lng],
             [s.station.tele_station_lat, s.station.tele_station_long]
           ]}
           pathOptions={{
             color: '#60A5FA',
             weight: 1,
             opacity: 0.2,
           }}
         />
      ))}

      {/* Connection Line to Nearest Water Station (Highlighted) */}
      {showWaterStations && nearestStation.station && (
        <Polyline 
          positions={[
            [userLocation.lat, userLocation.lng],
            [nearestStation.station.station.tele_station_lat, nearestStation.station.station.tele_station_long]
          ]}
          pathOptions={{
            color: getSituationColor(nearestStation.station.situation_level),
            weight: 3,
            opacity: 0.8,
            dashArray: '10, 10',
            lineCap: 'round'
          }}
        >
          <Tooltip sticky direction="center" className="font-sans text-xs font-bold bg-white/90 text-slate-700 border-none shadow-md">
            {nearestStation.distance.toFixed(1)} กม. (น้ำ)
          </Tooltip>
        </Polyline>
      )}

      {/* Connection Line to Nearest Rain Station (Highlighted) */}
      {showRainStations && nearestRainStation.station && (
        <Polyline 
          positions={[
            [userLocation.lat, userLocation.lng],
            [nearestRainStation.station.station.tele_station_lat, nearestRainStation.station.station.tele_station_long]
          ]}
          pathOptions={{
            color: '#60A5FA',
            weight: 2,
            opacity: 0.6,
            dashArray: '5, 5',
            lineCap: 'round'
          }}
        />
      )}

      {/* Water Level Stations */}
      {showWaterStations && stations.map((station) => (
        <StationMarker
          key={`water-${station.id}`}
          data={station}
          isSelected={selectedStationId === station.id || nearestStation.station?.id === station.id}
          onClick={() => setSelectedStationId(station.id)}
        />
      ))}

      {/* Rain Stations */}
      {showRainStations && rainStations.map((station) => {
        // Check for overlap with any water station ONLY if water stations are visible
        const isOverlapping = showWaterStations && stations.some(s => 
          Math.abs(s.station.tele_station_lat - station.station.tele_station_lat) < 0.0001 && 
          Math.abs(s.station.tele_station_long - station.station.tele_station_long) < 0.0001
        );
        
        // If overlapping, shift the rain marker slightly to the North-East (approx 150m)
        // 0.0015 degrees is roughly 165 meters
        const offset = isOverlapping ? 0.0015 : 0;
        const lat = station.station.tele_station_lat + offset;
        const lng = station.station.tele_station_long + offset;

        return (
          <RainMarker
            key={`rain-${station.id}`}
            data={station}
            position={[lat, lng]}
          />
        );
      })}
    </MapContainer>
  );
};

export default MapComponent;