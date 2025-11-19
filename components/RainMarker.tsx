import React from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { RainData } from '../types';
import { getRainSeverityColor } from '../utils/geoUtils';

interface RainMarkerProps {
  data: RainData;
  position?: [number, number]; // Optional prop to override position (for offset)
}

const RainMarker: React.FC<RainMarkerProps> = ({ data, position }) => {
  const rainAmount = data.rain_24h;
  const severityColor = getRainSeverityColor(rainAmount);
  
  // Determine pale background color based on severity
  // We use the severity color for border/icon, and a matching light shade for background
  let backgroundColor = '#F0F9FF'; // Default Light Blue (Sky-50)
  if (rainAmount >= 90) backgroundColor = '#FEF2F2'; // Red-50
  else if (rainAmount >= 35) backgroundColor = '#FFF7ED'; // Orange-50
  else if (rainAmount >= 10) backgroundColor = '#EFF6FF'; // Blue-50

  // Create the icon HTML
  const icon = L.divIcon({
    className: 'custom-rain-icon',
    html: `
      <div style="
        background-color: ${backgroundColor}; 
        border: 1.5px solid ${severityColor}; 
        border-radius: 50%; 
        box-shadow: 0 1px 3px rgba(0,0,0,0.2); 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        width: 22px; 
        height: 22px;
        transition: transform 0.2s;
      ">
        <div style="font-size: 12px; filter: drop-shadow(0 1px 0px rgba(255,255,255,0.8)); line-height: 1;">🌧️</div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11]
  });

  // Use provided position or fallback to station coordinates
  const markerPosition: [number, number] = position || [
    data.station.tele_station_lat, 
    data.station.tele_station_long
  ];

  return (
    <Marker
      position={markerPosition}
      icon={icon}
    >
      <Tooltip direction="top" offset={[0, -11]} opacity={1}>
        <span className="font-bold font-sans" style={{ color: severityColor }}>
          ฝน: {rainAmount} มม.
        </span>
      </Tooltip>
      <Popup className="font-sans">
        <div className="p-1 min-w-[200px]">
          <h3 className="font-bold text-slate-800 mb-1 text-sm">{data.station.tele_station_name.th}</h3>
          <div className="text-xs text-slate-600">
             <div className="mb-1">อำเภอ: <span className="font-medium">{data.geocode.amphoe_name.th}</span></div>
             <div className="flex items-center justify-between p-2 rounded border" style={{ backgroundColor: backgroundColor, borderColor: `${severityColor}40` }}>
                <span>ปริมาณฝน 24 ชม.</span>
                <span className="font-bold text-lg" style={{ color: severityColor }}>
                  {rainAmount} <span className="text-xs text-slate-500 font-normal">มม.</span>
                </span>
             </div>
             <div className="mt-2 flex justify-between items-center text-[10px] text-slate-400">
                <span>{data.agency.agency_shortname.th}</span>
                <span>{data.rainfall_datetime}</span>
             </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default RainMarker;