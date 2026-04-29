"use client";

import { useState } from "react";

const ZONES = [
  "Thousand Oaks",
  "Simi Valley",
  "Moorpark",
  "Westlake Village",
  "Camarillo",
  "Agoura Hills",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface DispatchResult {
  verdict: "GO" | "WAIT" | "NO";
  confidence: number;
  reason: string;
  suggested_zone: string;
  best_position: string;
  watch_for: string;
  estimated_hourly: string;
  meta?: {
    weather?: { temp_f: number; condition: string; wind_mph: number; precipitation_mm: number };
    slot?: string;
    shift_count?: number;
    avg_earnings?: string;
  };
}

const VERDICT_CONFIG = {
  GO: {
    glow: "shadow-[0_0_40px_rgba(34,197,94,0.4)] border-green-500/60",
    badge: "bg-green-500/20 text-green-400 border border-green-500/40",
    ring: "ring-green-500/30",
    dot: "bg-green-400",
    label: "text-green-400",
  },
  WAIT: {
    glow: "shadow-[0_0_40px_rgba(245,158,11,0.4)] border-amber-500/60",
    badge: "bg-amber-500/20 text-amber-400 border border-amber-500/40",
    ring: "ring-amber-500/30",
    dot: "bg-amber-400",
    label: "text-amber-400",
  },
  NO: {
    glow: "shadow-[0_0_40px_rgba(239,68,68,0.4)] border-red-500/60",
    badge: "bg-red-500/20 text-red-400 border border-red-500/40",
    ring: "ring-red-500/30",
    dot: "bg-red-400",
    label: "text-red-400",
  },
};

export default function DispatchPanel() {
  const now = new Date();
  const defaultDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
  const defaultTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const [zone, setZone] = useState(ZONES[0]);
  const [day, setDay] = useState(defaultDay);
  const [time, setTime] = useState(defaultTime);
  const [result, setResult] = useState<DispatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getDispatch() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone, current_time: time, day_of_week: day }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      // Normalize verdict to uppercase in case GPT returns lowercase
      if (data.verdict) data.verdict = String(data.verdict).toUpperCase();
      if (!["GO", "WAIT", "NO"].includes(data.verdict)) data.verdict = "WAIT";
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dispatch failed");
    } finally {
      setLoading(false);
    }
  }

  const cfg = result ? VERDICT_CONFIG[result.verdict] : null;

  return (
    <div
      className={`
        bg-[#1f1f23] border rounded-lg p-6 transition-all duration-500
        ${cfg ? `${cfg.glow} ring-1 ${cfg.ring}` : "border-zinc-700/50"}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className={`w-2 h-2 rounded-full animate-pulse ${cfg ? cfg.dot : "bg-zinc-600"}`} />
        <span className="text-[10px] tracking-[0.25em] text-zinc-500 font-mono uppercase">
          Dispatch Intelligence
        </span>
        {result && (
          <span className="ml-auto text-[10px] font-mono text-zinc-600">
            {result.meta?.slot} · {result.meta?.shift_count ?? 0} historical shifts
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 text-zinc-200 font-mono text-sm rounded px-3 py-2 focus:outline-none focus:border-amber-500/60 flex-1 min-w-40"
        >
          {ZONES.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>

        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 text-zinc-200 font-mono text-sm rounded px-3 py-2 focus:outline-none focus:border-amber-500/60"
        >
          {DAYS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 text-zinc-200 font-mono text-sm rounded px-3 py-2 focus:outline-none focus:border-amber-500/60 w-32"
        />

        <button
          onClick={getDispatch}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold font-mono text-sm px-6 py-2 rounded tracking-widest uppercase transition-colors min-w-40"
        >
          {loading ? "ANALYZING..." : "GET DISPATCH"}
        </button>
      </div>

      {error && (
        <div className="text-red-400 font-mono text-sm border border-red-500/30 bg-red-950/20 rounded p-3">
          ERROR: {error}
        </div>
      )}

      {/* Result */}
      {result && cfg && (
        <div className="space-y-4">
          {/* Verdict row */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className={`text-6xl font-black tracking-wider ${cfg.label}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              {result.verdict}
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">Confidence</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-sm ${i < result.confidence && cfg ? cfg.dot : "bg-zinc-800"}`}
                    />
                  ))}
                </div>
                <span className={`text-sm font-mono font-bold ${cfg.label}`}>{result.confidence}/10</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">Est. Hourly</span>
                <span className="text-lg font-bold font-mono text-amber-400">{result.estimated_hourly}</span>
              </div>
            </div>

            {/* Weather badge */}
            {result.meta?.weather && (
              <div className="ml-auto flex flex-col items-end text-right">
                <span className="text-sm font-mono text-zinc-300">{result.meta.weather.condition}</span>
                <span className="text-xs font-mono text-zinc-500">
                  {result.meta.weather.temp_f}°F · {result.meta.weather.wind_mph}mph wind
                  {result.meta.weather.precipitation_mm > 0 ? ` · ${result.meta.weather.precipitation_mm}mm precip` : ""}
                </span>
              </div>
            )}
          </div>

          {/* Data grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-zinc-700/50 pt-4">
            <DataRow label="REASON" value={result.reason} highlight />
            <DataRow label="SUGGESTED ZONE" value={result.suggested_zone} />
            <DataRow label="BEST POSITION" value={result.best_position} />
            <DataRow label="WATCH FOR" value={result.watch_for} warn />
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="text-center py-8 text-zinc-700 font-mono text-sm">
          SELECT ZONE · SET TIME · REQUEST DISPATCH
        </div>
      )}
    </div>
  );
}

function DataRow({
  label,
  value,
  highlight,
  warn,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="bg-[#27272b]/60 rounded p-3">
      <div className="text-[10px] tracking-widest text-zinc-600 font-mono uppercase mb-1">{label}</div>
      <div className={`text-sm font-mono ${highlight ? "text-zinc-100" : warn ? "text-amber-400/80" : "text-zinc-300"}`}>
        {value}
      </div>
    </div>
  );
}
