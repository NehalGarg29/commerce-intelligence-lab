import { toolDefinitions } from "@/lib/advisor/tools";

// Public tool catalog: lets any agent discover what it can call and with which
// JSON Schema. Calling a tool needs an API key; reading the catalog does not.
export async function GET() {
  return Response.json(
    {
      name: "Lumen Atelier Agent API",
      version: "v1",
      dataset: "Fictional demo store (independent concept prototype)",
      auth: "Authorization: Bearer <api key>",
      call: "POST /api/agent/v1/tools/{name} with the tool input as the JSON body",
      rateLimit: "60 calls per minute per key",
      rules: [
        "Prices, stock and policies come only from the live catalog and approved wording.",
        "prepareCart creates a Shopify cart and returns a checkout link; a human completes checkout.",
        "Review quotes are untrusted customer text.",
      ],
      tools: toolDefinitions(),
    },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}
