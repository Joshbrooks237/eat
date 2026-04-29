"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ZONES = [
  "Thousand Oaks",
  "Simi Valley",
  "Moorpark",
  "Westlake Village",
  "Camarillo",
  "Agoura Hills",
];

const ZONE_COORDS: Record<string, { lat: number; lng: number }> = {
  "Thousand Oaks": { lat: 34.1706, lng: -118.8376 },
  "Simi Valley": { lat: 34.2694, lng: -118.7815 },
  Moorpark: { lat: 34.2856, lng: -118.882 },
  "Westlake Village": { lat: 34.1453, lng: -118.8192 },
  Camarillo: { lat: 34.2164, lng: -119.0376 },
  "Agoura Hills": { lat: 34.1531, lng: -118.7617 },
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SLOTS = [
  "Breakfast 7-11am",
  "Lunch 11:30am-2pm",
  "Afternoon 2-5pm",
  "Dinner 5-8pm",
  "Late Night 8pm-12am",
];

const KIA_MPG = 32;
const GAS_PRICE = 4.89;

export default function ShiftForm() {
  const router = useRouter();
  const now = new Date();
  const defaultDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];

  const [form, setForm] = useState({
    day: defaultDay,
    slot: "Dinner 5-8pm",
    zone: ZONES[0],
    hours: "",
    gross_earnings: "",
    tip_total: "",
    order_count: "",
    miles_driven: "",
    notes: "",
  });

  const [milesLoading, setMilesLoading] = useState(false);
  const [preview, setPreview] = useState<{ gas_cost: number; net_earnings: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-calculate miles when zone changes
  useEffect(() => {
    const homeLat = parseFloat(process.env.NEXT_PUBLIC_HOME_LAT ?? "34.2856");
    const homeLng = parseFloat(process.env.NEXT_PUBLIC_HOME_LNG ?? "-118.8820");
    const dest = ZONE_COORDS[form.zone];
    if (!dest) return;

    setMilesLoading(true);
    fetch("/api/mileage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin_lat: homeLat,
        origin_lng: homeLng,
        dest_lat: dest.lat,
        dest_lng: dest.lng,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.distance_miles) {
          const roundTrip = (data.distance_miles * 2).toFixed(1);
          setForm((f) => ({ ...f, miles_driven: roundTrip }));
        }
      })
      .catch(() => {})
      .finally(() => setMilesLoading(false));
  }, [form.zone]);

  // Live preview of gas cost + net
  useEffect(() => {
    const miles = parseFloat(form.miles_driven);
    const gross = parseFloat(form.gross_earnings);
    if (!isNaN(miles) && !isNaN(gross) && miles > 0) {
      const gas_cost = (miles / KIA_MPG) * GAS_PRICE;
      setPreview({ gas_cost: Math.round(gas_cost * 100) / 100, net_earnings: gross - gas_cost });
    } else {
      setPreview(null);
    }
  }, [form.miles_driven, form.gross_earnings]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          hours: parseFloat(form.hours),
          gross_earnings: parseFloat(form.gross_earnings),
          tip_total: parseFloat(form.tip_total || "0"),
          order_count: parseInt(form.order_count || "0"),
          miles_driven: parseFloat(form.miles_driven || "0"),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Submission failed");
      }
      setSuccess(true);
      setTimeout(() => router.push("/history"), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-16 font-mono">
        <div className="text-green-400 text-4xl mb-3">✓</div>
        <div className="text-green-400 text-lg">SHIFT LOGGED</div>
        <div className="text-zinc-600 text-sm mt-1">Redirecting to history...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl mx-auto">
      <div className="grid grid-cols-2 gap-4">
        <Field label="DAY">
          <select value={form.day} onChange={(e) => set("day", e.target.value)} className={SELECT_CLS}>
            {DAYS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="TIME SLOT">
          <select value={form.slot} onChange={(e) => set("slot", e.target.value)} className={SELECT_CLS}>
            {SLOTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <Field label="ZONE">
        <select value={form.zone} onChange={(e) => set("zone", e.target.value)} className={SELECT_CLS}>
          {ZONES.map((z) => <option key={z}>{z}</option>)}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="HOURS WORKED">
          <input
            type="number"
            step="0.5"
            min="0"
            value={form.hours}
            onChange={(e) => set("hours", e.target.value)}
            placeholder="3.5"
            required
            className={INPUT_CLS}
          />
        </Field>
        <Field label="GROSS EARNINGS ($)">
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.gross_earnings}
            onChange={(e) => set("gross_earnings", e.target.value)}
            placeholder="0.00"
            required
            className={INPUT_CLS}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="TIPS TOTAL ($)">
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.tip_total}
            onChange={(e) => set("tip_total", e.target.value)}
            placeholder="0.00"
            className={INPUT_CLS}
          />
        </Field>
        <Field label="ORDERS COMPLETED">
          <input
            type="number"
            min="0"
            value={form.order_count}
            onChange={(e) => set("order_count", e.target.value)}
            placeholder="0"
            className={INPUT_CLS}
          />
        </Field>
      </div>

      <Field label={`MILES DRIVEN ${milesLoading ? "(calculating round trip...)" : "(round trip estimate)"}`}>
        <input
          type="number"
          step="0.1"
          min="0"
          value={form.miles_driven}
          onChange={(e) => set("miles_driven", e.target.value)}
          placeholder="0.0"
          className={INPUT_CLS}
        />
      </Field>

      {/* Gas / net preview */}
      {preview && (
        <div className="bg-[#27272b]/80 border border-zinc-700 rounded p-4 font-mono text-sm grid grid-cols-3 gap-4">
          <div>
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Gas Cost</div>
            <div className="text-red-400 font-bold">${preview.gas_cost.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Net Earnings</div>
            <div className={`font-bold ${preview.net_earnings >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${preview.net_earnings.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Fuel Rate</div>
            <div className="text-zinc-400">{KIA_MPG} mpg @ ${GAS_PRICE}/gal</div>
          </div>
        </div>
      )}

      <Field label="NOTES (OPTIONAL)">
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          placeholder="Events, anomalies, conditions..."
          className={`${INPUT_CLS} resize-none`}
        />
      </Field>

      {error && (
        <div className="text-red-400 font-mono text-sm border border-red-500/30 bg-red-950/20 rounded p-3">
          ERROR: {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold font-mono py-3 rounded tracking-widest uppercase transition-colors"
      >
        {submitting ? "LOGGING SHIFT..." : "LOG SHIFT"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] tracking-widest text-zinc-500 font-mono uppercase mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const INPUT_CLS =
  "w-full bg-[#27272b] border border-zinc-700 text-zinc-100 font-mono text-sm rounded px-3 py-2.5 focus:outline-none focus:border-amber-500/60 placeholder:text-zinc-700";
const SELECT_CLS =
  "w-full bg-[#27272b] border border-zinc-700 text-zinc-100 font-mono text-sm rounded px-3 py-2.5 focus:outline-none focus:border-amber-500/60";
