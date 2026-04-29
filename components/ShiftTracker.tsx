"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useGPS } from "@/lib/useGPS";

const PING_INTERVAL_MS = 30_000; // 30 seconds

interface ActiveShift {
  id: number;
  zone: string;
  startedAt: Date;
  pingCount: number;
}

interface Props {
  onPositionUpdate?: (lat: number, lng: number, zone: string | null) => void;
}

export default function ShiftTracker({ onPositionUpdate }: Props) {
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeShiftRef = useRef<ActiveShift | null>(null);
  activeShiftRef.current = activeShift;

  // Persist active shift in localStorage across page refreshes
  useEffect(() => {
    const saved = localStorage.getItem("active_shift");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.startedAt = new Date(parsed.startedAt);
        setActiveShift(parsed);
      } catch { /* stale data */ }
    }
  }, []);

  // Elapsed timer
  useEffect(() => {
    if (!activeShift) return;
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - activeShift.startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [activeShift]);

  const sendPing = useCallback(async (lat: number, lng: number, accuracy: number | null) => {
    const shift = activeShiftRef.current;
    if (!shift) return;
    try {
      await fetch("/api/pings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shift_id: shift.id, lat, lng, accuracy }),
      });
      setActiveShift((s) => s ? { ...s, pingCount: s.pingCount + 1 } : s);
    } catch { /* non-fatal */ }
  }, []);

  const gps = useGPS(sendPing);

  // Notify parent of position + zone updates
  useEffect(() => {
    if (gps.lat && gps.lng) {
      onPositionUpdate?.(gps.lat, gps.lng, gps.detectedZone);
    }
  }, [gps.lat, gps.lng, gps.detectedZone, onPositionUpdate]);

  // Throttled ping on interval (in addition to watchPosition callbacks)
  useEffect(() => {
    if (!activeShift) return;
    pingTimerRef.current = setInterval(() => {
      if (gps.lat && gps.lng) {
        sendPing(gps.lat, gps.lng, gps.accuracy);
      }
    }, PING_INTERVAL_MS);
    return () => {
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
    };
  }, [activeShift, gps.lat, gps.lng, gps.accuracy, sendPing]);

  async function startShift() {
    setStarting(true);
    setError(null);
    try {
      // Create a minimal shift record to get an ID
      const zone = gps.detectedZone ?? "Thousand Oaks";
      const now = new Date();
      const day = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][now.getDay()];
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day,
          slot: "Dinner 5-8pm", // placeholder — updated on end
          zone,
          hours: 0,
          gross_earnings: 0,
          tip_total: 0,
          order_count: 0,
          miles_driven: 0,
          notes: "ACTIVE — pending completion",
        }),
      });
      if (!res.ok) throw new Error("Failed to create shift record");
      const shift = await res.json();
      const active: ActiveShift = { id: shift.id, zone, startedAt: now, pingCount: 0 };
      setActiveShift(active);
      localStorage.setItem("active_shift", JSON.stringify(active));
      gps.start();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start shift");
    } finally {
      setStarting(false);
    }
  }

  async function endShift() {
    if (!activeShift) return;
    setEnding(true);
    gps.stop();
    if (pingTimerRef.current) clearInterval(pingTimerRef.current);
    localStorage.removeItem("active_shift");
    setActiveShift(null);
    setElapsed(0);
    setEnding(false);
    // Redirect to log page to fill in final details
    window.location.href = `/log?shift_id=${activeShift.id}&zone=${encodeURIComponent(activeShift.zone)}`;
  }

  function formatElapsed(secs: number) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }

  const gpsStatusColor = {
    idle: "text-zinc-600",
    requesting: "text-amber-400 animate-pulse",
    active: "text-green-400",
    denied: "text-red-400",
    unavailable: "text-red-400",
  }[gps.status];

  const gpsStatusDot = {
    idle: "bg-zinc-700",
    requesting: "bg-amber-400 animate-pulse",
    active: "bg-green-400",
    denied: "bg-red-400",
    unavailable: "bg-red-400",
  }[gps.status];

  return (
    <div className={`border rounded-lg p-4 font-mono transition-all duration-300 ${
      activeShift
        ? "bg-green-950/20 border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
        : "bg-[#1f1f23] border-zinc-700/50"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${activeShift ? "bg-green-400 animate-pulse" : "bg-zinc-600"}`} />
          <span className="text-[10px] tracking-widest text-zinc-500 uppercase">
            {activeShift ? "Shift Active" : "Shift Tracker"}
          </span>
        </div>
        {activeShift && (
          <span className="text-green-400 font-bold text-lg tabular-nums tracking-widest">
            {formatElapsed(elapsed)}
          </span>
        )}
      </div>

      {/* GPS status bar */}
      <div className="flex items-center gap-2 mb-3 text-xs">
        <div className={`w-1.5 h-1.5 rounded-full ${gpsStatusDot}`} />
        <span className={gpsStatusColor}>
          {gps.status === "idle" && "GPS idle"}
          {gps.status === "requesting" && "Acquiring GPS..."}
          {gps.status === "active" && `GPS locked · ±${gps.accuracy}m`}
          {gps.status === "denied" && gps.error}
          {gps.status === "unavailable" && gps.error}
        </span>
        {gps.detectedZone && gps.status === "active" && (
          <span className="ml-auto text-amber-400 text-[10px]">
            📍 {gps.detectedZone}
          </span>
        )}
      </div>

      {/* Active shift stats */}
      {activeShift && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-zinc-900/60 rounded p-2 text-center">
            <div className="text-[9px] text-zinc-600 uppercase tracking-widest">Zone</div>
            <div className="text-xs text-zinc-300 mt-0.5">{gps.detectedZone ?? activeShift.zone}</div>
          </div>
          <div className="bg-zinc-900/60 rounded p-2 text-center">
            <div className="text-[9px] text-zinc-600 uppercase tracking-widest">Pings</div>
            <div className="text-xs text-green-400 mt-0.5">{activeShift.pingCount}</div>
          </div>
          <div className="bg-zinc-900/60 rounded p-2 text-center">
            <div className="text-[9px] text-zinc-600 uppercase tracking-widest">Shift ID</div>
            <div className="text-xs text-zinc-500 mt-0.5">#{activeShift.id}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-xs border border-red-500/30 bg-red-950/20 rounded p-2 mb-3">
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        {!activeShift ? (
          <button
            onClick={startShift}
            disabled={starting}
            className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold text-xs py-2.5 rounded tracking-widest uppercase transition-colors"
          >
            {starting ? "STARTING..." : "▶ START SHIFT"}
          </button>
        ) : (
          <button
            onClick={endShift}
            disabled={ending}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-xs py-2.5 rounded tracking-widest uppercase transition-colors"
          >
            {ending ? "ENDING..." : "■ END SHIFT"}
          </button>
        )}
      </div>

      {gps.status === "denied" && (
        <p className="text-zinc-600 text-[10px] mt-2 text-center">
          Zone will be detected manually on the log page.
        </p>
      )}
    </div>
  );
}
