import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { adminConfigured, adminFetch } from "./admin";
import type { PriceAdjustment, PriceList } from "./pricing";

// Retail partners come from Shopify B2B: Companies -> Locations -> Catalogs -> Price lists.
// Until the Admin app is connected (or no companies exist yet), two clearly
// labelled demo retailers are used so the portal can still be shown.

export type Retailer = {
  id: string; // numeric part of the Shopify CompanyLocation id (or "demo-...")
  company: string;
  location: string;
  city: string | null;
  paymentTerms: string | null;
  catalog: string | null;
  priceList: PriceList;
  source: "shopify" | "demo";
};

type AdminCompanies = {
  companies: {
    nodes: {
      name: string;
      locations: {
        nodes: {
          id: string;
          name: string;
          billingAddress: { city: string | null } | null;
          buyerExperienceConfiguration: { paymentTermsTemplate: { name: string } | null } | null;
          catalogs: {
            nodes: {
              title: string;
              priceList: {
                id: string;
                currency: string;
                fixedPricesCount: number;
                parent: { adjustment: PriceAdjustment | null } | null;
              } | null;
            }[];
          };
        }[];
      };
    }[];
  };
};

// Kept small to stay under Shopify's per-query cost limit (1000). Fixed prices
// are fetched separately, and only for price lists that actually have some.
const QUERY = `query RetailPartners {
  companies(first: 10) {
    nodes {
      name
      locations(first: 5) {
        nodes {
          id
          name
          billingAddress { city }
          buyerExperienceConfiguration { paymentTermsTemplate { name } }
          catalogs(first: 3) {
            nodes {
              title
              priceList {
                id
                currency
                fixedPricesCount
                parent { adjustment { type value } }
              }
            }
          }
        }
      }
    }
  }
}`;

export const DEMO_RETAILERS: Retailer[] = [
  {
    id: "demo-harbor-vine",
    company: "Harbor & Vine Boutique",
    location: "Main store",
    city: "Santa Monica",
    paymentTerms: "Net 30",
    catalog: "Wholesale Standard (demo)",
    priceList: { currency: "USD", adjustment: { type: "PERCENTAGE_DECREASE", value: 40 }, fixedPrices: {} },
    source: "demo",
  },
  {
    id: "demo-wellness-co",
    company: "Northside Wellness Co.",
    location: "Flagship",
    city: "Chicago",
    paymentTerms: "Net 60",
    catalog: "Wholesale Volume (demo)",
    priceList: { currency: "USD", adjustment: { type: "PERCENTAGE_DECREASE", value: 45 }, fixedPrices: {} },
    source: "demo",
  },
];

const FIXED_PRICES = `query FixedPrices($id: ID!) {
  priceList(id: $id) {
    prices(first: 100, originType: FIXED) { nodes { price { amount } variant { id } } }
  }
}`;

async function fixedPrices(priceListId: string): Promise<Record<string, number>> {
  const data = await adminFetch<{ priceList: { prices: { nodes: { price: { amount: string }; variant: { id: string } }[] } } | null }>(
    FIXED_PRICES,
    { id: priceListId }
  );
  return Object.fromEntries((data.priceList?.prices.nodes ?? []).map((p) => [p.variant.id, Number(p.price.amount)]));
}

async function loadShopifyRetailers(): Promise<Retailer[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("b2b-retailers");
  const data = await adminFetch<AdminCompanies>(QUERY);

  // Second, small query per price list, only where fixed prices exist.
  const listIds = new Set(
    data.companies.nodes.flatMap((c) =>
      c.locations.nodes.flatMap((l) => l.catalogs.nodes.flatMap((k) => (k.priceList && k.priceList.fixedPricesCount > 0 ? [k.priceList.id] : [])))
    )
  );
  const fixedById = Object.fromEntries(await Promise.all([...listIds].map(async (id) => [id, await fixedPrices(id)] as const)));

  return data.companies.nodes.flatMap((c) =>
    c.locations.nodes.map((l) => {
      // A location can have several catalogs; take the first one that carries a price list.
      const catalog = l.catalogs.nodes.find((x) => x.priceList) ?? l.catalogs.nodes[0];
      const pl = catalog?.priceList;
      return {
        id: l.id.split("/").pop() ?? l.id,
        company: c.name,
        location: l.name,
        city: l.billingAddress?.city ?? null,
        paymentTerms: l.buyerExperienceConfiguration?.paymentTermsTemplate?.name ?? null,
        catalog: catalog?.title ?? null,
        priceList: {
          currency: pl?.currency ?? "USD",
          adjustment: pl?.parent?.adjustment ?? null,
          fixedPrices: pl ? (fixedById[pl.id] ?? {}) : {},
        },
        source: "shopify" as const,
      };
    })
  );
}

export async function listRetailers(): Promise<{ retailers: Retailer[]; source: "shopify" | "demo"; error?: string }> {
  if (!adminConfigured) return { retailers: DEMO_RETAILERS, source: "demo" };
  try {
    const retailers = await loadShopifyRetailers();
    return retailers.length ? { retailers, source: "shopify" } : { retailers: DEMO_RETAILERS, source: "demo", error: "No B2B companies found in Shopify yet." };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[b2b] Shopify companies unavailable:", message);
    // In local development, show the real reason on the page to make setup easy.
    const detail = process.env.NODE_ENV === "development" ? ` (${message.slice(0, 400)})` : "";
    return { retailers: DEMO_RETAILERS, source: "demo", error: `Couldn't reach Shopify B2B, showing demo retailers.${detail}` };
  }
}

export async function getRetailer(id: string): Promise<Retailer | null> {
  if (!/^(demo-[a-z-]+|\d{1,20})$/.test(id)) return null;
  return (await listRetailers()).retailers.find((r) => r.id === id) ?? null;
}
