# DISPATCH — Uber Eats Intelligence

A personal dispatch intelligence system for Uber Eats drivers in the Conejo Valley / Simi Valley area. Tells you exactly **when to go out, where to position, and why**, based on real data.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Railway Postgres** via `pg` (raw queries)
- **OpenAI GPT-4o** — dispatch brain
- **OSRM** — free routing/mileage (no API key)
- **Open-Meteo** — free weather (no API key)
- **Tailwind CSS v3** — dark radar aesthetic

## Setup

1. Copy `.env.local.example` → `.env.local` and fill in values:
   ```
   DATABASE_URL=postgresql://...   # Railway provides this
   OPENAI_API_KEY=sk-...
   DRIVER_HOME_LAT=34.2856
   DRIVER_HOME_LNG=-118.8820
   KIA_MPG=32
   GAS_PRICE_PER_GALLON=4.89
   ```

2. Run the database migration (creates tables + seeds zones):
   ```bash
   npm run migrate
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

## Pages

- `/` — **Dashboard**: Dispatch panel, metric cards, earnings heatmap, zone bars, recent shifts
- `/log` — **Log a Shift**: Form with auto OSRM mileage estimate + live gas/net preview
- `/history` — **Shift Archive**: Full table with all metrics

## Deploy (Railway)

Push to Railway — `railway.json` is pre-configured. Set all env vars in Railway dashboard. Run migrate via Railway shell after first deploy.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
