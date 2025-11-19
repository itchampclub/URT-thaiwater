import { WaterLevelData, RainData } from '../types';

// This service has been disabled.
export const analyzeFloodRisk = async (
  waterStation: WaterLevelData,
  waterDistance: number,
  nearbyRainStations: Array<{ station: RainData, distance: number }>
): Promise<string> => {
  return "AI Service Disabled";
};