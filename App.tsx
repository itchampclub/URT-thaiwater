import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { MapPinIcon, ArrowPathIcon, ExclamationTriangleIcon, EyeIcon, EyeSlashIcon, ListBulletIcon, XMarkIcon, PaperAirplaneIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, MapIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/solid';
import MapComponent from './components/MapComponent';
import RiskAnalysisCard from './components/RiskAnalysisCard';
import { fetchWaterData, fetchRainData } from './services/waterService';
import { findNearestStation, findNearestRainStation, calculateDistance } from './utils/geoUtils';
import { WaterLevelData, RainData, GeoLocation } from './types';

// Configuration for 14 Southern Provinces
const SOUTHERN_PROVINCES = [
  { name: 'กระบี่', lat: 8.0863, lng: 98.9063 },
  { name: 'ชุมพร', lat: 10.4930, lng: 99.1800 },
  { name: 'ตรัง', lat: 7.5645, lng: 99.6239 },
  { name: 'นครศรีธรรมราช', lat: 8.4333, lng: 99.9667 },
  { name: 'นราธิวาส', lat: 6.4255, lng: 101.8253 },
  { name: 'ปัตตานี', lat: 6.8696, lng: 101.2501 },
  { name: 'พังงา', lat: 8.4501, lng: 98.5255 },
  { name: 'พัทลุง', lat: 7.6167, lng: 100.0833 },
  { name: 'ภูเก็ต', lat: 7.8804, lng: 98.3923 },
  { name: 'ยะลา', lat: 6.5400, lng: 101.2800 },
  { name: 'ระนอง', lat: 9.9529, lng: 98.6085 },
  { name: 'สงขลา', lat: 7.1756, lng: 100.6143 },
  { name: 'สตูล', lat: 6.6238, lng: 100.0674 },
  { name: 'สุราษฎร์ธานี', lat: 9.1380, lng: 99.3208 },
];

const DEFAULT_PROVINCE = SOUTHERN_PROVINCES.find(p => p.name === 'สุราษฎร์ธานี')!;
const ALL_PROVINCES_KEY = 'ALL';

type ViewMode = 'split' | 'map' | 'analysis';

const App: React.FC = () => {
  // Data State (Holds data for ALL southern provinces)
  const [allStations, setAllStations] = useState<WaterLevelData[]>([]);
  const [allRainStations, setAllRainStations] = useState<RainData[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // UI State
  const [selectedProvinceName, setSelectedProvinceName] = useState<string>(DEFAULT_PROVINCE.name);
  const [userLocation, setUserLocation] = useState<GeoLocation>({ lat: DEFAULT_PROVINCE.lat, lng: DEFAULT_PROVINCE.lng });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  
  // Settings State
  const [radius, setRadius] = useState<number>(10); // km

  // Layer Visibility State
  const [showWater, setShowWater] = useState<boolean>(true);
  const [showRain, setShowRain] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [waterData, rainData] = await Promise.all([
        fetchWaterData(),
        fetchRainData()
      ]);
      setAllStations(waterData);
      setAllRainStations(rainData);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Error loading data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter data based on selected province (for Display on Map - optional, currently Map uses this list)
  const displayedStations = useMemo(() => {
    if (selectedProvinceName === ALL_PROVINCES_KEY) return allStations;
    return allStations.filter(s => s.geocode.province_name.th.includes(selectedProvinceName));
  }, [allStations, selectedProvinceName]);

  const displayedRainStations = useMemo(() => {
    if (selectedProvinceName === ALL_PROVINCES_KEY) return allRainStations;
    return allRainStations.filter(s => s.geocode.province_name.th.includes(selectedProvinceName));
  }, [allRainStations, selectedProvinceName]);

  // --- Analysis Logic: Filter by Radius & Find Nearest/Worst ---
  const { nearestWater, worstWater, nearestRain, worstRain } = useMemo(() => {
    // 1. Calculate distance for ALL stations (globally) to ensure analysis covers the radius accurately
    // irrespective of the selected province filter (which is for visual decluttering).
    // STRICTLY FILTER by radius here.
    const waterInRadius = allStations.map(s => ({
      station: s,
      distance: calculateDistance(userLocation.lat, userLocation.lng, s.station.tele_station_lat, s.station.tele_station_long)
    })).filter(x => x.distance <= radius);

    const rainInRadius = allRainStations.map(s => ({
      station: s,
      distance: calculateDistance(userLocation.lat, userLocation.lng, s.station.tele_station_lat, s.station.tele_station_long)
    })).filter(x => x.distance <= radius);

    // 2. Find Nearest (Sort by distance ASC)
    waterInRadius.sort((a, b) => a.distance - b.distance);
    rainInRadius.sort((a, b) => a.distance - b.distance);

    const nearestWater = waterInRadius[0] || null;
    const nearestRain = rainInRadius[0] || null;

    // 3. Find Worst Water (Sort by Situation Level DESC, then Distance ASC)
    const sortedWaterRisk = [...waterInRadius].sort((a, b) => {
       if (b.station.situation_level !== a.station.situation_level) {
         return b.station.situation_level - a.station.situation_level;
       }
       return a.distance - b.distance;
    });
    const worstWater = sortedWaterRisk[0] || null;

    // 4. Find Worst Rain (Sort by Rain Amount DESC)
    const sortedRainRisk = [...rainInRadius].sort((a, b) => b.station.rain_24h - a.station.rain_24h);
    const worstRain = sortedRainRisk[0] || null;

    return { nearestWater, worstWater, nearestRain, worstRain };

  }, [allStations, allRainStations, userLocation, radius]);

  // Map Component Helper Objects
  const mapNearestStation = useMemo(() => ({
    station: nearestWater?.station || null,
    distance: nearestWater?.distance || 0
  }), [nearestWater]);

  const mapNearestRainStation = useMemo(() => ({
    station: nearestRain?.station || null,
    distance: nearestRain?.distance || 0
  }), [nearestRain]);

  const mapWorstStation = useMemo(() => ({
    station: worstWater?.station || null,
    distance: worstWater?.distance || 0
  }), [worstWater]);

  const mapWorstRainStation = useMemo(() => ({
    station: worstRain?.station || null,
    distance: worstRain?.distance || 0
  }), [worstRain]);


  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
      },
      (error) => {
        console.error(error);
        alert('Unable to retrieve your location. Please use the map pin manually.');
        setIsLocating(false);
      }
    );
  };

  const handleProvinceChange = (provinceName: string) => {
    setSelectedProvinceName(provinceName);
    
    if (provinceName === ALL_PROVINCES_KEY) {
      setUserLocation({ lat: 8.5, lng: 99.5 }); // Approx center of South
    } else {
      const province = SOUTHERN_PROVINCES.find(p => p.name === provinceName);
      if (province) {
        setUserLocation({ lat: province.lat, lng: province.lng });
      }
    }
  };

  const handleUserLocationChange = (loc: GeoLocation) => {
    setUserLocation(loc);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMapMaximize = () => {
    setViewMode(prev => prev === 'map' ? 'split' : 'map');
  };

  const toggleAnalysisMaximize = () => {
    setViewMode(prev => prev === 'analysis' ? 'split' : 'analysis');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm z-20 flex-none">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-blue-200 shadow-lg">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z" clipRule="evenodd" />
                  <path d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" />
               </svg>
             </div>
             <div>
               <h1 className="text-lg font-bold text-slate-800 leading-tight">Southern Water Watch</h1>
               <p className="text-xs text-slate-500">ระบบติดตามสถานการณ์น้ำภาคใต้</p>
             </div>
          </div>
          
          <button 
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Refresh Data"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Panel: Map */}
        <div className={`
          relative bg-slate-200 transition-all duration-300 ease-in-out
          ${viewMode === 'analysis' ? 'hidden' : ''}
          ${viewMode === 'map' ? 'w-full h-full' : 'w-full h-[55vh] lg:h-full lg:w-2/3'}
        `}>
           <MapComponent 
             stations={displayedStations}
             rainStations={displayedRainStations} 
             userLocation={userLocation}
             onUserLocationChange={handleUserLocationChange}
             nearestStation={mapNearestStation}
             nearestRainStation={mapNearestRainStation}
             worstStation={mapWorstStation}
             worstRainStation={mapWorstRainStation}
             showWaterStations={showWater}
             showRainStations={showRain}
             radius={radius}
           />
           
           {/* Floating Locate Button */}
           <button 
             onClick={handleLocateMe}
             disabled={isLocating}
             className="absolute bottom-6 right-6 z-[1000] bg-white text-slate-700 p-3 rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2"
           >
             {isLocating ? (
               <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
             ) : (
               <MapPinIcon className="w-6 h-6 text-blue-600" />
             )}
             <span className="hidden sm:inline font-medium text-sm">ตำแหน่งปัจจุบัน</span>
           </button>

            {/* Controls Overlay (Top Right) */}
           <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
              
              <div className="flex gap-2">
                 {/* Map Maximize Button */}
                 <button 
                   onClick={toggleMapMaximize}
                   className="bg-white/90 backdrop-blur-md p-2 rounded-lg shadow-md border border-slate-200 text-slate-700 hover:bg-white hover:text-blue-600 transition-all active:scale-95"
                   title={viewMode === 'map' ? "ย่อแผนที่" : "ขยายแผนที่เต็มจอ"}
                 >
                   {viewMode === 'map' ? (
                     <ArrowsPointingInIcon className="w-6 h-6" />
                   ) : (
                     <ArrowsPointingOutIcon className="w-6 h-6" />
                   )}
                 </button>

                 {/* Toggle Menu Button */}
                 {!isMenuOpen && (
                   <button 
                     onClick={() => setIsMenuOpen(true)}
                     className="bg-white/90 backdrop-blur-md p-2 rounded-lg shadow-md border border-slate-200 text-slate-700 hover:bg-white hover:text-blue-600 transition-all active:scale-95"
                   >
                     <ListBulletIcon className="w-6 h-6" />
                   </button>
                 )}
              </div>

              {/* Full Menu Panel */}
              {isMenuOpen && (
                <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-slate-200 text-xs space-y-2 min-w-[260px] animate-in fade-in zoom-in-95 duration-200 origin-top-right max-h-[80vh] overflow-y-auto">
                  
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <ListBulletIcon className="w-3 h-3" /> ตัวเลือกแผนที่
                    </span>
                    <button 
                      onClick={() => setIsMenuOpen(false)}
                      className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Province Selector */}
                    <div>
                      <div className="font-semibold text-slate-500 mb-2 text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <MapIcon className="w-3 h-3"/> เลือกจังหวัด
                      </div>
                      <select 
                        value={selectedProvinceName}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      >
                        <option value={ALL_PROVINCES_KEY}>ทั้งหมด (14 จังหวัด)</option>
                        {SOUTHERN_PROVINCES.map((p) => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Radius Slider */}
                    <div>
                      <div className="font-semibold text-slate-500 mb-2 text-[10px] uppercase tracking-wider flex items-center gap-1 justify-between">
                        <span className="flex items-center gap-1"><AdjustmentsHorizontalIcon className="w-3 h-3"/> รัศมีครอบคลุม</span>
                        <span className="text-blue-600 font-bold">{radius} กม.</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="50" 
                        step="1"
                        value={radius} 
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>10 กม.</span>
                        <span>50 กม.</span>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-500 mb-2 text-[10px] uppercase tracking-wider">แสดงชั้นข้อมูล</div>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none p-1 hover:bg-slate-50 rounded transition-colors">
                          <input 
                            type="checkbox" 
                            checked={showWater} 
                            onChange={(e) => setShowWater(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" 
                          />
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            {showWater ? <EyeIcon className="w-3 h-3 text-blue-500" /> : <EyeSlashIcon className="w-3 h-3 text-slate-400" />}
                            สถานีน้ำ
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none p-1 hover:bg-slate-50 rounded transition-colors">
                          <input 
                            type="checkbox" 
                            checked={showRain} 
                            onChange={(e) => setShowRain(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" 
                          />
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            {showRain ? <EyeIcon className="w-3 h-3 text-blue-500" /> : <EyeSlashIcon className="w-3 h-3 text-slate-400" />}
                            สถานีฝน
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <div className="font-semibold text-slate-500 mb-2 text-[10px] uppercase tracking-wider">สถานะน้ำ/ฝน</div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></div> ล้นตลิ่ง/วิกฤติ</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></div> น้ำมาก</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]"></div> ปกติ</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#60A5FA]"></div> ฝนตกเล็กน้อย</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></div> ฝนตกหนัก</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></div> ฝนตกหนักมาก</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
           </div>
        </div>

        {/* Right Panel: Data & Analysis */}
        <div className={`
          flex flex-col bg-white border-l border-slate-200 shadow-xl z-10 transition-all duration-300 ease-in-out
          ${viewMode === 'map' ? 'hidden' : ''}
          ${viewMode === 'analysis' ? 'w-full h-full' : 'w-full h-[45vh] lg:h-full lg:w-1/3'}
        `}>
          
          {/* Panel Header with Expand Button */}
          <div className="p-4 pb-0 flex justify-end">
             <button 
               onClick={toggleAnalysisMaximize}
               className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
               title={viewMode === 'analysis' ? "ย่อหน้าต่าง" : "ขยายเต็มจอ"}
             >
               {viewMode === 'analysis' ? (
                 <ArrowsPointingInIcon className="w-5 h-5" />
               ) : (
                 <ArrowsPointingOutIcon className="w-5 h-5" />
               )}
             </button>
          </div>

          <div className="p-4 lg:p-6 pt-2 overflow-y-auto flex-1 space-y-6">
            
            {/* Analysis Card */}
            <div>
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                 วิเคราะห์ความเสี่ยง (รัศมี {radius} กม.)
               </h3>
               <RiskAnalysisCard 
                  nearestWater={nearestWater}
                  worstWater={worstWater}
                  nearestRain={nearestRain}
                  worstRain={worstRain}
                  radius={radius}
               />
            </div>

            {/* Instructions */}
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 border border-slate-100">
               <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
                  <span>คำแนะนำ</span>
               </div>
               <ul className="list-disc pl-4 space-y-1 text-xs">
                 <li>ระบบจะวิเคราะห์ข้อมูลจากทั้ง <b>"จุดที่ใกล้ที่สุด"</b> และ <b>"จุดที่มีความเสี่ยงสูงสุด"</b></li>
                 <li>ข้อมูลการวิเคราะห์จะแสดงเฉพาะจุดที่อยู่ใน <b>รัศมี {radius} กม.</b> เท่านั้น</li>
                 <li>เลือก "จังหวัด" ที่เมนูมุมขวาบนเพื่อเปลี่ยนพื้นที่ดูข้อมูลหลัก</li>
                 <li>ลากหมุดสีน้ำเงินบนแผนที่เพื่อตรวจสอบความเสี่ยงในพื้นที่อื่นๆ</li>
                 <li>ข้อมูลอ้างอิงจาก: คลังข้อมูลน้ำแห่งชาติ (ThaiWater)</li>
               </ul>
            </div>

            {lastUpdated && (
              <div className="text-center text-xs text-slate-400 mt-4">
                อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString('th-TH')}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;