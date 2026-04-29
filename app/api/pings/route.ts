import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// POST — save a location ping for an active shift
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { shift_id, lat, lng, accuracy } = body;

  if (!shift_id || lat == null || lng == null) {
    return NextResponse.json({ error: "shift_id, lat, lng required" }, { status: 400 });
  }

  const client = await getPool().connect();
  try {
    const result = await client.query(
      `INSERT INTO location_pings (shift_id, lat, lng, accuracy)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [shift_id, lat, lng, accuracy ?? null]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

// GET ?shift_id=123 — fetch all pings for a shift
export async function GET(req: NextRequest) {
  const shiftId = new URL(req.url).searchParams.get("shift_id");
  if (!shiftId) return NextResponse.json({ error: "shift_id required" }, { status: 400 });

  const client = await getPool().connect();
  try {
    const result = await client.query(
      `SELECT id, lat, lng, accuracy, created_at
       FROM location_pings
       WHERE shift_id = $1
       ORDER BY created_at ASC`,
      [shiftId]
    );
    return NextResponse.json(result.rows);
  } finally {
    client.release();
  }
}
