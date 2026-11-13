# Afterglow

A headless commerce prototype for an adult-wellness brand that sells **direct to consumers** and **through retail partners**, with an AI layer on top of Shopify.

> **Independent concept prototype.** Afterglow and its sub-brands (Velvet Theory, Pulse Lab, Afterglow Essentials) are fictional. All products, prices, reviews and demo traffic are fictional demo data. Not affiliated with any real brand.

Live demo: https://commerce-intelligence-lab.vercel.app

## What it does

| For | Feature | Where |
|---|---|---|
| Shoppers | Headless storefront on live Shopify data, how-to guides, review themes, compare | `/`, `/shop`, `/products/[handle]`, `/guides`, `/compare` |
| Shoppers | Build-your-ritual bundles (3 compatible items, 10% off) | `/rituals/build` |
| Shoppers | AI shopping advisor (Claude + tools + hard rules), site-wide chat widget | chat bubble, `/advisor` |
| Retailers | Retail partner portal: contract prices from Shopify B2B, kits, volume tiers, freight, wholesale draft orders | `/retail`, `/retail/[id]` |
| Merchant team | ERP sync: simulated warehouse vs Shopify stock, push to Shopify, B2B order export | `/erp` |
| Merchant team | Insights: funnel, advisor lift, where add-to-bag happens | `/insights` |
| AI agents | Keyed Agent API exposing the advisor's tools | `/agents`, `/api/agent/v1/tools` |

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 7 + Neon Postgres · Anthropic SDK (Claude) · Shopify Storefront + Admin GraphQL APIs (2026-10) · Vercel.

## Quick start

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env.local  # or create .env.local by hand; see docs/environment.md
npx prisma migrate dev      # create tables in your database
npx prisma generate         # Prisma 7: migrate does NOT regenerate the client
npm run db:seed             # demo reviews
npm run db:seed-events      # optional: 14 days of demo analytics events
npm run dev                 # http://localhost:3000
```

Sign in at `/signin` with a demo persona (Merchant team or a retail buyer). No password locally.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server / production build / serve the build |
| `npm run lint` | ESLint |
| `npm run db:migrate` | `prisma migrate dev` (then run `npx prisma generate`) |
| `npm run db:seed` | Seed fictional reviews (including two prompt-injection test reviews) |
| `npm run db:seed-events` | Seed 14 days of demo analytics events (tagged `metadata.demo = true`) |
| `npm run db:studio` | Browse the database |
| `npm run api-key -- "Name"` | Create an Agent API key (printed once; only a hash is stored) |

## Deploy

Push to `main`; Vercel builds and deploys automatically. Production needs the environment variables in [docs/environment.md](docs/environment.md), including `AUTH_SECRET`. Database migrations are run from a laptop against the same Neon database.

## Documentation

| Doc | Read it when |
|---|---|
| [docs/architecture.md](docs/architecture.md) | You want the big picture: who owns which data, how a request flows |
| [docs/setup-shopify.md](docs/setup-shopify.md) | Setting up or changing the Shopify store and app |
| [docs/environment.md](docs/environment.md) | Adding or checking environment variables |
| [docs/features/](docs/features/) | Working on a specific feature |
| [docs/troubleshooting.md](docs/troubleshooting.md) | Something broke |
| [docs/decisions.md](docs/decisions.md) | You wonder why something is built the way it is |
| [docs/roadmap.md](docs/roadmap.md) | What's done and what's next |
