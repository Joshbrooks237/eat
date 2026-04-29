export interface WeatherResult {
  temp_f: number;
  condition: string;
  wind_mph: number;
  precipitation_mm: number;
  weathercode: number;
}

const WMO_MAP: Record<string, string> = {
  "0": "Clear",
  "1": "Mostly Clear",
  "2": "Partly Cloudy",
  "3": "Overcast",
  "45": "Fog",
  "48": "Icy Fog",
  "51": "Light Drizzle",
  "53": "Drizzle",
  "55": "Heavy Drizzle",
  "61": "Light Rain",
  "63": "Rain",
  "65": "Heavy Rain",
  "67": "Freezing Rain",
  "71": "Light Snow",
  "73": "Snow",
  "75": "Heavy Snow",
  "77": "Snow Grains",
  "80": "Rain Showers",
  "81": "Showers",
  "82": "Heavy Showers",
  "95": "Thunderstorm",
  "96": "Thunderstorm w/ Hail",
  "99": "Severe Thunderstorm",
};

export function wmoToCondition(code: number): string {
  return WMO_MAP[String(code)] ?? `Code ${code}`;
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherResult> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode,windspeed_10m,precipitation&temperature_unit=fahrenheit&wind_speed_unit=mph`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const data = await res.json();
  const c = data.current;
  return {
    temp_f: Math.round(c.temperature_2m),
    condition: wmoToCondition(c.weathercode),
    wind_mph: Math.round(c.windspeed_10m),
    precipitation_mm: c.precipitation,
    weathercode: c.weathercode,
  };
}
