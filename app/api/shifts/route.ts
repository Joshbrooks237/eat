import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { fetchWeather } from "@/lib/weather";

export async function GET() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        *,
        CASE WHEN hours > 0 THEN ROUND(gross_earnings / hours, 2) ELSE 0 END AS hourly_rate,
        CASE WHEN gross_earnings > 0 THEN ROUND((tip_total / gross_earnings) * 100, 1) ELSE 0 END AS tip_rate
      FROM shifts
      ORDER BY created_at DESC
    `);
    return NextResponse.json(result.rows);
  } finally {
    client.release();
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    day,
    slot,
    zone,
    hours,
    gross_earnings,
    tip_total = 0,
    miles_driven = 0,
    order_count = 0,
    notes = "",
  } = body;

  if (!day || !slot || !zone || !hours || !gross_earnings) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const kia_mpg = parseFloat(process.env.KIA_MPG ?? "32");
  const gas_price = parseFloat(process.env.GAS_PRICE_PER_GALLON ?? "4.89");
  const gas_cost = Math.round(((miles_driven / kia_mpg) * gas_price) * 100) / 100;

  // Fetch weather for zone
  const client = await pool.connect();
  let weather_condition = "Unknown";
  try {
    const zoneRow = await client.query("SELECT lat, lng FROM zones WHERE name = $1", [zone]);
    if (zoneRow.rows.length > 0) {
      const { lat, lng } = zoneRow.rows[0];
      const weather = await fetchWeather(parseFloat(lat), parseFloat(lng));
      weather_condition = weather.condition;
    }
  } catch {
    // non-fatal
  }

  try {
    const result = await client.query(
      `INSERT INTO shifts
        (day, slot, zone, hours, gross_earnings, tip_total, miles_driven, order_count, gas_cost, weather_condition, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [day, slot, zone, hours, gross_earnings, tip_total, miles_driven, order_count, gas_cost, weather_condition, notes]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } finally {
    client.release();
  }
}
