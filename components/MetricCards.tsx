"use client";

import { Shift } from "@/lib/types";

interface Props {
  shifts: Shift[];
}

function fmt(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function MetricCards({ shifts }: Props) {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const totalGross = shifts.reduce((s, r) => s + Number(r.gross_earnings), 0);
  const totalNet = shifts.reduce((s, r) => s + Number(r.net_earnings), 0);
  const totalMiles = shifts.reduce((s, r) => s + Number(r.miles_driven), 0);
  const totalHours = shifts.reduce((s, r) => s + Number(r.hours), 0);
  const avgHourly = totalHours > 0 ? totalGross / totalHours : 0;

  const thisWeek = shifts.filter((s) => new Date(s.created_at) >= weekAgo);
  const weekGross = thisWeek.reduce((s, r) => s + Number(r.gross_earnings), 0);

  const bestShift = shifts.reduce(
    (best, r) => (Number(r.gross_earnings) > Number(best.gross_earnings) ? r : best),
    shifts[0] ?? { gross_earnings: 0 }
  );

  const cards = [
    { label: "TOTAL EARNED", value: fmt(totalGross), sub: "all time" },
    { label: "THIS WEEK", value: fmt(weekGross), sub: `${thisWeek.length} shifts` },
    { label: "AVG HOURLY", value: fmt(avgHourly), sub: "gross / hr" },
    { label: "NET PROFIT", value: fmt(totalNet), sub: "after gas" },
    { label: "TOTAL MILES", value: `${totalMiles.toFixed(0)} mi`, sub: "driven" },
    { label: "BEST SHIFT", value: fmt(Number(bestShift?.gross_earnings ?? 0)), sub: "single session" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-zinc-900 border border-zinc-700 rounded p-4 flex flex-col gap-1 hover:border-amber-500/50 transition-colors"
        >
          <span className="text-[10px] tracking-widest text-zinc-500 font-mono uppercase">{c.label}</span>
          <span className="text-2xl font-bold text-amber-400 font-mono tabular-nums">{c.value}</span>
          <span className="text-xs text-zinc-600 font-mono">{c.sub}</span>
        </div>
      ))}
    </div>
  );
}
