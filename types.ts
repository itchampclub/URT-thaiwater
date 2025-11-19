export interface Agency {
    id: number;
    agency_name: {
      th: string;
      en: string;
    };
    agency_shortname: {
      th: string;
      en: string;
    };
  }
  
  export interface Station {
    id: number;
    tele_station_name: {
      th: string;
      en?: string;
    };
    tele_station_lat: number;
    tele_station_long: number;
    tele_station_type: string;
    left_bank?: number;
    right_bank?: number;
    min_bank?: number;
    ground_level?: number;
  }
  
  export interface Geocode {
    area_code: string;
    province_code: string;
    province_name: {
      th: string;
      en: string;
    };
    amphoe_name: {
      th: string;
      en: string;
    };
    tumbon_name: {
        th: string;
        en: string;
    };
  }
  
  export interface WaterLevelData {
    id: number;
    waterlevel_datetime: string;
    waterlevel_msl: string; // Meter above sea level
    storage_percent: string | null;
    situation_level: number; // 1-5 (Scale)
    station: Station;
    geocode: Geocode;
    agency: Agency;
    diff_wl_bank?: string;
    diff_wl_bank_text?: string;
  }

  export interface RainData {
    id: number;
    rain_24h: number;
    rainfall_datetime: string;
    station: Station;
    geocode: Geocode;
    agency: Agency;
  }
  
  export interface ApiResponse {
    waterlevel_data: {
      result: string;
      data: WaterLevelData[];
    };
  }

  export interface RainApiResponse {
    result: string;
    data: RainData[];
  }
  
  export interface GeoLocation {
    lat: number;
    lng: number;
  }
  
  export enum RiskLevel {
    NORMAL = 'NORMAL',
    WATCH = 'WATCH',
    CRITICAL = 'CRITICAL',
    UNKNOWN = 'UNKNOWN'
  }