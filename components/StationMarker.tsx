import React from 'react';
import { CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { WaterLevelData } from '../types';
import { getSituationColor, getSituationText } from '../utils/geoUtils';

interface StationMarkerProps {
  data: WaterLevelData;
  isSelected: boolean;
  onClick: () => void;
}

const StationMarker: React.FC<StationMarkerProps> = ({ data, isSelected, onClick }) => {
  const color = getSituationColor(data.situation_level);
  
  return (
    <CircleMarker
      center={[data.station.tele_station_lat, data.station.tele_station_long]}
      pathOptions={{
        color: isSelected ? '#000000' : color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: isSelected ? 3 : 1,
      }}
      radius={isSelected ? 12 : 8}
      eventHandlers={{
        click: onClick,
      }}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={1}>
        <span className="font-medium font-sans">{data.station.tele_station_name.th}</span>
      </Tooltip>
      <Popup className="font-sans">
        <div className="p-1 min-w-[200px]">
          <h3 className="font-bold text-slate-800 mb-1 text-sm">{data.station.tele_station_name.th}</h3>
          <div className="grid grid-cols-2 gap-x-2 text-xs text-slate-600">
             <span>อำเภอ:</span>
             <span className="font-medium">{data.geocode.amphoe_name.th}</span>
             <span>สถานะ:</span>
             <span className="font-medium" style={{ color }}>{getSituationText(data.situation_level)}</span>
             <span>ระดับน้ำ:</span>
             <span className="font-medium">{data.waterlevel_msl} ม.รทก.</span>
             {data.storage_percent && (
               <>
                <span>ความจุ:</span>
                <span className="font-medium">{data.storage_percent}%</span>
               </>
             )}
          </div>
        </div>
      </Popup>
    </CircleMarker>
  );
};

export default StationMarker;