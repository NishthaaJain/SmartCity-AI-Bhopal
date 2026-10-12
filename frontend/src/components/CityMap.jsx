import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon } from 'react-leaflet';
import { MapPin, AlertCircle } from 'lucide-react';

// Bhopal approximate coordinates for the zones
const CITY_ZONES = [
  {
    name: 'MP Nagar',
    center: [23.2325, 77.4330],
    bounds: [
      [23.2425, 77.4230],
      [23.2425, 77.4430],
      [23.2225, 77.4430],
      [23.2225, 77.4230]
    ],
    color: '#3b82f6', // blue
  },
  {
    name: 'Bairagarh',
    center: [23.2721, 77.3620],
    bounds: [
      [23.2821, 77.3520],
      [23.2821, 77.3720],
      [23.2621, 77.3720],
      [23.2621, 77.3520]
    ],
    color: '#10b981', // green
  },
  {
    name: 'Govindpura',
    center: [23.2612, 77.4560],
    bounds: [
      [23.2712, 77.4460],
      [23.2712, 77.4660],
      [23.2512, 77.4660],
      [23.2512, 77.4460]
    ],
    color: '#ef4444', // red
  },
  {
    name: 'Kolar Road',
    center: [23.1873, 77.4080],
    bounds: [
      [23.1973, 77.3980],
      [23.1973, 77.4180],
      [23.1773, 77.4180],
      [23.1773, 77.3980]
    ],
    color: '#8b5cf6', // purple
  },
  {
    name: 'Old City',
    center: [23.2599, 77.4000],
    bounds: [
      [23.2699, 77.3900],
      [23.2699, 77.4100],
      [23.2499, 77.4100],
      [23.2499, 77.3900]
    ],
    color: '#f59e0b', // amber
  }
];

const CityMap = ({ complaintsList = [] }) => {
  const [selectedZone, setSelectedZone] = useState(CITY_ZONES[0]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>Interactive City Zones</span>
          </h3>
          <p className="text-xs text-slate-500">Select any zone boundary to inspect civic issues.</p>
        </div>

        {/* Zone Selector Pills */}
        <div className="flex flex-wrap gap-2">
          {CITY_ZONES.map((zone) => (
            <button
              key={zone.name}
              onClick={() => setSelectedZone(zone)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedZone.name === zone.name
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {zone.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="h-[420px] rounded-xl overflow-hidden border border-slate-200 relative z-0">
        <MapContainer
          center={[23.2599, 77.4126]}
          zoom={12}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Render City Zone Polygons */}
          {CITY_ZONES.map((zone) => (
            <Polygon
              key={zone.name}
              positions={zone.bounds}
              pathOptions={{
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: selectedZone.name === zone.name ? 0.35 : 0.15,
                weight: selectedZone.name === zone.name ? 3 : 1
              }}
              eventHandlers={{
                click: () => setSelectedZone(zone)
              }}
            >
              <Popup className="custom-popup">
                <div className="p-1 text-slate-900">
                  <h4 className="font-bold text-sm">{zone.name} Zone</h4>
                </div>
              </Popup>
            </Polygon>
          ))}

          {/* Render Complaint Markers */}
          {complaintsList.map((comp) => {
            // Pick circle color by complaint priority
            const color = comp.priority === 'High' ? '#ef4444' : comp.priority === 'Medium' ? '#f59e0b' : '#3b82f6';
            // Map zone name to lat/lng with minor jitter for display
            const zoneObj = CITY_ZONES.find(z => z.name === comp.zone) || CITY_ZONES[4]; // Default to Old City
            const latJitter = (Math.random() - 0.5) * 0.015;
            const lngJitter = (Math.random() - 0.5) * 0.015;

            return (
               <CircleMarker
                 key={comp.id}
                 center={[zoneObj.center[0] + latJitter, zoneObj.center[1] + lngJitter]}
                 radius={7}
                 pathOptions={{
                   color: color,
                   fillColor: color,
                   fillOpacity: 0.9
                 }}
               >
                 <Popup>
                   <div className="p-1 text-slate-900">
                     <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase text-white ${
                       comp.priority === 'High' ? 'bg-red-600' : comp.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                     }`}>
                       {comp.priority} Priority
                     </span>
                     <h5 className="font-bold text-sm mt-1">{comp.title}</h5>
                     <p className="text-xs text-slate-600 font-medium">{comp.category} • {comp.zone || 'Unknown Zone'}</p>
                     <p className="text-xs mt-1 text-slate-800">{comp.description}</p>
                   </div>
                 </Popup>
               </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Selected Zone Banner */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 block font-medium">Selected Zone</span>
          <span className="text-base font-bold text-blue-600">{selectedZone.name}</span>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-slate-400" />
          <div>
            <span className="text-xs text-slate-500 block">Status</span>
            <span className="text-base font-bold text-slate-900">Monitoring Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityMap;
