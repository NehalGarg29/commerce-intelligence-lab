# Retail partner portal (B2B)

**What:** retailers sign in and order wholesale. Prices, payment terms and catalogs come from Shopify B2B. The portal helps them order more: shelf kits, volume tiers, a free-freight threshold, and a suggested assortment based on shopper demand.

**Rules (prototype)**
- Wholesale price = the location's Shopify price list (percentage adjustment and/or fixed prices).
- Kits (`src/lib/b2b/kits.ts`): Beginner shelf 5%, Couples gifting 5%, LGBTQ+ shelf 7%.
- Volume tiers (`program.ts`): Silver from $1,000 (+3%), Gold from $2,500 (+6%). Free freight from $500, otherwise $35.
- MSRP is shown as a **suggestion** with "margin at MSRP"; retailers set their own prices.
- Kits, tiers and freight are **prototype rules applied as one order-level discount** on the draft order, not native Shopify features.

**How an order works:** `order-builder.tsx` (client) → `placeWholesaleOrderAction` (server): checks the session may order for this location, recomputes everything from live Shopify prices (`computeOrder`), then `draftOrderCreate` with the company, location, contact, PO number, freight, discount and tags `lumen-portal`, `wholesale`. Staff review and complete the draft order in Shopify.

**Code:** `src/lib/b2b/` (`admin.ts` token + client, `retailers.ts`, `pricing.ts`, `demand.ts`, `recommend.ts`, `kit.ts`, `kits.ts`, `order.ts`, `program.ts`), `app/actions/b2b.ts`, `components/b2b/`, `app/retail/`, marketing kit `app/retail/kit/[handle]` + `api/retail/kit/[handle]`.

**Test it:** sign in as a retail buyer → your portal → add a kit → enter a PO number → Place order → check Shopify → Orders → Drafts.

**Limits:** demo sign-in instead of real B2B buyer login. Without the Admin app, two labelled demo retailers are shown and ordering is disabled.
