"use client";

import { useState } from "react";
import type { LocalEvent } from "@/app/api/events/route";

// Zone positions mapped onto a ~400×320 SVG canvas
// Roughly geographic: Camarillo far left, Simi Valley far right, Moorpark top
const ZONES = [
  { name: "Moorpark",         x: 160, y: 60,  lat: 34.2856, lng: -118.8820 },
  { name: "Simi Valley",      x: 310, y: 80,  lat: 34.2694, lng: -118.7815 },
  { name: "Camarillo",        x: 40,  y: 160, lat: 34.2164, lng: -119.0376 },
  { name: "Thousand Oaks",    x: 210, y: 190, lat: 34.1706, lng: -118.8376 },
  { name: "Westlake Village", x: 295, y: 210, lat: 34.1453, lng: -118.8192 },
  { name: "Agoura Hills",     x: 355, y: 195, lat: 34.1531, lng: -118.7617 },
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

function earningsColor(gross: number, max: number): string {
  if (max === 0 || gross === 0) return "#27272a"; // zinc-800
  const r = gross / max;
  if (r > 0.75) return "#22c55e"; // green-500
  if (r > 0.5)  return "#84cc16"; // lime-500
  if (r > 0.25) return "#eab308"; // yellow-500
  return "#f97316";               // orange-500
}

function glowColor(gross: number, max: number): string {
  if (max === 0 || gross === 0) return "none";
  const r = gross / max;
  if (r > 0.75) return "rgba(34,197,94,0.35)";
  if (r > 0.5)  return "rgba(132,204,22,0.30)";
  if (r > 0.25) return "rgba(234,179,8,0.30)";
  return "rgba(249,115,22,0.25)";
}

export default function ZoneMap({ zoneStats, events }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const statMap = Object.fromEntries(zoneStats.map((s) => [s.zone, s]));
  const maxGross = Math.max(...zoneStats.map((s) => s.total_gross), 1);

  const eventZones = new Set(events.map((e) => e.zone));

  return (
    <div className="bg-[#1f1f23] border border-zinc-700/50 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] tracking-widest text-zinc-500 font-mono uppercase">Zone Radar</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-600">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />High earner</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-700 inline-block" />No data</span>
          {events.length > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Event</span>}
        </div>
      </div>

      <div className="p-4">
        <svg
          viewBox="0 0 420 290"
          className="w-full max-h-72"
          style={{ fontFamily: "monospace" }}
        >
          {/* Grid lines — subtle radar feel */}
          {[60, 130, 200, 270].map((y) => (
            <line key={y} x1="0" y1={y} x2="420" y2={y} stroke="#27272a" strokeWidth="0.5" />
          ))}
          {[70, 140, 210, 280, 350].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="290" stroke="#27272a" strokeWidth="0.5" />
          ))}

          {/* Connector lines between adjacent zones */}
          {[
            ["Moorpark", "Thousand Oaks"],
            ["Moorpark", "Simi Valley"],
            ["Thousand Oaks", "Westlake Village"],
            ["Thousand Oaks", "Camarillo"],
            ["Westlake Village", "Agoura Hills"],
            ["Simi Valley", "Agoura Hills"],
          ].map(([a, b]) => {
            const za = ZONES.find((z) => z.name === a)!;
            const zb = ZONES.find((z) => z.name === b)!;
            return (
              <line
                key={`${a}-${b}`}
                x1={za.x} y1={za.y}
                x2={zb.x} y2={zb.y}
                stroke="#3f3f46"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
            );
          })}

          {/* Zone nodes */}
          {ZONES.map((zone) => {
            const stat = statMap[zone.name];
            const gross = stat?.total_gross ?? 0;
            const shifts = stat?.shift_count ?? 0;
            const color = earningsColor(gross, maxGross);
            const glow = glowColor(gross, maxGross);
            const hasEvent = eventZones.has(zone.name);
            const isHovered = hovered === zone.name;
            const r = gross > 0 ? 22 + (gross / maxGross) * 10 : 18;

            return (
              <g
                key={zone.name}
                onMouseEnter={() => setHovered(zone.name)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "default" }}
              >
                {/* Glow ring */}
                {glow !== "none" && (
                  <circle cx={zone.x} cy={zone.y} r={r + 8} fill={glow} />
                )}

                {/* Main circle */}
                <circle
                  cx={zone.x}
                  cy={zone.y}
                  r={r}
                  fill={color}
                  fillOpacity={isHovered ? 0.45 : 0.25}
                  stroke={color}
                  strokeWidth={isHovered ? 2 : 1.5}
                  strokeOpacity={0.8}
                />

                {/* Event badge */}
                {hasEvent && (
                  <circle cx={zone.x + r - 4} cy={zone.y - r + 4} r={5} fill="#f59e0b" />
                )}

                {/* Zone label */}
                <text
                  x={zone.x}
                  y={zone.y - 2}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="bold"
                  fill={color === "#27272a" ? "#52525b" : color}
                >
                  {zone.name.split(" ")[0].toUpperCase()}
                </text>

                {/* Earnings */}
                {gross > 0 && (
                  <text x={zone.x} y={zone.y + 9} textAnchor="middle" fontSize="8" fill="#a1a1aa">
                    ${gross.toFixed(0)}
                  </text>
                )}

                {/* Shift count */}
                {shifts > 0 && (
                  <text x={zone.x} y={zone.y + 18} textAnchor="middle" fontSize="7" fill="#52525b">
                    {shifts}x
                  </text>
                )}

                {/* Hover tooltip */}
                {isHovered && (
                  <g>
                    <rect
                      x={zone.x - 52}
                      y={zone.y - r - 46}
                      width={104}
                      height={40}
                      rx={4}
                      fill="#18181b"
                      stroke="#3f3f46"
                      strokeWidth={1}
                    />
                    <text x={zone.x} y={zone.y - r - 30} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#e4e4e7">
                      {zone.name}
                    </text>
                    <text x={zone.x} y={zone.y - r - 18} textAnchor="middle" fontSize="8" fill="#a1a1aa">
                      {gross > 0 ? `$${gross.toFixed(2)} · ${shifts} shift${shifts !== 1 ? "s" : ""}` : "No data yet"}
                    </text>
                    {hasEvent && (
                      <text x={zone.x} y={zone.y - r - 8} textAnchor="middle" fontSize="8" fill="#fbbf24">
                        ⚡ Event today
                      </text>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* Compass / label */}
          <text x="8" y="280" fontSize="8" fill="#3f3f46">W</text>
          <text x="408" y="280" fontSize="8" fill="#3f3f46">E</text>
          <text x="8" y="14" fontSize="8" fill="#3f3f46">N</text>
        </svg>
      </div>
    </div>
  );
}
