# Storefront, guides, reviews, compare

**What:** a headless storefront on live Shopify data. Shop by audience (For her, For him, Couples, LGBTQ+) and brand, filters and sorting (including "best reviewed"), product pages with how-to guides, care steps and review themes, side-by-side compare.

**Code**
- Catalog: `src/lib/catalog/` (`shopify-provider.ts` reads Shopify and maps old vendor names; `filters.ts` audiences, brands, sorting; `compatibility.ts` lubricant pairing).
- Guides: `src/lib/guides.ts` (22 guides, product type → guide, care steps from tags), pages under `src/app/guides/`, component `components/guides/how-to-use.tsx`.
- Reviews: `src/lib/reviews/analyze.ts` (pure: themes, per-sentence tone, praised ≥ 70% positive, criticised ≥ 60% negative), `src/lib/reviews/index.ts` (cached loading). Product ratings are attached in `catalog/index.ts`.
- Compare: `src/lib/compare-store.ts` (browser storage), `src/app/compare/`.

**Test it:** open `/shop`, filter by audience, open a product, check the guide, review themes and "Compare".

**Limits:** reviews are fictional demo data (`isDemo = true`). Review text is treated as untrusted; two seeded reviews try prompt injection and must be ignored.
