# Troubleshooting

Every error we actually hit, newest first. Add new ones here when you fix them.

| Symptom | Cause | Fix |
|---|---|---|
| Live site still shows old text after `git push` | Browser cache, or the deploy isn't finished | Wait for Vercel **Ready**, then Cmd + Shift + R |
| Live sign-in: "A server error occurred" | `AUTH_SECRET` missing in Vercel (required in production, 32+ chars) | `openssl rand -base64 32` → add to Vercel (Production + Preview) → redeploy |
| `Cannot read properties of undefined (reading 'findMany')` after adding a model | Prisma 7: `migrate dev` doesn't regenerate the client | `npx prisma generate`, restart `npm run dev` |
| Can't see a Vercel env var's value | It was saved as "Sensitive" | Remove and re-add it; redeploy |
| Dev Dashboard: "Can only contain letters, numbers, and . - _ /" | Spaces or dashes like "–" in the version name | Use e.g. `v3-erp-inventory-sync` |
| ERP page asks for Shopify inventory permissions | Missing `read_inventory`, `write_inventory`, `read_locations`, or old token cached | New app version with scopes → release → uninstall + reinstall → restart dev server |
| `access denied` / missing `write_draft_orders` when placing an order | Scope added but app not reinstalled | Uninstall and reinstall the app |
| `Query cost is 1817, which exceeds the single query max cost limit (1000)` | Nested B2B query too large | Fixed by fetching fixed prices in a separate query (`retailers.ts`) |
| `app_not_installed` from the token endpoint | App created but not installed on the store | Install it from the Dev Dashboard |
| "Email contains an invalid domain name" creating B2B contacts | `.test` domains are rejected | Use `@example.com` |
| Catalog: "no catalogs available" for a company | Catalog created for Markets | Markets → Catalogs → set type to **Company locations** |
| Company shows "Not approved" | No main contact | Add a customer as main contact |
| Production build fails on a deleted page | Stale `.next/types` | `rm -rf .next` then `npm run build` |
| `usePathname` / runtime data error during build | Client component using runtime data outside Suspense | Wrap it in `<Suspense>` (see `layout.tsx`) |
| Prisma seed can't find the client | Client not generated | `npx prisma generate` |
| Migrations fail or hang on Neon | `DIRECT_URL` uses the pooled host | Use the direct host (no `-pooler`) |
| Postgres SSL warning | Old `sslmode` value | Use `sslmode=verify-full` |
