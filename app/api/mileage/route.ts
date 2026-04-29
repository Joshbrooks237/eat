import { NextRequest, NextResponse } from "next/server";
import { fetchRoute } from "@/lib/osrm";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { origin_lat, origin_lng, dest_lat, dest_lng } = body;

  if (!origin_lat || !origin_lng || !dest_lat || !dest_lng) {
    return NextResponse.json({ error: "All coordinates required" }, { status: 400 });
  }

  try {
    const result = await fetchRoute(
      parseFloat(origin_lat),
      parseFloat(origin_lng),
      parseFloat(dest_lat),
      parseFloat(dest_lng)
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("OSRM fetch failed:", err);
    return NextResponse.json({ error: "Routing unavailable" }, { status: 502 });
  }
}
