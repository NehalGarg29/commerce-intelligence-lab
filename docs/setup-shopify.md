# Shopify setup

Everything here was done on a Shopify Plus **development store**. Steps are what worked for this project; Shopify's admin changes often, so check the current docs if a screen looks different.

## 1. Products and collections

- Products are fictional. Vendor = brand (`Afterglow`, `Velvet Theory`, `Pulse Lab`, `Afterglow Essentials`). Old vendor names `Lumen Atelier` / `Lumen Essentials` still work: the code maps them.
- Tags drive filters and guides (audience tags like `for-her`, `for-him`, `for-couples`, `for-lgbtq`; attributes like `beginner-friendly`, `quiet`; care tags).
- Collections used by "Shop by": including `lgbtq`.
- **Inventory tracking must be on** for each variant, or the ERP page shows "Not tracked".
- Alt text: Products → product → media → click the image → "Add alt text".

## 2. Storefront API (catalog, cart)

1. Install the **Headless** sales channel and create a storefront.
2. Copy the **private access token** to `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` and the store domain to `SHOPIFY_STORE_DOMAIN`.

## 3. Admin API app (B2B, draft orders, inventory)

Custom apps are created in the **Shopify Dev Dashboard** and use the **client credentials grant**: the server exchanges the Client ID and Secret for a 24-hour token (see `src/lib/b2b/admin.ts`).

1. Dev Dashboard → Create app.
2. **Versions → Create version**, with scopes:
   ```
   read_companies,read_products,write_draft_orders,read_inventory,write_inventory,read_locations
   ```
   - Version name may only contain letters, numbers and `. - _ /` (e.g. `v3-erp-inventory-sync`). No spaces.
3. **Release** the version.
4. **Install** it on the store. When scopes change: release a new version, then **uninstall and reinstall** the app so the new permissions are granted.
5. Settings → copy Client ID and Secret into `SHOPIFY_ADMIN_CLIENT_ID` / `SHOPIFY_ADMIN_CLIENT_SECRET`.
6. **Restart the dev server** (the access token is cached in memory).

In the store admin (Settings → Apps → the app), permissions are grouped by area: inventory falls under **Products**, draft orders under **Orders**, locations under **Other data**.

## 4. B2B companies (retail partners)

For each retailer:

1. Customers → Companies → Add company. Add a **location** (name + billing address).
2. Add a **customer as main contact**. Use a real-looking domain such as `@example.com`; `.test` emails are rejected.
3. Payment terms on the location, e.g. **Net 30**.
4. Catalog: Markets → **Catalogs** → create a catalog, set its type to **Company locations** (not Markets), assign the location, set a price adjustment (e.g. −40%) and optionally fixed prices.

A company without a main contact shows as "Not approved" and can't receive draft orders.

## 5. Discounts

- Build-your-ritual bundle uses discount code **`RITUAL10`**: create it under Discounts → Amount off products, 10%, minimum quantity 3. Until it exists, the bundle shows the saving but checkout won't apply it.

## Scopes and what uses them

| Scope | Used by |
|---|---|
| `read_companies` | Retail portal, sign-in personas |
| `read_products` | Price lists, catalogs |
| `write_draft_orders` | Placing wholesale orders; reading the ERP order feed |
| `read_inventory`, `write_inventory` | ERP sync: read stock, push stock |
| `read_locations` | ERP sync: which location stock belongs to |
