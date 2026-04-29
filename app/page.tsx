export const dynamic = "force-dynamic";

import { getPool } from "@/lib/db";
import { Shift } from "@/lib/types";
import MetricCards from "@/components/MetricCards";
import HeatMap from "@/components/HeatMap";
import ZoneBars from "@/components/ZoneBars";
import DispatchPanel from "@/components/DispatchPanel";
import EventsPanel from "@/components/EventsPanel";
import ZoneMap from "@/components/ZoneMap";
import ShiftTracker from "@/components/ShiftTracker";
import LiveDashboard from "@/components/LiveDashboard";
import Link from "next/link";
import type { LocalEvent } from "@/app/api/events/route";

async function getShifts(): Promise<Shift[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(`
      SELECT
        *,
        CASE WHEN hours > 0 THEN ROUND(gross_earnings / hours, 2) ELSE 0 END AS hourly_rate,
        CASE WHEN gross_earnings > 0 THEN ROUND((tip_total / gross_earnings) * 100, 1) ELSE 0 END AS tip_rate
      FROM shifts
      ORDER BY created_at DESC
    `);
    return result.rows;
  } finally {
    client.release();
  }
}

async function getEvents(): Promise<LocalEvent[]> {
  try {
    const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/events`, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.events ?? [];
  } catch {
    return [];
  }
}

const WEATHER_ICONS: Record<string, string> = {
  Clear: "☀️",
  "Mostly Clear": "🌤",
  "Partly Cloudy": "⛅",
  Overcast: "☁️",
  Fog: "🌫",
  Rain: "🌧",
  "Light Rain": "🌦",
  "Heavy Rain": "⛈",
  Snow: "❄️",
  Thunderstorm: "⛈",
};

function weatherIcon(condition: string) {
  for (const [key, icon] of Object.entries(WEATHER_ICONS)) {
    if (condition?.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return "🌡";
}

export default async function Dashboard() {
  let shifts: Shift[] = [];
  let dbError = false;
  let events: LocalEvent[] = [];

  try {
    shifts = await getShifts();
  } catch {
    dbError = true;
  }

  try {
    events = await getEvents();
  } catch {
    // non-fatal
  }

  const recent = shifts.slice(0, 10);

  // Build zone stats for the map
  const zoneStatMap: Record<string, { zone: string; total_gross: number; shift_count: number }> = {};
  for (const s of shifts) {
    if (!zoneStatMap[s.zone]) zoneStatMap[s.zone] = { zone: s.zone, total_gross: 0, shift_count: 0 };
    zoneStatMap[s.zone].total_gross += Number(s.gross_earnings);
    zoneStatMap[s.zone].shift_count += 1;
  }
  const zoneStats = Object.values(zoneStatMap);

  return (
    <div className="space-y-6">
      {dbError && (
        <div className="bg-red-950/30 border border-red-500/40 rounded p-4 font-mono text-sm text-red-400">
          <strong>DATABASE OFFLINE</strong> — Run{" "}
          <code className="bg-red-950/50 px-1 rounded">npm run migrate</code> and set{" "}
          <code className="bg-red-950/50 px-1 rounded">DATABASE_URL</code> in{" "}
          <code className="bg-red-950/50 px-1 rounded">.env.local</code>
        </div>
      )}

      {/* 1. Dispatch Panel */}
      <DispatchPanel />

      {/* 2. Metric Cards */}
      {shifts.length > 0 ? (
        <MetricCards shifts={shifts} />
      ) : (
        <div className="bg-zinc-900 border border-zinc-700/50 rounded p-6 text-center font-mono text-zinc-600">
          No shifts logged yet.{" "}
          <Link href="/log" className="text-amber-400 hover:underline">
            Log your first shift →
          </Link>
        </div>
      )}

      {/* 3. Live tracking + Zone Map + Events */}
      <LiveDashboard zoneStats={zoneStats} events={events} />

      {/* 4. Heatmap */}
      <HeatMap shifts={shifts} />

      {/* 5. Zone bars */}
      <ZoneBars shifts={shifts} />

      {/* 6. Recent shifts */}
      <div className="bg-[#1f1f23] border border-zinc-700/50 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/50">
          <span className="text-[10px] tracking-widest text-zinc-500 font-mono uppercase">
            Recent Shifts
          </span>
          <Link href="/history" className="text-[10px] text-amber-400 font-mono hover:underline tracking-widest uppercase">
            View All →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="p-6 text-center text-zinc-700 font-mono text-sm">
            No shifts yet — go make that bread.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-900">
                  {["Day", "Slot", "Zone", "Gross", "Net", "Tips", "Miles", "Wx"].map((h) => (
                    <th key={h} className="text-left text-zinc-600 px-4 py-2 font-normal uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-zinc-900/50 hover:bg-[#27272b]/50 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-zinc-400">{s.day.slice(0, 3)}</td>
                    <td className="px-4 py-2.5 text-zinc-500">{s.slot.split(" ")[0]}</td>
                    <td className="px-4 py-2.5 text-zinc-300">{s.zone}</td>
                    <td className="px-4 py-2.5 text-amber-400 font-bold">${Number(s.gross_earnings).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-green-400">${Number(s.net_earnings).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-zinc-400">${Number(s.tip_total).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-zinc-500">{Number(s.miles_driven).toFixed(1)}</td>
                    <td className="px-4 py-2.5" title={s.weather_condition ?? ""}>
                      {weatherIcon(s.weather_condition ?? "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
