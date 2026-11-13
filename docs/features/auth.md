# Sign-in and roles

**Today (demo):** `/signin` lists personas: **Merchant team** and one buyer per Shopify B2B company location (read live from Shopify). Choosing one sets a signed session cookie.

- Cookie `lumen_session`: role (`merchant` | `retailer`), name, company + location id, expiry (8 h). HMAC-signed with `AUTH_SECRET`; httpOnly, SameSite=Lax, Secure in production.
- Optional `DEMO_ACCESS_CODE` adds a code field; compared in constant time.
- `src/proxy.ts` redirects signed-out visitors away from `/insights`, `/erp`, `/retail` and their APIs (optimistic only).
- Real checks happen on the server in `src/lib/auth/session.ts`: `requireMerchant`, `requireSignedIn`, `canViewRetailer` (merchants see every retailer; a buyer only their own location). Server actions re-check before doing anything.

| Role | Can open |
|---|---|
| Shopper (no sign-in) | Storefront, advisor, bundles, cart, compare, guides |
| Retail buyer | Their own portal, kits and orders |
| Merchant team | Insights, ERP sync, every retailer portal |

**Planned:** Shopify Customer Account API for shoppers, real B2B buyer login, staff login with an auth provider and team roles (Design, Marketing, Operations, Admin). See [roadmap.md](../roadmap.md).
