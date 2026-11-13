# Build-your-ritual bundles

**What:** shoppers pick 3 compatible items (e.g. a toy, a glide, a care item) and get 10% off with code `RITUAL10`. Incompatible combinations (e.g. silicone glide with a silicone toy) are greyed out.

**Code:** `src/lib/bundle.ts` (pure: slots, compatibility, validation, totals; `BUNDLE_DISCOUNT_PCT = 10`, `BUNDLE_CODE = "RITUAL10"`), `components/rituals/bundle-builder.tsx`, `app/rituals/build/page.tsx`, server action `addBundleAction` in `app/actions/cart.ts` (re-validates on the server, adds lines with a bundle attribute, applies the code via `cartDiscountCodesUpdate`). The cart page shows a "Ritual bundle" badge and the discount line.

**Test it:** `/rituals/build` → choose three items → Add → cart shows the bundle badge.

**Limits:** the discount only applies at checkout once `RITUAL10` exists in Shopify (see [setup-shopify.md](../setup-shopify.md)).
