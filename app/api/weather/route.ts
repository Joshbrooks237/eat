import { NextRequest, NextResponse } from "next/server";
import { fetchWeather } from "@/lib/weather";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  try {
    const weather = await fetchWeather(lat, lng);
    return NextResponse.json(weather);
  } catch (err) {
    console.error("Weather fetch failed:", err);
    return NextResponse.json({ error: "Weather unavailable" }, { status: 502 });
  }
}
