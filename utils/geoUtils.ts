import { WaterLevelData, RainData, GeoLocation } from '../types';

// Haversine formula to calculate distance in km
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

export const findNearestStation = (userLoc: GeoLocation, stations: WaterLevelData[]): { station: WaterLevelData | null, distance: number } => {
  let minDistance = Infinity;
  let nearest: WaterLevelData | null = null;

  stations.forEach(station => {
    const dist = calculateDistance(
      userLoc.lat,
      userLoc.lng,
      station.station.tele_station_lat,
      station.station.tele_station_long
    );

    if (dist < minDistance) {
      minDistance = dist;
      nearest = station;
    }
  });

  return { station: nearest, distance: minDistance };
};

export const findNearestRainStation = (userLoc: GeoLocation, stations: RainData[]): { station: RainData | null, distance: number } => {
  let minDistance = Infinity;
  let nearest: RainData | null = null;

  stations.forEach(station => {
    const dist = calculateDistance(
      userLoc.lat,
      userLoc.lng,
      station.station.tele_station_lat,
      station.station.tele_station_long
    );

    if (dist < minDistance) {
      minDistance = dist;
      nearest = station;
    }
  });

  return { station: nearest, distance: minDistance };
};

export const findNearbyRainStations = (userLoc: GeoLocation, stations: RainData[], radiusKm: number = 50): Array<{ station: RainData, distance: number }> => {
  return stations
    .map(station => ({
      station,
      distance: calculateDistance(
        userLoc.lat,
        userLoc.lng,
        station.station.tele_station_lat,
        station.station.tele_station_long
      )
    }))
    .filter(item => item.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance) // Closest first
    .slice(0, 5); // Limit to top 5 closest to avoid token limits
};

export const getSituationColor = (level: number): string => {
    // Based on API scale: 1=Gold/CriticalLow, 2=Yellow/Low, 3=Green/Normal, 4=Blue/High, 5=Red/Flood
    switch (level) {
        case 1: return '#B45309'; // Amber-700 (Dry)
        case 2: return '#EAB308'; // Yellow-500 (Low)
        case 3: return '#22C55E'; // Green-500 (Normal)
        case 4: return '#3B82F6'; // Blue-500 (High)
        case 5: return '#EF4444'; // Red-500 (Overflow)
        default: return '#94A3B8'; // Slate-400 (Unknown)
    }
};

export const getSituationText = (level: number): string => {
    switch (level) {
        case 1: return 'น้ำน้อยวิกฤติ';
        case 2: return 'น้ำน้อย';
        case 3: return 'ปกติ';
        case 4: return 'น้ำมาก';
        case 5: return 'ล้นตลิ่ง/วิกฤติ';
        default: return 'ไม่ระบุ';
    }
};

export const getRainSeverityColor = (rain24h: number): string => {
  if (rain24h >= 90) return '#EF4444'; // Very Heavy (Red)
  if (rain24h >= 35) return '#F97316'; // Heavy (Orange)
  if (rain24h >= 10) return '#3B82F6'; // Moderate (Blue)
  return '#60A5FA'; // Light/None (Light Blue)
};