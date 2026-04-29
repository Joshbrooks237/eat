"use client";

import dynamic from "next/dynamic";
import type { LocalEvent } from "@/app/api/events/route";

interface ZoneStat {
  zone: string;
  total_gross: number;
  shift_count: number;
}

interface Props {
  zoneStats: ZoneStat[];
  events: LocalEvent[];
}

const ZoneMapInner = dynamic(() => import("./ZoneMapInner"), {
  ssr: false,
  loading: () => (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center h-64">
      <span className="text-zinc-600 font-mono text-sm animate-pulse">LOADING MAP...</span>
    </div>
  ),
});

export default function ZoneMap({ zoneStats, events }: Props) {
  return <ZoneMapInner zoneStats={zoneStats} events={events} />;
}
