import { GoogleGenAI } from "@google/genai";
import { WaterLevelData, RainData } from '../types';
import { getSituationText } from '../utils/geoUtils';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFloodRisk = async (
  waterStation: WaterLevelData,
  waterDistance: number,
  nearbyRainStations: Array<{ station: RainData, distance: number }>
): Promise<string> => {
  try {
    let rainContext = "No rainfall data available nearby.";
    
    if (nearbyRainStations.length > 0) {
      const rainList = nearbyRainStations.map(item => 
        `- "${item.station.station.tele_station_name.th}" (${item.distance.toFixed(1)} km away): ${item.station.rain_24h} mm`
      ).join('\n');
      
      // Calculate max and average for summary
      const maxRain = Math.max(...nearbyRainStations.map(i => i.station.rain_24h));
      const avgRain = nearbyRainStations.reduce((acc, curr) => acc + curr.station.rain_24h, 0) / nearbyRainStations.length;

      rainContext = `
        Summary of Nearby Rainfall (within 50km):
        - Max Rainfall: ${maxRain} mm
        - Average Rainfall: ${avgRain.toFixed(1)} mm
        - Stations Report:
        ${rainList}
      `;
    }

    const prompt = `
      Act as a hydrological safety expert for Surat Thani, Thailand.
      
      Context:
      - User Location relative to Water Station: ${waterDistance.toFixed(2)} km from "${waterStation.station.tele_station_name.th}".
      - Water Situation: ${waterStation.situation_level} (${getSituationText(waterStation.situation_level)}).
      - Water Level: ${waterStation.waterlevel_msl} meters (MSL).
      - Bank Capacity: ${waterStation.storage_percent ? waterStation.storage_percent + '%' : 'Unknown'}.
      
      Rainfall Context (Surrounding Area):
      ${rainContext}

      Task:
      1. Analyze the combined flood risk considering the river water level AND the regional rainfall pattern.
      2. If there is heavy rain (>35mm) in multiple surrounding stations, increase the urgency of the warning (Flash Flood Risk).
      3. If the river is high AND surrounding rain is heavy, warn about imminent overflow.
      4. Provide concise, actionable safety advice in Thai language.
      5. Format the response with clear bullet points.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "ไม่สามารถวิเคราะห์ข้อมูลได้ในขณะนี้";
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบวิเคราะห์ความเสี่ยง (AI Service Error)";
  }
};