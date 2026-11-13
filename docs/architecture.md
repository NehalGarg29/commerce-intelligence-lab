# Architecture

One Next.js app serves four kinds of users. Shopify owns everything commercial; Postgres only holds the "intelligence" data. All secrets and third-party calls stay on the server.

```
 Shoppers ─────┐                                   ┌──► Shopify Plus
 Retailers ────┤      Next.js app on Vercel        │     Storefront API: catalog, cart, checkout
 Merchant team ┼──►  storefront · advisor · retail ├──►  Admin API: B2B companies, draft orders, inventory
 AI agents ────┘      portal · ERP sync · insights │
                      · agent API                  ├──► Postgres (Neon): reviews, events, advisor runs,
                                                   │     API key hashes, simulated ERP
                                                   └──► Claude API (server only)
```

## Who owns what

| Data | Owner | Notes |
|---|---|---|
| Products, variants, prices, stock | Shopify | Read live via Storefront API (catalog) and Admin API (inventory levels) |
| Carts, discounts, checkout | Shopify | Storefront cart API; checkout happens on Shopify |
| B2B companies, locations, catalogs, price lists, payment terms | Shopify | Admin API; wholesale price = Shopify price list |
| Wholesale orders | Shopify | Created as B2B **draft orders** tagged `lumen-portal`, `wholesale` |
| Reviews (fictional) | Postgres `Review` | Linked to Shopify by product handle |
| Analytics events | Postgres `Event` | Anonymous; random per-tab session id; no personal data |
| Advisor runs | Postgres `AdvisorRun` | Mode (AI or fallback), tool trace, latency. The shopper's question and the answer are **not** stored (those columns are written empty) |
| Agent API keys | Postgres `ApiKey` | SHA-256 hash only |
| Simulated warehouse (ERP) | Postgres `ErpStock`, `ErpSyncLog`, `ErpOrderExport` | Fictional; labelled in the UI |

## Folder map

```
src/
  app/                    routes (pages, route handlers, server actions in app/actions)
    actions/              server actions: auth, b2b, cart, erp
    api/                  advisor, events, agent/v1, erp/orders, retail/kit
  components/             UI by feature (advisor, b2b, erp, reviews, rituals, ...)
  lib/
    shopify.ts            Storefront API client
    catalog/              product model, filters, compatibility, Shopify provider
    cart.ts, bundle.ts    cart + build-your-ritual rules
    advisor/              Claude engine, tools, fallback, rules
    reviews/              review loading + theme analysis (pure)
    b2b/                  Admin API client, retailers, pricing, kits, orders
    erp/                  stock comparison (pure) + Shopify inventory + order feed
    analytics/            event tracking + insights maths (pure)
    auth/                 signed session cookie + role checks
    agent-api/            API key auth + rate limit
  proxy.ts                optimistic auth redirect (Next 16 "middleware")
  generated/prisma/       generated Prisma client (not committed)
prisma/                   schema, migrations, seeds
scripts/                  create-api-key
docs/                     this documentation
```

Files called "pure" (`compare.ts`, `analyze.ts`, `insights.ts`, `order.ts`, `pricing.ts`, `bundle.ts`) have no I/O, so they are shared by client and server and are the first candidates for unit tests.

## Request flow examples

**Shopper asks the advisor:** browser → `POST /api/advisor` (Zod validation, rate limit) → Claude with tools → tools read Shopify + reviews → Claude submits an answer → code re-checks every product, price, stock level and compatibility → answer shown. If Claude is unavailable, a rules-based fallback answers.

**Retailer places an order:** form → server action `placeWholesaleOrderAction` → checks the session may order for that location → recomputes the order from live Shopify prices → `draftOrderCreate` (Admin API) → staff approve it in Shopify.

**Merchant pushes stock:** ERP page → server action `pushToShopifyAction` → merchant check → re-reads Shopify stock → `inventorySetQuantities` with compare-and-swap (`changeFromQuantity`) and an idempotency key → logs to `ErpSyncLog`.

## Authentication today

Demo sign-in (`/signin`): choose a persona (Merchant team, or a buyer at a Shopify B2B company). The server sets an HMAC-signed, httpOnly cookie (`lumen_session`, 8 h) holding role, name and company location. Pages and actions check it with `requireMerchant`, `requireSignedIn` and `canViewRetailer`. Real login (Shopify customer accounts, B2B buyers, staff SSO) is planned; see [roadmap.md](roadmap.md).
