import React from 'react';
import { WaterLevelData, RainData } from '../types';
import { getSituationColor, getSituationText, getRainSeverityColor } from '../utils/geoUtils';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface StationWithDistance<T> {
    station: T;
    distance: number;
}

interface RiskAnalysisCardProps {
  nearestWater: StationWithDistance<WaterLevelData> | null;
  worstWater: StationWithDistance<WaterLevelData> | null;
  nearestRain: StationWithDistance<RainData> | null;
  worstRain: StationWithDistance<RainData> | null;
  radius: number;
}

const RiskAnalysisCard: React.FC<RiskAnalysisCardProps> = ({ 
  nearestWater, 
  worstWater,
  nearestRain,
  worstRain,
  radius
}) => {
  
  if (!nearestWater) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
        <p className="text-slate-500 text-center">ไม่พบสถานีตรวจวัดในรัศมี {radius} กม.</p>
        <p className="text-xs text-slate-400 text-center mt-2">ลองปรับรัศมีให้กว้างขึ้นหรือลากหมุดไปยังพื้นที่อื่น</p>
      </div>
    );
  }

  // --- Determine Overall Risk Level based on WORST case ---
  const criticalWaterLevel = worstWater?.station.situation_level || 0;
  const heavyRainAmount = worstRain?.station.rain_24h || 0;
  
  const isFloodRisk = criticalWaterLevel >= 4; // Level 4=High, 5=Flood
  const isRainRisk = heavyRainAmount >= 35; // 35mm = Heavy

  let riskTitle = "ความเสี่ยงต่ำ";
  let riskDesc = "สถานการณ์น้ำในพื้นที่โดยรวมปกติ";
  let bgClass = "bg-green-50 border-green-200";
  let textClass = "text-green-800";

  if (criticalWaterLevel === 5) {
    riskTitle = "ความเสี่ยงสูง (วิกฤติ)";
    riskDesc = `พบจุดแจ้งเตือนน้ำล้นตลิ่งในรัศมี ${radius} กม. โปรดตรวจสอบตำแหน่ง`;
    bgClass = "bg-red-50 border-red-200";
    textClass = "text-red-800";
  } else if (criticalWaterLevel === 4) {
    riskTitle = "เฝ้าระวัง (น้ำมาก)";
    riskDesc = `พบปริมาณน้ำระดับสูงในพื้นที่ใกล้เคียง`;
    bgClass = "bg-blue-50 border-blue-200";
    textClass = "text-blue-800";
  } else if (heavyRainAmount >= 90) {
    riskTitle = "ระวังน้ำป่าไหลหลาก";
    riskDesc = `ฝนตกหนักมาก (${heavyRainAmount} มม.) อาจเกิดน้ำป่าไหลหลากได้`;
    bgClass = "bg-orange-50 border-orange-200";
    textClass = "text-orange-800";
  } else if (isRainRisk) {
    riskTitle = "ระวังฝนตกหนัก";
    riskDesc = `มีฝนตกหนักในพื้นที่ ปริมาณ ${heavyRainAmount} มม.`;
    bgClass = "bg-blue-50 border-blue-200";
    textClass = "text-blue-800";
  }

  // Check if we need to show a specific warning for "Worst Case" station distinct from "Nearest"
  const showWaterWarning = worstWater && nearestWater && worstWater.station.id !== nearestWater.station.id && worstWater.station.situation_level > nearestWater.station.situation_level && worstWater.station.situation_level >= 4;
  const showRainWarning = worstRain && nearestRain && worstRain.station.id !== nearestRain.station.id && worstRain.station.rain_24h > 35 && worstRain.station.rain_24h > nearestRain.station.rain_24h;

  return (
    <div className="space-y-4">
      <div className={`rounded-xl shadow-lg p-5 border ${bgClass} transition-all duration-500`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className={`text-xl font-bold ${textClass} mb-1`}>{riskTitle}</h2>
            <p className="text-sm text-slate-600 leading-tight">{riskDesc}</p>
          </div>
        </div>

        {/* --- Warning Section (If Worst != Nearest) --- */}
        {(showWaterWarning || showRainWarning) && (
            <div className="mb-4 p-3 bg-white/60 rounded-lg border border-red-100/50">
                <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase mb-2">
                    <ExclamationTriangleIcon className="w-4 h-4" /> พบจุดเสี่ยงในรัศมี
                </div>
                {showWaterWarning && worstWater && (
                    <div className="text-xs text-slate-700 mb-1">
                        <span className="font-semibold text-red-600">น้ำสูง: </span>
                        {worstWater.station.station.tele_station_name.th} (ห่าง {worstWater.distance.toFixed(1)} กม.)
                        <span className="ml-1 px-1 rounded bg-red-100 text-red-700 font-bold">{getSituationText(worstWater.station.situation_level)}</span>
                    </div>
                )}
                {showRainWarning && worstRain && (
                    <div className="text-xs text-slate-700">
                        <span className="font-semibold text-orange-600">ฝนหนัก: </span>
                        {worstRain.station.station.tele_station_name.th} (ห่าง {worstRain.distance.toFixed(1)} กม.)
                        <span className="ml-1 font-bold">{worstRain.station.rain_24h} มม.</span>
                    </div>
                )}
            </div>
        )}

        {/* --- Nearest Water Station Card --- */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100 mb-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded-bl-lg font-bold">
             ใกล้สุด ({nearestWater.distance.toFixed(1)} กม.)
          </div>
          <div className="flex items-center justify-between mb-2 mt-1">
            <span className="text-xs uppercase tracking-wide text-slate-400 font-semibold">สถานีน้ำอ้างอิง</span>
          </div>
          <h3 className="font-semibold text-slate-800 text-lg mb-2 truncate pr-12">{nearestWater.station.station.tele_station_name.th}</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">สถานะ</p>
              <p className="text-lg font-bold" style={{ color: getSituationColor(nearestWater.station.situation_level) }}>
                {getSituationText(nearestWater.station.situation_level)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">ระดับน้ำ (รทก.)</p>
              <p className="text-lg font-bold text-slate-700">
                {nearestWater.station.waterlevel_msl} <span className="text-sm font-normal text-slate-500">ม.</span>
              </p>
            </div>
          </div>
          
          {nearestWater.station.storage_percent && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>ความจุลำน้ำ</span>
                <span>{nearestWater.station.storage_percent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="h-2.5 rounded-full transition-all duration-1000" 
                  style={{ 
                    width: `${Math.min(parseFloat(nearestWater.station.storage_percent), 100)}%`,
                    backgroundColor: getSituationColor(nearestWater.station.situation_level)
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* --- Rain Station Info (Hybrid: Nearest or Worst) --- */}
        {nearestRain && (
          <div className="bg-blue-50/50 rounded-lg p-4 shadow-sm border border-blue-100">
             <div className="flex items-center justify-between mb-1">
               <span className="text-xs uppercase tracking-wide text-blue-400 font-semibold">ปริมาณฝน (24ชม.)</span>
               <span className="text-xs text-blue-400 font-semibold">
                 {nearestRain.distance.toFixed(1)} กม.
               </span>
             </div>
             <div className="flex items-center justify-between">
                <div className="truncate text-sm font-medium text-slate-700 mr-2">{nearestRain.station.station.tele_station_name.th}</div>
                <div className="flex items-baseline gap-1">
                   <span className="text-xl font-bold" style={{ color: getRainSeverityColor(nearestRain.station.rain_24h) }}>{nearestRain.station.rain_24h}</span>
                   <span className="text-xs text-slate-500">มม.</span>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RiskAnalysisCard;