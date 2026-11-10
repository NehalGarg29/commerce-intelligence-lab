import "server-only";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name}. Check .env.local`);
  return value;
}

const domain = requireEnv("SHOPIFY_STORE_DOMAIN");
const token = requireEnv("SHOPIFY_STOREFRONT_PRIVATE_TOKEN");
const version = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-10";

const endpoint = `https://${domain}/api/${version}/graphql.json`;

export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  // Caching is decided by the caller ("use cache" for slow-changing content,
  // nothing for live stock), so this function never caches on its own.
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Shopify-Storefront-Private-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(`Shopify error: ${JSON.stringify(json.errors ?? res.statusText)}`);
  }
  return json.data as T;
}
