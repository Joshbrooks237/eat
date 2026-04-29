export interface OsrmResult {
  distance_miles: number;
  duration_minutes: number;
}

export async function fetchRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<OsrmResult> {
  // OSRM expects lng,lat order
  const url = `http://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM error: ${res.status}`);
  const data = await res.json();
  if (data.code !== "Ok") throw new Error(`OSRM: ${data.message}`);
  const route = data.routes[0];
  return {
    distance_miles: Math.round((route.distance / 1609.34) * 100) / 100,
    duration_minutes: Math.round(route.duration / 60),
  };
}
