export const ZONE_BOUNDS: Record<string, { latMin: number; latMax: number; lngMin: number; lngMax: number }> = {
  "Thousand Oaks":    { latMin: 34.13, latMax: 34.22, lngMin: -118.92, lngMax: -118.77 },
  "Simi Valley":      { latMin: 34.23, latMax: 34.32, lngMin: -118.85, lngMax: -118.67 },
  Moorpark:           { latMin: 34.25, latMax: 34.32, lngMin: -118.93, lngMax: -118.83 },
  "Westlake Village": { latMin: 34.12, latMax: 34.18, lngMin: -118.87, lngMax: -118.77 },
  Camarillo:          { latMin: 34.18, latMax: 34.26, lngMin: -119.12, lngMax: -118.96 },
  "Agoura Hills":     { latMin: 34.12, latMax: 34.18, lngMin: -118.80, lngMax: -118.72 },
};

export const ZONE_CENTERS: Record<string, { lat: number; lng: number }> = {
  "Thousand Oaks":    { lat: 34.1706, lng: -118.8376 },
  "Simi Valley":      { lat: 34.2694, lng: -118.7815 },
  Moorpark:           { lat: 34.2856, lng: -118.8820 },
  "Westlake Village": { lat: 34.1453, lng: -118.8192 },
  Camarillo:          { lat: 34.2164, lng: -119.0376 },
  "Agoura Hills":     { lat: 34.1531, lng: -118.7617 },
};

export function detectZone(lat: number, lng: number): string | null {
  for (const [zone, b] of Object.entries(ZONE_BOUNDS)) {
    if (lat >= b.latMin && lat <= b.latMax && lng >= b.lngMin && lng <= b.lngMax) {
      return zone;
    }
  }
  return null;
}

// Find nearest zone by Euclidean distance (fallback when outside all bounds)
export function nearestZone(lat: number, lng: number): string {
  let best = "Thousand Oaks";
  let bestDist = Infinity;
  for (const [zone, c] of Object.entries(ZONE_CENTERS)) {
    const d = Math.sqrt((lat - c.lat) ** 2 + (lng - c.lng) ** 2);
    if (d < bestDist) { bestDist = d; best = zone; }
  }
  return best;
}
