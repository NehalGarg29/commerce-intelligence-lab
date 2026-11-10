import { shopifyCatalog } from "@/lib/catalog/shopify-provider";

export default async function TestShopifyPage() {
  const products = await shopifyCatalog.listProducts();

  return (
    <main className="p-8">
      <h1 className="text-2xl mb-4">{products.length} products</h1>
      <ul className="space-y-3">
        {products.map((p) => (
          <li key={p.id}>
            <strong>{p.title}</strong> · {p.brand} · ${p.priceMin}
            {p.priceMax !== p.priceMin && `–$${p.priceMax}`}
            {!p.available && " · OUT OF STOCK"}
            <div className="text-sm text-gray-600">
              {p.variants
                .map((v) => `${v.title}: ${v.quantity ?? "?"}${v.available ? "" : " (unavailable)"}`)
                .join(" · ")}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}