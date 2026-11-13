# ERP sync

**What:** compares a **simulated** warehouse (the "ERP") with Shopify stock, flags oversell risk and hidden stock, pushes corrections to Shopify, and exports retailer orders in an ERP-ready format. Merchant team only.

**Concepts**
- ERP sellable = on hand − reserved (for retailer orders not yet shipped).
- Oversell risk: Shopify shows more than the warehouse can sell. Hidden stock: the reverse.
- Sending a B2B order to the ERP reserves its units, which makes Shopify oversold until the next push: one warehouse, two channels.

**How a push works:** `pushToShopifyAction` (merchant check) → re-reads Shopify stock → skips rows that changed since the page loaded → `inventorySetQuantities` with `changeFromQuantity` (compare-and-swap) and an `@idempotent` key → writes `ErpSyncLog`.

**Code:** `src/lib/erp/compare.ts` (pure: comparison, summary, demo drift, CSV/JSON feed), `src/lib/erp/index.ts` (Shopify inventory + draft-order feed, first-visit seeding), `app/actions/erp.ts` (push, simulate warehouse activity, send order to ERP, reset), `app/erp/page.tsx`, `components/erp/`, `api/erp/orders?format=csv|json`.

**Database:** `ErpStock`, `ErpSyncLog`, `ErpOrderExport`.

**Test it:** `/erp` → Reset demo → Push to Shopify → Simulate warehouse activity → Send to ERP on a portal order → Push again → download CSV/JSON.

**Needs:** Admin scopes `read_inventory`, `write_inventory`, `read_locations`, `write_draft_orders`.

**In production:** the warehouse tables are replaced by SAP/NetSuite/Dynamics through middleware (MuleSoft, Celigo); stock syncs on a schedule and on ERP events; orders flow via Shopify webhooks into ERP sales orders.
