# Decisions

Short records of why things are the way they are. Add one when you make a choice someone might question later.

**Shopify is the source of truth.** Products, prices, stock, carts, B2B pricing and orders live only in Shopify; Postgres holds intelligence data linked by handle or Shopify id. This avoids two systems disagreeing about a price or a stock level.

**Fictional brand ("Afterglow", formerly "Lumen Atelier").** The demo must not use a real company's name, products or prices, or suggest it's official. Renamed to Afterglow for a name that relates to the category and is easy to say. Internal ids (`lumen_session`, `lumen-portal`, `lumen_sk_`) were kept because renaming them would sign users out, detach existing draft orders from the ERP feed and break issued API keys.

**AI answers are checked by code.** Claude chooses and explains; deterministic rules verify product existence, price, stock and compatibility before anything is shown. A rules-based fallback keeps the advisor working without AI.

**No storage of advisor conversations.** Questions in this category are intimate; only mode, tool names and latency are logged.

**Demo sign-in for now.** Personas with a signed cookie show role-based access without setting up identity providers. Server-side checks are real; only the identity is simulated. Real login is on the roadmap.

**Wholesale price comes from Shopify price lists.** The app never invents a wholesale price. Kits, tiers and freight are clearly labelled prototype incentives, sent as one draft-order discount.

**MSRP is a suggestion.** Retailers set their own retail prices; the portal shows margin at MSRP only.

**Simulated ERP, real Shopify writes.** The warehouse is a labelled simulation, but inventory pushes really update Shopify, using compare-and-swap and idempotency keys so concurrent sales are never overwritten.

**Admin API via client-credentials grant.** Since 2026, custom apps are created in the Dev Dashboard; the server exchanges Client ID + Secret for a short-lived token kept in memory.
