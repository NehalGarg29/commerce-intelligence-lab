import "server-only";

// Read-only Shopify Admin API access for the B2B portal.
// Since Jan 2026, custom apps are created in the Shopify Dev Dashboard and
// exchange their Client ID + Secret for a short-lived token ("client
// credentials grant"). We fetch that token on the server and keep it in memory
// until shortly before it expires. Nothing here is ever sent to the browser.

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const clientId = process.env.SHOPIFY_ADMIN_CLIENT_ID;
const clientSecret = process.env.SHOPIFY_ADMIN_CLIENT_SECRET;
const version = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2026-10";

export const adminConfigured = Boolean(domain && clientId && clientSecret);

let cached: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt) return cached.token;
  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId!, client_secret: clientSecret! }),
  });
  if (!res.ok) {
    // Shopify explains token failures in the body (e.g. app not installed); it never contains secrets.
    const body = await res.text();
    const detail = body.match(/<title>([^<]+)<\/title>/)?.[1] ?? body.slice(0, 200); // HTML error page -> its title
    throw new Error(`Shopify admin token request failed (${res.status}): ${detail}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in?: number };
  // Refresh a few minutes early.
  cached = { token: json.access_token, expiresAt: Date.now() + Math.max(60, (json.expires_in ?? 3600) - 300) * 1000 };
  return cached.token;
}

export async function adminFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  if (!adminConfigured) throw new Error("Shopify Admin API is not configured");
  const res = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": await accessToken() },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`Shopify admin error: ${JSON.stringify(json.errors ?? res.statusText)}`);
  return json.data as T;
}
