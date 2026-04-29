"use client";

import { Shift } from "@/lib/types";

interface ZoneStat {
  zone: string;
  total_gross: number;
  total_net: number;
  avg_tip_rate: number;
  shift_count: number;
}

export default function ZoneBars({ shifts }: { shifts: Shift[] }) {
  const zoneMap: Record<string, ZoneStat> = {};

  for (const s of shifts) {
    if (!zoneMap[s.zone]) {
      zoneMap[s.zone] = { zone: s.zone, total_gross: 0, total_net: 0, avg_tip_rate: 0, shift_count: 0 };
    }
    const z = zoneMap[s.zone];
    z.total_gross += Number(s.gross_earnings);
    z.total_net += Number(s.net_earnings);
    z.avg_tip_rate +=
      Number(s.gross_earnings) > 0
        ? (Number(s.tip_total) / Number(s.gross_earnings)) * 100
        : 0;
    z.shift_count += 1;
  }

  const zones = Object.values(zoneMap)
    .map((z) => ({ ...z, avg_tip_rate: z.avg_tip_rate / z.shift_count }))
    .sort((a, b) => b.total_gross - a.total_gross);

  const maxGross = Math.max(...zones.map((z) => z.total_gross), 1);

  if (zones.length === 0) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
        <h2 className="text-xs tracking-widest text-zinc-500 font-mono uppercase mb-4">Zone Performance</h2>
        <p className="text-zinc-700 font-mono text-sm">No shift data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
      <h2 className="text-xs tracking-widest text-zinc-500 font-mono uppercase mb-4">Zone Performance</h2>
      <div className="space-y-3">
        {zones.map((z) => (
          <div key={z.zone} className="group">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-mono text-zinc-300 group-hover:text-amber-400 transition-colors">
                {z.zone}
              </span>
              <div className="flex gap-4 text-xs font-mono">
                <span className="text-amber-400">${z.total_gross.toFixed(0)} gross</span>
                <span className="text-green-400">${z.total_net.toFixed(0)} net</span>
                <span className="text-zinc-500">{z.avg_tip_rate.toFixed(1)}% tips</span>
                <span className="text-zinc-600">{z.shift_count}x</span>
              </div>
            </div>
            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${(z.total_gross / maxGross) * 100}%` }}
              />
            </div>
            <div className="h-1 bg-zinc-900 rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full bg-gradient-to-r from-green-800 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(z.total_net / maxGross) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
