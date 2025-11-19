import { ApiResponse, RainApiResponse, WaterLevelData, RainData } from '../types';

const WATER_API_URL = 'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load';
const RAIN_API_URL = 'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/rain_24h';

export const fetchWaterData = async (): Promise<WaterLevelData[]> => {
  try {
    const response = await fetch(WATER_API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch water data');
    }
    const json: ApiResponse = await response.json();
    
    // Filter for Surat Thani
    const suratThaniData = json.waterlevel_data.data.filter(item => 
      item.geocode.province_name.th.includes('สุราษฎร์ธานี') &&
      item.station.tele_station_lat && 
      item.station.tele_station_long // Ensure coordinates exist
    );

    return suratThaniData;
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

    // Filter for Surat Thani
    const suratThaniRain = json.data.filter(item => 
      item.geocode.province_name.th.includes('สุราษฎร์ธานี') &&
      item.station.tele_station_lat &&
      item.station.tele_station_long
    );

    return suratThaniRain;
  } catch (error) {
    console.error("Error fetching rain data:", error);
    return [];
  }
};