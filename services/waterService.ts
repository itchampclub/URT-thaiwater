import { ApiResponse, RainApiResponse, WaterLevelData, RainData } from '../types';

const WATER_API_URL = 'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load';
const RAIN_API_URL = 'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/rain_24h';

const SOUTHERN_PROVINCES = [
  'กระบี่', 'ชุมพร', 'ตรัง', 'นครศรีธรรมราช', 'นราธิวาส', 'ปัตตานี', 
  'พังงา', 'พัทลุง', 'ภูเก็ต', 'ยะลา', 'ระนอง', 'สงขลา', 'สตูล', 'สุราษฎร์ธานี'
];

const isSouthernProvince = (provinceName: string): boolean => {
  return SOUTHERN_PROVINCES.some(p => provinceName.includes(p));
};

export const fetchWaterData = async (): Promise<WaterLevelData[]> => {
  try {
    const response = await fetch(WATER_API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch water data');
    }
    const json: ApiResponse = await response.json();
    
    // Filter for All Southern Provinces
    const southernData = json.waterlevel_data.data.filter(item => 
      isSouthernProvince(item.geocode.province_name.th) &&
      item.station.tele_station_lat && 
      item.station.tele_station_long // Ensure coordinates exist
    );

    return southernData;
  } catch (error) {
    console.error("Error fetching water data:", error);
    return [];
  }
};

export const fetchRainData = async (): Promise<RainData[]> => {
  try {
    const response = await fetch(RAIN_API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch rain data');
    }
    const json: RainApiResponse = await response.json();

    // Filter for All Southern Provinces
    const southernRain = json.data.filter(item => 
      isSouthernProvince(item.geocode.province_name.th) &&
      item.station.tele_station_lat &&
      item.station.tele_station_long
    );

    return southernRain;
  } catch (error) {
    console.error("Error fetching rain data:", error);
    return [];
  }
};