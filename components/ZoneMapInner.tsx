"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LocalEvent } from "@/app/api/events/route";

const ZONES = [
  { name: "Thousand Oaks",    lat: 34.1706, lng: -118.8376 },
  { name: "Simi Valley",      lat: 34.2694, lng: -118.7815 },
  { name: "Moorpark",         lat: 34.2856, lng: -118.8820 },
  { name: "Westlake Village", lat: 34.1453, lng: -118.8192 },
  { name: "Camarillo",        lat: 34.2164, lng: -119.0376 },
  { name: "Agoura Hills",     lat: 34.1531, lng: -118.7617 },
];

interface ZoneStat {
  zone: string;
  total_gross: number;
  shift_count: number;
}

interface Props {
  zoneStats: ZoneStat[];
  events: LocalEvent[];
}

function zoneColor(gross: number, max: number): string {
  if (max === 0 || gross === 0) return "#3f3f46"; // zinc-700, no data
  const ratio = gross / max;
  if (ratio > 0.75) return "#22c55e"; // green-500
  if (ratio > 0.5)  return "#84cc16"; // lime-500
  if (ratio > 0.25) return "#eab308"; // yellow-500
  return "#f97316"; // orange-500
}

export default function ZoneMapInner({ zoneStats, events }: Props) {
  const statMap = Object.fromEntries(zoneStats.map((s) => [s.zone, s]));
  const maxGross = Math.max(...zoneStats.map((s) => s.total_gross), 1);

  // Group events by zone
  const eventsByZone: Record<string, LocalEvent[]> = {};
  for (const e of events) {
    if (!eventsByZone[e.zone]) eventsByZone[e.zone] = [];
    eventsByZone[e.zone].push(e);
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] tracking-widest text-zinc-500 font-mono uppercase">
            Zone Radar
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-600">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"/>High</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"/>Mid</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-600 inline-block"/>No data</span>
          {events.length > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>Event</span>}
        </div>
      </div>

      <MapContainer
        center={[34.2, -118.87]}
        zoom={11}
        style={{ height: "380px", width: "100%", background: "#09090b" }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution=""
        />

        {/* Zone circles */}
        {ZONES.map((zone) => {
          const stat = statMap[zone.name];
          const gross = stat?.total_gross ?? 0;
          const shifts = stat?.shift_count ?? 0;
          const color = zoneColor(gross, maxGross);
          const zoneEvents = eventsByZone[zone.name] ?? [];

          return (
            <CircleMarker
              key={zone.name}
              center={[zone.lat, zone.lng]}
              radius={gross > 0 ? 28 + (gross / maxGross) * 18 : 22}
              pathOptions={{
                fillColor: color,
                fillOpacity: 0.25,
                color: color,
                weight: 2,
                opacity: 0.8,
              }}
            >
              <Tooltip permanent direction="center" className="zone-label">
                <div style={{ fontFamily: "monospace", fontSize: "11px", textAlign: "center", background: "transparent", border: "none" }}>
                  <div style={{ color: color, fontWeight: "bold" }}>{zone.name.split(" ")[0]}</div>
                  {gross > 0 && <div style={{ color: "#a1a1aa" }}>${gross.toFixed(0)}</div>}
                  {shifts > 0 && <div style={{ color: "#71717a", fontSize: "10px" }}>{shifts}x</div>}
                  {zoneEvents.length > 0 && (
                    <div style={{ color: "#fbbf24", fontSize: "10px" }}>⚡ {zoneEvents.length} event{zoneEvents.length > 1 ? "s" : ""}</div>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Event markers */}
        {events.map((evt) => {
          const zone = ZONES.find((z) => z.name === evt.zone);
          if (!zone) return null;
          return (
            <CircleMarker
              key={evt.id}
              center={[zone.lat + 0.01, zone.lng + 0.01]}
              radius={6}
              pathOptions={{ fillColor: "#f59e0b", fillOpacity: 0.9, color: "#fbbf24", weight: 1 }}
            >
              <Tooltip direction="top">
                <div style={{ fontFamily: "monospace", fontSize: "11px" }}>
                  <div style={{ fontWeight: "bold", color: "#fbbf24" }}>⚡ {evt.name}</div>
                  <div style={{ color: "#a1a1aa" }}>{evt.venue}</div>
                  <div style={{ color: "#71717a" }}>{evt.time ? evt.time.slice(0, 5) : evt.date}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
