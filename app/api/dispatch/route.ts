import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { openai } from "@/lib/openai";
import { fetchWeather } from "@/lib/weather";

const SLOT_HOURS: Record<string, number> = {
  "Breakfast 7-11am": 9,
  "Lunch 11:30am-2pm": 12,
  "Afternoon 2-5pm": 14,
  "Dinner 5-8pm": 17,
  "Late Night 8pm-12am": 20,
};

function timeToSlot(hour: number): string {
  if (hour >= 7 && hour < 11) return "Breakfast 7-11am";
  if (hour >= 11 && hour < 14) return "Lunch 11:30am-2pm";
  if (hour >= 14 && hour < 17) return "Afternoon 2-5pm";
  if (hour >= 17 && hour < 20) return "Dinner 5-8pm";
  return "Late Night 8pm-12am";
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { zone, current_time, day_of_week } = body;

  if (!zone || !current_time || !day_of_week) {
    return NextResponse.json({ error: "zone, current_time, day_of_week required" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    // 1. Get zone coordinates
    const zoneRow = await client.query("SELECT lat, lng, cluster_score FROM zones WHERE name = $1", [zone]);
    if (zoneRow.rows.length === 0) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }
    const { lat, lng, cluster_score } = zoneRow.rows[0];

    // 2. Fetch weather
    let weather;
    try {
      weather = await fetchWeather(parseFloat(lat), parseFloat(lng));
    } catch {
      weather = { temp_f: 0, condition: "Unknown", wind_mph: 0, precipitation_mm: 0, weathercode: 0 };
    }

    // 3. Determine time slot
    const hour = parseInt(current_time.split(":")[0], 10);
    const slot = timeToSlot(hour);

    // 4. Pull last 90 days of shifts matching day + slot
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const historyResult = await client.query(
      `SELECT gross_earnings, tip_total, order_count, net_earnings
       FROM shifts
       WHERE day = $1 AND slot = $2 AND zone = $3 AND created_at >= $4`,
      [day_of_week, slot, zone, ninetyDaysAgo.toISOString()]
    );
    const rows = historyResult.rows;

    let avgEarnings: string, avgTips: string, avgOrders: string;
    if (rows.length > 0) {
      const sumEarnings = rows.reduce((s: number, r: Record<string, string>) => s + parseFloat(r.gross_earnings), 0);
      const sumTips = rows.reduce((s: number, r: Record<string, string>) => s + parseFloat(r.tip_total), 0);
      const sumOrders = rows.reduce((s: number, r: Record<string, string>) => s + parseInt(r.order_count), 0);
      avgEarnings = `$${(sumEarnings / rows.length).toFixed(2)}`;
      avgTips = `$${(sumTips / rows.length).toFixed(2)}`;
      avgOrders = (sumOrders / rows.length).toFixed(1);
    } else {
      avgEarnings = "no data yet";
      avgTips = "no data yet";
      avgOrders = "no data yet";
    }

    const isWeekend = ["Saturday", "Sunday"].includes(day_of_week);
    const hourlySlot = SLOT_HOURS[slot] ?? hour;
    void hourlySlot;

    const userMessage = `
DISPATCH REQUEST
================
Day: ${day_of_week} (${isWeekend ? "WEEKEND" : "WEEKDAY"})
Time: ${current_time} → Slot: ${slot}
Zone: ${zone}

WEATHER
-------
Condition: ${weather.condition}
Temp: ${weather.temp_f}°F
Wind: ${weather.wind_mph} mph
Precipitation: ${weather.precipitation_mm}mm

HISTORICAL (${day_of_week} ${slot} in ${zone}, last 90 days, ${rows.length} shifts)
-----------
Avg Gross Earnings: ${avgEarnings}
Avg Tips: ${avgTips}
Avg Orders: ${avgOrders}

ZONE DATA
---------
Cluster Score: ${cluster_score}/10

Respond ONLY with valid JSON. No markdown fences.
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You are Dispatch — a hyper-efficient Uber Eats intelligence system for a solo driver in the Conejo Valley / Simi Valley area of Los Angeles County, California. Your job is to give a direct, confident go/no-go recommendation based on data. You are not a chatbot. You are a dispatch operator. Be terse, specific, and actionable. No fluff. Think weather radar operator meets seasoned courier dispatcher.",
        },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      ...parsed,
      meta: {
        zone,
        slot,
        day_of_week,
        weather,
        shift_count: rows.length,
        avg_earnings: avgEarnings,
      },
    });
  } finally {
    client.release();
  }
}
