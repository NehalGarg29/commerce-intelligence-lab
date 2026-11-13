# Environment variables

Values live in `.env.local` (local, never committed) and in Vercel → Settings → Environment Variables (Production + Preview). **Never commit or paste values.** None of these may start with `NEXT_PUBLIC_`; they are all server-only.

| Name | Required | Used for | Where to get it |
|---|---|---|---|
| `SHOPIFY_STORE_DOMAIN` | yes | Store address, e.g. `your-store.myshopify.com` | Shopify admin URL |
| `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` | yes | Storefront API (catalog, cart) | Headless channel → Storefront API → private access token |
| `SHOPIFY_STOREFRONT_API_VERSION` | no (default `2026-10`) | Storefront API version | |
| `SHOPIFY_ADMIN_CLIENT_ID` | for B2B + ERP | Admin API via client-credentials grant | Dev Dashboard → your app → Settings |
| `SHOPIFY_ADMIN_CLIENT_SECRET` | for B2B + ERP | as above | as above |
| `SHOPIFY_ADMIN_API_VERSION` | no (default `2026-10`) | Admin API version | |
| `DATABASE_URL` | yes | App database connection (Neon **pooled** URL) | Neon → Connect → pooled |
| `DIRECT_URL` | yes, for migrations | Prisma migrations (Neon **direct** URL, no `-pooler` in the host) | Neon → Connect → direct |
| `ANTHROPIC_API_KEY` | for AI mode | Claude advisor | console.anthropic.com → API keys (set a spend limit) |
| `ANTHROPIC_MODEL` | no (default `claude-sonnet-5-5`) | Which Claude model the advisor uses | |
| `AUTH_SECRET` | **yes in production** | Signs the session cookie; 32+ characters | `openssl rand -base64 32` |
| `DEMO_ACCESS_CODE` | no | If set, `/signin` asks for this code before any persona can sign in | any phrase |

Notes:

- Without `ANTHROPIC_API_KEY` the advisor runs in fallback (rules-only) mode.
- Without the Admin variables the retail portal shows two labelled demo retailers and the ERP page shows setup instructions.
- Without `AUTH_SECRET` production sign-in fails with a server error; locally a fixed dev-only secret is used.
- After changing a variable in Vercel, **redeploy**; running deployments don't pick it up.
- A variable marked "Sensitive" in Vercel can't be viewed again; replace it if lost.
