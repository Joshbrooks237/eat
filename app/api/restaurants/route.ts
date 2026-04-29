import { NextResponse } from "next/server";

export interface Restaurant {
  id: number;
  lat: number;
  lng: number;
  name: string;
  cuisine?: string;
}

const ZONES: Record<string, { lat: number; lng: number }> = {
  "Thousand Oaks": { lat: 34.1706, lng: -118.8376 },
  "Simi Valley": { lat: 34.2694, lng: -118.7815 },
  Moorpark: { lat: 34.2856, lng: -118.882 },
  "Westlake Village": { lat: 34.1453, lng: -118.8192 },
  Camarillo: { lat: 34.2164, lng: -119.0376 },
  "Agoura Hills": { lat: 34.1531, lng: -118.7617 },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zoneName = searchParams.get("zone");

  const coords = zoneName ? [ZONES[zoneName]].filter(Boolean) : Object.values(ZONES);

  // Build Overpass query for all requested zones (radius 3km each)
  const unionParts = coords.map(
    ({ lat, lng }) =>
      `node["amenity"~"restaurant|fast_food|cafe|food_court"](around:3000,${lat},${lng});`
  );
  const query = `[out:json][timeout:15];(${unionParts.join("")});out body;`;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      headers: { "Content-Type": "text/plain" },
      next: { revalidate: 3600 }, // cache 1 hour
    });

    if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
    const data = await res.json();

    const restaurants: Restaurant[] = (data.elements ?? []).map(
      (el: { id: number; lat: number; lon: number; tags?: Record<string, string> }) => ({
        id: el.id,
        lat: el.lat,
        lng: el.lon,
        name: el.tags?.name ?? "Unknown",
        cuisine: el.tags?.cuisine,
      })
    );

    return NextResponse.json({ count: restaurants.length, restaurants });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
