# Agent API

**What:** lets external AI agents use the same seven tools as the advisor over REST, with API keys.

- `GET /api/agent/v1/tools`: public list of tools and their JSON schemas.
- `POST /api/agent/v1/tools/{tool}`: run a tool. Header `Authorization: Bearer lumen_sk_...`. `prepareCart` returns a real Shopify `checkoutUrl`; checkout stays on Shopify.
- 60 calls/min per key. Calls are logged as `agent_api_call` events.

**Keys:** `npm run api-key -- "Name"` prints a key once; only its SHA-256 hash is stored (`ApiKey`). Revoke by setting `revokedAt`.

**Code:** `src/lib/agent-api/auth.ts`, `app/api/agent/v1/`, explorer UI `app/agents/page.tsx` + `components/agents/api-explorer.tsx` (key kept in memory only).
