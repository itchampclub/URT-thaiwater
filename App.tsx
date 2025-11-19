import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { MapPinIcon, ArrowPathIcon, ExclamationTriangleIcon, EyeIcon, EyeSlashIcon, ListBulletIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import MapComponent from './components/MapComponent';
import RiskAnalysisCard from './components/RiskAnalysisCard';
import { fetchWaterData, fetchRainData } from './services/waterService';
import { findNearestStation, findNearestRainStation } from './utils/geoUtils';
import { WaterLevelData, RainData, GeoLocation } from './types';

const DEFAULT_SURAT_THANI_LOC: GeoLocation = { lat: 9.1380, lng: 99.3208 }; // City center

const App: React.FC = () => {
  const [stations, setStations] = useState<WaterLevelData[]>([]);
  const [rainStations, setRainStations] = useState<RainData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // User location state (defaults to Surat Thani city center)
  const [userLocation, setUserLocation] = useState<GeoLocation>(DEFAULT_SURAT_THANI_LOC);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Layer Visibility State
  const [showWater, setShowWater] = useState<boolean>(true);
  const [showRain, setShowRain] = useState<boolean>(true);
  
  // Menu State
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [waterData, rainData] = await Promise.all([
        fetchWaterData(),
        fetchRainData()
      ]);
      setStations(waterData);
      setRainStations(rainData);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Error loading data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate Nearest Stations
  const nearestStation = useMemo(() => 
    findNearestStation(userLocation, stations), 
  [userLocation, stations]);

  const nearestRainStation = useMemo(() => 
    findNearestRainStation(userLocation, rainStations),
  [userLocation, rainStations]);

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

  // Reset analysis if user moves pin manually
  const handleUserLocationChange = (loc: GeoLocation) => {
    setUserLocation(loc);
  };

  useEffect(() => {
    loadData();
    // Try to locate on mount
    handleLocateMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Count critical stations
  const criticalCount = stations.filter(s => s.situation_level >= 5).length;
  const warningCount = stations.filter(s => s.situation_level === 4).length;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm z-20 flex-none">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-blue-200 shadow-lg">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z" clipRule="evenodd" />
                  <path d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" />
               </svg>
             </div>
             <div>
               <h1 className="text-lg font-bold text-slate-800 leading-tight">Surat Water Watch</h1>
               <p className="text-xs text-slate-500">ระบบติดตามสถานการณ์น้ำสุราษฎร์ธานี</p>
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

      {/* Main Content Area - Responsive Grid */}
      <main className="flex-1 relative overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Panel: Map (Takes priority on mobile) */}
        <div className="relative w-full h-[55vh] lg:h-full lg:w-2/3 bg-slate-200">
           <MapComponent 
             stations={stations}
             rainStations={rainStations} 
             userLocation={userLocation}
             onUserLocationChange={handleUserLocationChange}
             nearestStation={nearestStation}
             nearestRainStation={nearestRainStation}
             showWaterStations={showWater}
             showRainStations={showRain}
           />
           
           {/* Floating Locate Button (Bottom Right) - Kept for quick access */}
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

            {/* Controls & Legend Overlay (Top Right) */}
           <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end">
              
              {/* Toggle Button (Visible when closed) */}
              {!isMenuOpen && (
                <button 
                  onClick={() => setIsMenuOpen(true)}
                  className="bg-white/90 backdrop-blur-md p-2 rounded-lg shadow-md border border-slate-200 text-slate-700 hover:bg-white hover:text-blue-600 transition-all active:scale-95"
                >
                  <ListBulletIcon className="w-6 h-6" />
                </button>
              )}

              {/* Full Menu Panel */}
              {isMenuOpen && (
                <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-slate-200 text-xs space-y-2 min-w-[200px] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  
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

                  <div className="space-y-3">
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
                        
                        {/* New Navigate Button inside list */}
                        <button
                          onClick={handleLocateMe}
                          disabled={isLocating}
                          className="flex items-center gap-2 w-full text-left p-1.5 mt-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors group"
                        >
                           <div className="bg-white p-1 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                              <PaperAirplaneIcon className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                           </div>
                           <span className="font-semibold">ตำแหน่งปัจจุบัน</span>
                        </button>
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
                      <div className="mt-2 pt-2 border-t border-slate-200">
                          <div className="flex items-center gap-2">
                              <div className="relative w-3 h-3 flex-none">
                                <div className="absolute w-3 h-3 bg-blue-600 rounded-full animate-ping opacity-30"></div>
                                <div className="absolute w-3 h-3 bg-blue-600 rounded-full border border-white"></div>
                              </div>
                              ตำแหน่งคุณ
                          </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
           </div>
        </div>

        {/* Right Panel: Data & Analysis */}
        <div className="w-full h-[45vh] lg:h-full lg:w-1/3 flex flex-col bg-white border-l border-slate-200 shadow-xl z-10">
          <div className="p-4 lg:p-6 overflow-y-auto flex-1 space-y-6">
            
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                 <div className="text-red-600 font-bold text-2xl">{criticalCount}</div>
                 <div className="text-red-800 text-xs font-medium">จุดวิกฤติ (น้ำ)</div>
               </div>
               <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                 <div className="text-blue-600 font-bold text-2xl">{warningCount}</div>
                 <div className="text-blue-800 text-xs font-medium">เฝ้าระวัง (น้ำ)</div>
               </div>
            </div>

            {/* Analysis Card */}
            <div>
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">วิเคราะห์ความเสี่ยงพื้นที่คุณ</h3>
               <RiskAnalysisCard 
                  nearestStation={nearestStation} 
                  nearestRainStation={nearestRainStation}
               />
            </div>

            {/* Instructions */}
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 border border-slate-100">
               <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
                  <span>คำแนะนำ</span>
               </div>
               <ul className="list-disc pl-4 space-y-1 text-xs">
                 <li>ลากหมุดสีน้ำเงินบนแผนที่เพื่อตรวจสอบความเสี่ยงในพื้นที่อื่นๆ</li>
                 <li>ใช้เมนูมุมขวาบนของแผนที่เพื่อ เปิด/ปิด ชั้นข้อมูลและค้นหาตำแหน่งของคุณ</li>
                 <li>สีของไอคอนฝน (🌧️) แสดงปริมาณความรุนแรง (ฟ้า=เบา, ส้ม=หนัก, แดง=หนักมาก)</li>
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