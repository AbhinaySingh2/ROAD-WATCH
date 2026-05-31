"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from "react-leaflet";
import L from "leaflet";

const customIcon = typeof window !== "undefined" ? L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
}) : null;

const standardPath: [number, number][] = [[25.5950, 85.0300], [25.5980, 85.0350], [25.6005, 85.0400]];
const safetyPath: [number, number][] = [[25.5950, 85.0300], [25.5940, 85.0325], [25.5945, 85.0370], [25.6005, 85.0400]];

const sevColor = (s: string) => s === 'CRITICAL' ? 'bg-red-500/20 text-red-450' : s === 'HIGH' ? 'bg-orange-500/20 text-orange-450' : s === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-450' : 'bg-green-500/20 text-green-450';

export default function Map({ reports, onUpvote, isSafetyRoutingActive }: { reports: any[], onUpvote?: (id: number) => void, isSafetyRoutingActive?: boolean }) {
  const sorted = [...reports].sort((a, b) => (b.impact_score ?? 0) - (a.impact_score ?? 0));
  const heatReports = sorted.filter(r => r.damage_type === 'POTHOLE' || r.severity === 'CRITICAL' || r.severity === 'HIGH');
  const routeOpts = isSafetyRoutingActive
    ? { color: '#10b981', weight: 5, opacity: 0.85 }
    : { color: '#ef4444', weight: 4, opacity: 0.65, dashArray: "8 8" };

  return (
    <MapContainer center={[25.5980, 85.0350]} zoom={15} style={{ height: "calc(100vh - 120px)", minHeight: "500px", width: "100%", borderRadius: "0.75rem", zIndex: 0 }} zoomControl={false} >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
      
      {heatReports.map((r) => (
        <Circle key={`h-${r.id}`} center={[r.latitude, r.longitude]} radius={120} pathOptions={{ color: r.severity === 'CRITICAL' ? '#ef4444' : '#f97316', fillColor: r.severity === 'CRITICAL' ? '#ef4444' : '#f97316', fillOpacity: 0.2, weight: 1.5, dashArray: "4 4" }} />
      ))}

      <Polyline positions={isSafetyRoutingActive ? safetyPath : standardPath} pathOptions={routeOpts} />

      {sorted.map((report) => (
        <Marker key={report.id} position={[report.latitude, report.longitude]} icon={customIcon || undefined} >
          <Popup className="custom-popup">
            <div className="p-1.5 min-w-[210px] text-white text-left font-sans">
              <h3 className="font-extrabold mb-1.5 text-sm text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-300">#{report.id} {report.infra_type || "Incident"}</h3>
              {report.image_url && (
                <div className="w-full aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-white/5 mb-2.5 shadow-inner">
                  <img src={report.image_url.startsWith('http') ? report.image_url : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '')}/${report.image_url}`} alt="Hazard preview" className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <p className="text-[11px] text-neutral-400 mb-2.5 flex items-center gap-1.5">Severity: 
              <span className={`font-black px-2 py-0.5 rounded text-[10px] ${sevColor(report.severity)}`}>{report.severity || "Unknown"}</span>
              </p>
              
              <div className="text-[11px] bg-white/5 border border-white/5 p-2 rounded-xl mb-2 text-neutral-300"><strong className="text-neutral-400">Assigned:</strong> {report.assigned_authority || "Pending Assessment"}</div>
              {typeof report.impact_score === "number" && <div className="text-[11px] bg-orange-500/10 border border-orange-500/20 p-2 rounded-xl mb-2.5 text-orange-300"><strong className="text-orange-400">Impact Score:</strong> {report.impact_score}</div>}
              
              <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-white/10">
                <span className="text-[11px] text-neutral-400 font-semibold">👍 {report.upvotes || 0} Upvotes</span>
                {onUpvote && <button onClick={() => onUpvote(report.id)} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-full shadow-md cursor-pointer active:scale-95 transition-transform">Upvote</button>}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
