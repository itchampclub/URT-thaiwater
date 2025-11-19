import React from 'react';
import { WaterLevelData, RainData } from '../types';
import { getSituationColor, getSituationText, getRainSeverityColor } from '../utils/geoUtils';
import { SparklesIcon } from '@heroicons/react/24/solid';
import Markdown from 'react-markdown';

interface RiskAnalysisCardProps {
  nearestStation: { station: WaterLevelData | null; distance: number };
  nearestRainStation: { station: RainData | null; distance: number };
  onAnalyze: () => void;
  isAnalyzing: boolean;
  analysisResult: string | null;
}

const RiskAnalysisCard: React.FC<RiskAnalysisCardProps> = ({ 
  nearestStation, 
  nearestRainStation,
  onAnalyze, 
  isAnalyzing, 
  analysisResult 
}) => {
  const { station, distance } = nearestStation;
  const rainStation = nearestRainStation.station;
  const rainDistance = nearestRainStation.distance;

  if (!station) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
        <p className="text-slate-500 text-center">กำลังโหลดข้อมูล หรือ ไม่พบข้อมูลสถานีในบริเวณใกล้เคียง...</p>
      </div>
    );
  }

  const isCritical = station.situation_level >= 5;
  const isHigh = station.situation_level === 4;
  
  let riskTitle = "ความเสี่ยงต่ำ";
  let riskDesc = "ระดับน้ำในพื้นที่ใกล้เคียงอยู่ในเกณฑ์ปกติ";
  let bgClass = "bg-green-50 border-green-200";
  let textClass = "text-green-800";

  if (isCritical) {
    riskTitle = "ความเสี่ยงสูง (น้ำล้นตลิ่ง)";
    riskDesc = `สถานีวัดน้ำที่ใกล้ที่สุด (${distance.toFixed(1)} กม.) แจ้งเตือนภาวะน้ำล้นตลิ่ง โปรดเฝ้าระวัง`;
    bgClass = "bg-red-50 border-red-200";
    textClass = "text-red-800";
  } else if (isHigh) {
    riskTitle = "เฝ้าระวัง (น้ำมาก)";
    riskDesc = `ระดับน้ำค่อนข้างสูงในระยะ ${distance.toFixed(1)} กม. ควรติดตามสถานการณ์`;
    bgClass = "bg-blue-50 border-blue-200";
    textClass = "text-blue-800";
  } else if (distance > 20) {
    riskTitle = "ข้อมูลไม่เพียงพอ";
    riskDesc = `สถานีวัดน้ำที่ใกล้ที่สุดอยู่ห่างออกไป ${distance.toFixed(1)} กม. อาจไม่สะท้อนสถานการณ์จริง`;
    bgClass = "bg-slate-50 border-slate-200";
    textClass = "text-slate-800";
  }

  // Rain Severity Check
  if (rainStation && rainStation.rain_24h > 90 && !isCritical) {
    riskTitle = "ความเสี่ยงสูง (ฝนตกหนักมาก)";
    riskDesc = `ตรวจพบฝนตกหนักมาก ${rainStation.rain_24h} มม. ในระยะ ${rainDistance.toFixed(1)} กม. ระวังน้ำป่าไหลหลาก`;
    bgClass = "bg-orange-50 border-orange-200";
    textClass = "text-orange-800";
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-xl shadow-lg p-6 border ${bgClass} transition-all duration-500`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className={`text-xl font-bold ${textClass} mb-1`}>{riskTitle}</h2>
            <p className="text-sm text-slate-600">{riskDesc}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${isCritical ? 'bg-red-200 text-red-800' : 'bg-white/50 text-slate-600'}`}>
            ห่าง {distance.toFixed(1)} กม.
          </div>
        </div>

        {/* Water Station Card */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wide text-slate-400 font-semibold">สถานีน้ำอ้างอิง</span>
          </div>
          <h3 className="font-semibold text-slate-800 text-lg mb-2 truncate">{station.station.tele_station_name.th}</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">สถานะปัจจุบัน</p>
              <p className="text-lg font-bold" style={{ color: getSituationColor(station.situation_level) }}>
                {getSituationText(station.situation_level)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">ระดับน้ำ (รทก.)</p>
              <p className="text-lg font-bold text-slate-700">
                {station.waterlevel_msl} <span className="text-sm font-normal text-slate-500">ม.</span>
              </p>
            </div>
          </div>
          
          {station.storage_percent && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>ความจุลำน้ำ</span>
                <span>{station.storage_percent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="h-2.5 rounded-full transition-all duration-1000" 
                  style={{ 
                    width: `${Math.min(parseFloat(station.storage_percent), 100)}%`,
                    backgroundColor: getSituationColor(station.situation_level)
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Rain Station Card */}
        {rainStation && (
          <div className="bg-blue-50/50 rounded-lg p-4 shadow-sm border border-blue-100">
             <div className="flex items-center justify-between mb-1">
               <span className="text-xs uppercase tracking-wide text-blue-400 font-semibold">สถานีฝนใกล้เคียง</span>
               <span className="text-xs text-blue-400 font-semibold">{rainDistance.toFixed(1)} กม.</span>
             </div>
             <div className="flex items-center justify-between">
                <div className="truncate text-sm font-medium text-slate-700 mr-2">{rainStation.station.tele_station_name.th}</div>
                <div className="flex items-baseline gap-1">
                   <span className="text-xl font-bold" style={{ color: getRainSeverityColor(rainStation.rain_24h) }}>{rainStation.rain_24h}</span>
                   <span className="text-xs text-slate-500">มม. (24ชม.)</span>
                </div>
             </div>
          </div>
        )}

      </div>

      {/* AI Analysis Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-1 shadow-sm border border-indigo-100">
        {!analysisResult ? (
           <button 
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="w-full group relative flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-indigo-50 rounded-lg text-indigo-700 font-semibold transition-all duration-200 disabled:opacity-70"
           >
             {isAnalyzing ? (
               <>
                 <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                 <span>กำลังวิเคราะห์ข้อมูล...</span>
               </>
             ) : (
               <>
                 <SparklesIcon className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600 group-hover:scale-110 transition-transform" />
                 <span>ขอคำแนะนำจาก AI</span>
               </>
             )}
           </button>
        ) : (
          <div className="bg-white rounded-lg p-4 text-slate-700 text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="flex items-center gap-2 mb-3 pb-2 border-b border-indigo-100">
                <div className="p-1.5 bg-indigo-100 rounded-md">
                  <SparklesIcon className="w-4 h-4 text-indigo-600" />
                </div>
                <h4 className="font-bold text-indigo-900">AI Analysis</h4>
             </div>
             <div className="prose prose-sm prose-indigo max-w-none">
               <Markdown>{analysisResult}</Markdown>
             </div>
             <button 
               onClick={onAnalyze} 
               disabled={isAnalyzing}
               className="mt-4 text-xs text-indigo-500 hover:text-indigo-700 font-medium underline decoration-indigo-200 hover:decoration-indigo-500 transition-all"
             >
               {isAnalyzing ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ใหม่'}
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskAnalysisCard;