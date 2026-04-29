import { NextResponse } from "next/server";

export interface LocalEvent {
  id: string;
  name: string;
  venue: string;
  zone: string;
  date: string;
  time: string;
  url: string;
  category: string;
}

// Zone bounding boxes for matching Ticketmaster events to zones
const ZONE_BOUNDS: Record<string, { latMin: number; latMax: number; lngMin: number; lngMax: number }> = {
  "Thousand Oaks": { latMin: 34.13, latMax: 34.22, lngMin: -118.92, lngMax: -118.77 },
  "Simi Valley":   { latMin: 34.23, latMax: 34.32, lngMin: -118.85, lngMax: -118.67 },
  Moorpark:        { latMin: 34.25, latMax: 34.32, lngMin: -118.93, lngMax: -118.83 },
  "Westlake Village": { latMin: 34.12, latMax: 34.18, lngMin: -118.87, lngMax: -118.77 },
  Camarillo:       { latMin: 34.18, latMax: 34.26, lngMin: -119.12, lngMax: -118.96 },
  "Agoura Hills":  { latMin: 34.12, latMax: 34.18, lngMin: -118.80, lngMax: -118.72 },
};

function matchZone(lat: number, lng: number): string {
  for (const [zone, b] of Object.entries(ZONE_BOUNDS)) {
    if (lat >= b.latMin && lat <= b.latMax && lng >= b.lngMin && lng <= b.lngMax) {
      return zone;
    }
  }
  return "Conejo Valley";
}

export async function GET() {
  const apiKey = process.env.TICKETMASTER_API_KEY;

  // Without API key — return curated static events as fallback
  if (!apiKey) {
    return NextResponse.json({ events: [], source: "no_key" });
  }

  try {
    // Search Ticketmaster for events in Conejo Valley area
    const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("latlong", "34.1706,-118.8376"); // Thousand Oaks center
    url.searchParams.set("radius", "25");
    url.searchParams.set("unit", "miles");
    url.searchParams.set("size", "10");
    url.searchParams.set("sort", "date,asc");

    const res = await fetch(url.toString(), { next: { revalidate: 1800 } }); // 30min cache
    if (!res.ok) throw new Error(`Ticketmaster ${res.status}`);
    const data = await res.json();

    const raw = data._embedded?.events ?? [];
    const events: LocalEvent[] = raw.map((e: Record<string, unknown>) => {
      const embedded = e._embedded as Record<string, unknown[]> | undefined;
      const venue = (embedded?.venues?.[0]) as Record<string, unknown> | undefined;
      const loc = venue?.location as Record<string, string> | undefined;
      const lat = parseFloat(loc?.latitude ?? "34.1706");
      const lng = parseFloat(loc?.longitude ?? "-118.8376");
      const dates = e.dates as Record<string, unknown>;
      const start = (dates?.start as Record<string, string>) ?? {};
      return {
        id: e.id as string,
        name: e.name as string,
        venue: (venue?.name as string) ?? "Unknown Venue",
        zone: matchZone(lat, lng),
        date: start.localDate ?? "",
        time: start.localTime ?? "",
        url: e.url as string,
        category: (((e.classifications as Record<string, unknown>[] | undefined)?.[0] as Record<string, unknown> | undefined)?.segment as Record<string, string> | undefined)?.name ?? "Event",
      };
    });

    return NextResponse.json({ events, source: "ticketmaster" });
  } catch (err) {
    console.error("Ticketmaster fetch failed:", err);
    return NextResponse.json({ events: [], source: "error" });
  }
}
