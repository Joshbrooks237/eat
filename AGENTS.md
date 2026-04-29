# DISPATCH — Agent & Operations Notes

## What this app does

Tells a solo Uber Eats driver in the Conejo Valley whether to start the car.
That's it. That's the whole mission. Don't overthink it.

## AI behavior (dispatch endpoint)

- Model: GPT-4o
- System prompt: terse dispatch operator, no fluff
- Response: strict JSON { verdict, confidence, reason, suggested_zone, best_position, watch_for, estimated_hourly }
- Context injected: weather, last 90 days of matching shifts, zone cluster score

## Zones

| Zone             | Lat       | Lng        |
|------------------|-----------|------------|
| Thousand Oaks    | 34.1706   | -118.8376  |
| Simi Valley      | 34.2694   | -118.7815  |
| Moorpark         | 34.2856   | -118.8820  |
| Westlake Village | 34.1453   | -118.8192  |
| Camarillo        | 34.2164   | -119.0376  |
| Agoura Hills     | 34.1531   | -118.7617  |

## External APIs (no keys required)

- Weather: `api.open-meteo.com` — 5 min cache via Next.js `revalidate`
- Routing: `router.project-osrm.org` — OSRM public instance, coords are lng,lat

## Gas math

```
gas_cost = (miles_driven / KIA_MPG) * GAS_PRICE_PER_GALLON
net_earnings = gross_earnings - gas_cost
```

Set `KIA_MPG` and `GAS_PRICE_PER_GALLON` in env to keep it accurate.

## Running locally

```bash
cp .env.local.example .env.local
# fill in DATABASE_URL + OPENAI_API_KEY
npm run migrate
npm run dev
```

## Deploying to Railway

1. Connect repo in Railway dashboard
2. Set all env vars (DATABASE_URL auto-provided by Railway Postgres)
3. First deploy: run `npm run migrate` from Railway shell
4. `railway.json` handles the rest
