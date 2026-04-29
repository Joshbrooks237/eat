export const dynamic = "force-dynamic";

import { getPool } from "@/lib/db";
import { Shift } from "@/lib/types";
import Link from "next/link";

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

const WEATHER_ICONS: Record<string, string> = {
  Clear: "☀️", "Mostly Clear": "🌤", "Partly Cloudy": "⛅", Overcast: "☁️",
  Fog: "🌫", Rain: "🌧", "Light Rain": "🌦", "Heavy Rain": "⛈",
  Snow: "❄️", Thunderstorm: "⛈",
};

function weatherIcon(condition: string) {
  for (const [key, icon] of Object.entries(WEATHER_ICONS)) {
    if (condition?.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return "🌡";
}

export default async function HistoryPage() {
  let shifts: Shift[] = [];
  let dbError = false;

  try {
    shifts = await getShifts();
  } catch {
    dbError = true;
  }

  const totalGross = shifts.reduce((s, r) => s + Number(r.gross_earnings), 0);
  const totalNet = shifts.reduce((s, r) => s + Number(r.net_earnings), 0);
  const totalMiles = shifts.reduce((s, r) => s + Number(r.miles_driven), 0);
  const totalHours = shifts.reduce((s, r) => s + Number(r.hours), 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-[10px] tracking-[0.25em] text-zinc-500 font-mono uppercase">
            Shift Archive
          </span>
        </div>
        <div className="flex items-center justify-between">
          <h1
            className="text-3xl font-bold text-zinc-100 tracking-wide"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            HISTORY
          </h1>
          <Link
            href="/log"
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono text-xs px-4 py-2 rounded tracking-widest uppercase transition-colors"
          >
            + LOG SHIFT
          </Link>
        </div>
      </div>

      {dbError && (
        <div className="bg-red-950/30 border border-red-500/40 rounded p-4 font-mono text-sm text-red-400">
          DATABASE OFFLINE — check DATABASE_URL and run npm run migrate
        </div>
      )}

      {/* Summary strip */}
      {shifts.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "TOTAL SHIFTS", value: shifts.length.toString() },
            { label: "TOTAL GROSS", value: `$${totalGross.toFixed(2)}` },
            { label: "TOTAL NET", value: `$${totalNet.toFixed(2)}` },
            { label: "AVG HOURLY", value: totalHours > 0 ? `$${(totalGross / totalHours).toFixed(2)}` : "—" },
          ].map((c) => (
            <div key={c.label} className="bg-zinc-900 border border-zinc-700/50 rounded p-3">
              <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest mb-1">{c.label}</div>
              <div className="text-lg font-bold font-mono text-amber-400">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Full table */}
      <div className="bg-[#1f1f23] border border-zinc-700/50 rounded-lg overflow-hidden">
        {shifts.length === 0 ? (
          <div className="p-12 text-center font-mono text-zinc-600">
            No shifts logged.{" "}
            <Link href="/log" className="text-amber-400 hover:underline">
              Log your first shift →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-700/50 bg-[#27272b]/50">
                  {[
                    "Date", "Day", "Slot", "Zone", "Hrs", "Gross", "Net", "Gas",
                    "Tips", "Tip%", "Orders", "$/hr", "Miles", "Wx", "Notes",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-zinc-600 px-3 py-2.5 font-normal uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-zinc-900/50 hover:bg-[#27272b]/40 transition-colors"
                  >
                    <td className="px-3 py-2 text-zinc-600 whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString("en-US", {
                        month: "numeric", day: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-2 text-zinc-500">{s.day.slice(0, 3)}</td>
                    <td className="px-3 py-2 text-zinc-500 whitespace-nowrap">{s.slot.split(" ")[0]}</td>
                    <td className="px-3 py-2 text-zinc-300 whitespace-nowrap">{s.zone}</td>
                    <td className="px-3 py-2 text-zinc-400">{Number(s.hours).toFixed(1)}</td>
                    <td className="px-3 py-2 text-amber-400 font-bold">${Number(s.gross_earnings).toFixed(2)}</td>
                    <td className="px-3 py-2 text-green-400 font-bold">${Number(s.net_earnings).toFixed(2)}</td>
                    <td className="px-3 py-2 text-red-400/80">${Number(s.gas_cost).toFixed(2)}</td>
                    <td className="px-3 py-2 text-zinc-400">${Number(s.tip_total).toFixed(2)}</td>
                    <td className="px-3 py-2 text-zinc-500">{Number(s.tip_rate).toFixed(1)}%</td>
                    <td className="px-3 py-2 text-zinc-500">{s.order_count}</td>
                    <td className="px-3 py-2 text-cyan-400/80">${Number(s.hourly_rate).toFixed(2)}</td>
                    <td className="px-3 py-2 text-zinc-500">{Number(s.miles_driven).toFixed(1)}</td>
                    <td className="px-3 py-2" title={s.weather_condition ?? ""}>
                      {weatherIcon(s.weather_condition ?? "")}
                    </td>
                    <td className="px-3 py-2 text-zinc-600 max-w-48 truncate">
                      {s.notes ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-700 bg-[#27272b]/50">
                  <td colSpan={5} className="px-3 py-2 text-zinc-600">
                    {shifts.length} shifts · {totalHours.toFixed(1)} hrs
                  </td>
                  <td className="px-3 py-2 text-amber-400 font-bold">${totalGross.toFixed(2)}</td>
                  <td className="px-3 py-2 text-green-400 font-bold">${totalNet.toFixed(2)}</td>
                  <td colSpan={5} />
                  <td className="px-3 py-2 text-zinc-500">{totalMiles.toFixed(1)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
