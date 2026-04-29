"use client";

import { useState } from "react";
import { Shift } from "@/lib/types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SLOTS = [
  "Breakfast 7-11am",
  "Lunch 11:30am-2pm",
  "Afternoon 2-5pm",
  "Dinner 5-8pm",
  "Late Night 8pm-12am",
];

interface CellData {
  avg_net: number;
  avg_tip_rate: number;
  avg_orders: number;
  count: number;
  score: number;
}

function scoreToColor(score: number): string {
  if (score === 0) return "bg-zinc-900 border-zinc-800";
  if (score < 20) return "bg-green-950/60 border-green-900/40";
  if (score < 40) return "bg-green-900/70 border-green-800/50";
  if (score < 60) return "bg-green-800/80 border-green-700/60";
  if (score < 80) return "bg-green-700/90 border-green-600/70";
  return "bg-green-500/90 border-green-400/80";
}

function scoreToText(score: number): string {
  if (score === 0) return "text-zinc-700";
  if (score < 40) return "text-green-400/70";
  if (score < 70) return "text-green-300";
  return "text-white";
}

export default function HeatMap({ shifts }: { shifts: Shift[] }) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const cells: Record<string, CellData> = {};

  for (const shift of shifts) {
    const key = `${shift.day}|${shift.slot}`;
    if (!cells[key]) {
      cells[key] = { avg_net: 0, avg_tip_rate: 0, avg_orders: 0, count: 0, score: 0 };
    }
    const c = cells[key];
    c.avg_net += Number(shift.net_earnings);
    c.avg_tip_rate +=
      Number(shift.gross_earnings) > 0
        ? (Number(shift.tip_total) / Number(shift.gross_earnings)) * 100
        : 0;
    c.avg_orders += Number(shift.order_count);
    c.count += 1;
  }

  let maxScore = 0;
  for (const key in cells) {
    const c = cells[key];
    c.avg_net /= c.count;
    c.avg_tip_rate /= c.count;
    c.avg_orders /= c.count;
    c.score = c.avg_net * 0.5 + c.avg_tip_rate * 0.3 + c.avg_orders * 0.2;
    if (c.score > maxScore) maxScore = c.score;
  }

  // Normalize to 0-100
  if (maxScore > 0) {
    for (const key in cells) {
      cells[key].score = (cells[key].score / maxScore) * 100;
    }
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
      <h2 className="text-xs tracking-widest text-zinc-500 font-mono uppercase mb-4">
        Earnings Heatmap — Day × Time Slot
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr>
              <th className="text-left text-zinc-600 pr-3 pb-2 font-normal w-32">SLOT</th>
              {DAYS.map((d) => (
                <th key={d} className="text-center text-zinc-500 pb-2 font-normal px-1 whitespace-nowrap">
                  {d.slice(0, 3).toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slot) => (
              <tr key={slot}>
                <td className="text-zinc-600 pr-3 py-1 text-[10px] whitespace-nowrap">
                  {slot.split(" ").slice(0, 1).join("")}
                </td>
                {DAYS.map((day) => {
                  const key = `${day}|${slot}`;
                  const cell = cells[key];
                  const isHovered = hoveredCell === key;
                  return (
                    <td
                      key={day}
                      className={`text-center py-1 px-1 relative`}
                      onMouseEnter={() => setHoveredCell(key)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div
                        className={`
                          rounded border px-1 py-1.5 cursor-default transition-all
                          ${cell ? scoreToColor(cell.score) : "bg-zinc-900 border-zinc-800"}
                          ${isHovered ? "ring-1 ring-amber-500/60" : ""}
                        `}
                      >
                        {cell ? (
                          <span className={`text-[11px] font-bold ${scoreToText(cell.score)}`}>
                            ${cell.avg_net.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-zinc-700">—</span>
                        )}
                      </div>
                      {isHovered && cell && (
                        <div className="absolute z-10 left-1/2 -translate-x-1/2 bottom-full mb-1 w-36 bg-zinc-800 border border-zinc-600 rounded p-2 text-left shadow-xl pointer-events-none">
                          <div className="text-amber-400 font-bold mb-1">
                            {day.slice(0, 3)} · {slot.split(" ")[0]}
                          </div>
                          <div className="text-zinc-300">Avg net: ${cell.avg_net.toFixed(2)}</div>
                          <div className="text-zinc-300">Tip rate: {cell.avg_tip_rate.toFixed(1)}%</div>
                          <div className="text-zinc-300">Avg orders: {cell.avg_orders.toFixed(1)}</div>
                          <div className="text-zinc-500">Shifts: {cell.count}</div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] text-zinc-600 font-mono">LOW</span>
        {[10, 30, 50, 70, 90].map((v) => (
          <div
            key={v}
            className={`w-6 h-3 rounded-sm border ${scoreToColor(v)}`}
          />
        ))}
        <span className="text-[10px] text-zinc-600 font-mono">HIGH</span>
      </div>
    </div>
  );
}
