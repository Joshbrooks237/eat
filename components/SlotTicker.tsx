"use client";

import { useEffect, useState } from "react";

const SLOTS = [
  { name: "Breakfast", label: "Breakfast 7-11am", start: 7, end: 11 },
  { name: "Lunch", label: "Lunch 11:30am-2pm", start: 11.5, end: 14 },
  { name: "Afternoon", label: "Afternoon 2-5pm", start: 14, end: 17 },
  { name: "Dinner", label: "Dinner 5-8pm", start: 17, end: 20 },
  { name: "Late Night", label: "Late Night 8pm-12am", start: 20, end: 24 },
];

function getCurrentSlotIndex(hour: number): number {
  for (let i = 0; i < SLOTS.length; i++) {
    if (hour >= SLOTS[i].start && hour < SLOTS[i].end) return i;
  }
  return -1; // before 7am
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatCountdown(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function getSignalBars(minutesLeft: number, slotDurationMins: number): number {
  const pct = minutesLeft / slotDurationMins;
  if (pct > 0.75) return 4;
  if (pct > 0.5) return 3;
  if (pct > 0.25) return 2;
  return 1;
}

export default function SlotTicker() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const slotIdx = getCurrentSlotIndex(hour);
  const currentSlot = slotIdx >= 0 ? SLOTS[slotIdx] : null;
  const nextSlot = slotIdx >= 0 ? SLOTS[slotIdx + 1] ?? null : SLOTS[0];

  const lunchSlot = SLOTS[1];
  const isLunchActive = slotIdx === 1;
  const beforeLunch = hour < lunchSlot.start;
  const minsToLunch = beforeLunch
    ? Math.max(0, Math.round((lunchSlot.start - hour) * 60))
    : 0;

  let secsLeft = 0;
  if (currentSlot) {
    secsLeft = Math.max(0, Math.round((currentSlot.end - hour) * 3600));
  }
  const slotDurationMins = currentSlot
    ? (currentSlot.end - currentSlot.start) * 60
    : 0;
  const minsLeft = Math.ceil(secsLeft / 60);
  const bars = currentSlot ? getSignalBars(minsLeft, slotDurationMins) : 0;

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] tracking-widest text-zinc-500 uppercase">Slot Ticker</span>
        <span className="text-zinc-400 text-sm tabular-nums">{timeStr}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Current slot */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">Current Slot</div>
          {currentSlot ? (
            <div className="text-amber-400 font-bold text-sm">{currentSlot.name}</div>
          ) : (
            <div className="text-zinc-600 text-sm">Off Hours</div>
          )}
        </div>

        {/* Time left in slot */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">Slot Ends In</div>
          {currentSlot ? (
            <div className={`font-bold text-sm tabular-nums ${secsLeft < 900 ? "text-red-400" : "text-green-400"}`}>
              {formatCountdown(secsLeft)}
            </div>
          ) : (
            <div className="text-zinc-600 text-sm">—</div>
          )}
        </div>

        {/* Signal strength */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">Signal</div>
          <div className="flex items-end gap-[3px] h-5">
            {[1, 2, 3, 4].map((b) => (
              <div
                key={b}
                className={`w-2 rounded-sm transition-all ${
                  currentSlot && b <= bars ? "bg-amber-400" : "bg-zinc-700"
                }`}
                style={{ height: `${b * 25}%` }}
              />
            ))}
          </div>
        </div>

        {/* Lunch countdown */}
        <div className={`border rounded p-3 ${isLunchActive ? "bg-amber-950/30 border-amber-500/40" : "bg-zinc-900 border-zinc-800"}`}>
          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">
            {isLunchActive ? "🍔 Lunch LIVE" : "Lunch In"}
          </div>
          {isLunchActive ? (
            <div className="text-amber-300 font-bold text-sm tabular-nums">
              {formatCountdown(secsLeft)}
            </div>
          ) : beforeLunch ? (
            <div className="text-zinc-300 font-bold text-sm">
              {minsToLunch}m
            </div>
          ) : (
            <div className="text-zinc-600 text-sm">Done</div>
          )}
        </div>
      </div>

      {/* Next slot banner */}
      {nextSlot && currentSlot && (
        <div className="mt-3 text-[10px] text-zinc-600 text-right">
          Next → <span className="text-zinc-400">{nextSlot.label}</span>
        </div>
      )}
    </div>
  );
}
