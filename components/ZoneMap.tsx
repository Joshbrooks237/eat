"use client";

import { useEffect, useState } from "react";
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

export default function ZoneMap({ zoneStats, events }: Props) {
  const [Map, setMap] = useState<React.ComponentType<Props> | null>(null);

  useEffect(() => {
    // Dynamically import Leaflet only on client
    import("./ZoneMapInner").then((mod) => {
      setMap(() => mod.default);
    });
  }, []);

  if (!Map) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center h-64">
        <span className="text-zinc-600 font-mono text-sm animate-pulse">LOADING MAP...</span>
      </div>
    );
  }

  return <Map zoneStats={zoneStats} events={events} />;
}
