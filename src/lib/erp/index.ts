import "server-only";
import { adminConfigured, adminFetch } from "@/lib/b2b/admin";
import { db } from "@/lib/db";
import { compareStock, seedDrift, type FeedOrder, type ShopifyStockRow } from "./compare";

// Server side of the ERP sync page.
//  - Shopify stock comes from the Admin API (read_inventory).
//  - "ERP" stock comes from the mock warehouse tables in Postgres.
//  - B2B orders come from Shopify draft orders tagged by the retail portal.

export const ERP_SCOPES = "read_inventory, write_inventory, read_locations";

type VariantsResponse = {
  productVariants: {
    nodes: {
      id: string;
      sku: string | null;
      title: string;
      product: { handle: string; title: string; status: string };
      inventoryItem: {
        id: string;
        tracked: boolean;
        inventoryLevels: { nodes: { location: { id: string; name: string }; quantities: { name: string; quantity: number }[] }[] };
      } | null;
    }[];
  };
};

// One location is enough for the demo store. A multi-warehouse setup would
// compare per location instead.
const VARIANTS_QUERY = `query ErpStock {
  productVariants(first: 100) {
    nodes {
      id
      sku
      title
      product { handle title status }
      inventoryItem {
        id
        tracked
        inventoryLevels(first: 1) {
          nodes {
            location { id name }
            quantities(names: ["available"]) { name quantity }
          }
        }
      }
    }
  }
}`;

export async function getShopifyStock(): Promise<ShopifyStockRow[]> {
  const data = await adminFetch<VariantsResponse>(VARIANTS_QUERY);
  return data.productVariants.nodes
    .filter((v) => v.product.status === "ACTIVE" && v.inventoryItem)
    .map((v) => {
      const level = v.inventoryItem!.inventoryLevels.nodes[0];
      const qty = level?.quantities.find((q) => q.name === "available")?.quantity;
      return {
        variantId: v.id,
        inventoryItemId: v.inventoryItem!.id,
        locationId: level?.location.id ?? null,
        locationName: level?.location.name ?? null,
        productHandle: v.product.handle,
        title: v.title === "Default Title" ? v.product.title : `${v.product.title} · ${v.title}`,
        sku: v.sku || v.product.handle.toUpperCase().slice(0, 24),
        tracked: v.inventoryItem!.tracked,
        available: typeof qty === "number" ? qty : null,
      };
    });
}

// First visit: create a warehouse record for every Shopify SKU, starting from
// Shopify's number plus a deterministic drift, so the demo always has something to fix.
async function ensureErpRows(shopify: ShopifyStockRow[]) {
  const existing = new Set((await db.erpStock.findMany({ select: { variantId: true } })).map((r) => r.variantId));
  const missing = shopify.filter((s) => !existing.has(s.variantId));
  if (!missing.length) return;
  const now = Date.now();
  await db.erpStock.createMany({
    data: missing.map((s) => {
      const d = seedDrift(s.variantId);
      const base = s.tracked && s.available !== null ? Math.max(0, s.available) : 20;
      const available = Math.max(0, base + d.offset);
      return {
        variantId: s.variantId,
        sku: s.sku,
        productHandle: s.productHandle,
        title: s.title,
        onHand: available + d.allocated,
        allocated: d.allocated,
        incoming: d.incoming,
        incomingEta: d.incoming ? new Date(now + d.etaDays * 86_400_000) : null,
      };
    }),
    skipDuplicates: true,
  });
}

export type ErpState =
  | { ok: true; rows: ReturnType<typeof compareStock> }
  | { ok: false; reason: "not_configured" | "missing_scope" | "error"; message: string };

export async function loadStockComparison(): Promise<ErpState> {
  if (!adminConfigured) return { ok: false, reason: "not_configured", message: "The Shopify Admin app isn't connected." };
  let shopify: ShopifyStockRow[];
  try {
    shopify = await getShopifyStock();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[erp] stock read failed:", msg);
    if (/access denied|scope|read_inventory|read_locations/i.test(msg)) {
      return { ok: false, reason: "missing_scope", message: `The Shopify app needs these permissions: ${ERP_SCOPES}.` };
    }
    return { ok: false, reason: "error", message: "Couldn't read stock from Shopify." };
  }
  await ensureErpRows(shopify);
  const erp = await db.erpStock.findMany();
  return { ok: true, rows: compareStock(shopify, erp) };
}

// ---------------------------------------------------------------------------
// B2B order feed

type DraftOrdersResponse = {
  draftOrders: {
    nodes: {
      id: string;
      name: string;
      createdAt: string;
      status: string;
      poNumber: string | null;
      totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
      paymentTerms: { paymentTermsName: string } | null;
      purchasingEntity: { __typename: string; company?: { name: string }; location?: { name: string } } | null;
      lineItems: {
        nodes: { title: string; sku: string | null; quantity: number; variant: { id: string } | null; discountedTotalSet: { shopMoney: { amount: string } } }[];
      };
    }[];
  };
};

const ORDERS_QUERY = `query ErpOrderFeed {
  draftOrders(first: 20, query: "tag:lumen-portal", sortKey: UPDATED_AT, reverse: true) {
    nodes {
      id
      name
      createdAt
      status
      poNumber
      totalPriceSet { shopMoney { amount currencyCode } }
      paymentTerms { paymentTermsName }
      purchasingEntity {
        __typename
        ... on PurchasingCompany { company { name } location { name } }
      }
      lineItems(first: 20) {
        nodes { title sku quantity variant { id } discountedTotalSet { shopMoney { amount } } }
      }
    }
  }
}`;

export async function loadOrderFeed(): Promise<{ ok: true; orders: FeedOrder[] } | { ok: false; message: string }> {
  if (!adminConfigured) return { ok: false, message: "The Shopify Admin app isn't connected." };
  try {
    const [data, exports] = await Promise.all([adminFetch<DraftOrdersResponse>(ORDERS_QUERY), db.erpOrderExport.findMany()]);
    const sent = new Map(exports.map((e) => [e.draftOrderId, e.exportedAt.toISOString()]));
    return {
      ok: true,
      orders: data.draftOrders.nodes.map((o) => ({
        id: o.id,
        name: o.name,
        createdAt: o.createdAt,
        shopifyStatus: o.status,
        poNumber: o.poNumber,
        company: o.purchasingEntity?.company?.name ?? null,
        location: o.purchasingEntity?.location?.name ?? null,
        paymentTerms: o.paymentTerms?.paymentTermsName ?? null,
        currency: o.totalPriceSet.shopMoney.currencyCode,
        total: Number(o.totalPriceSet.shopMoney.amount),
        lines: o.lineItems.nodes.map((l) => ({
          variantId: l.variant?.id ?? null,
          sku: l.sku,
          title: l.title,
          quantity: l.quantity,
          lineTotal: Number(l.discountedTotalSet.shopMoney.amount),
        })),
        exportedAt: sent.get(o.id) ?? null,
      })),
    };
  } catch (err) {
    console.error("[erp] order feed failed:", err instanceof Error ? err.message : err);
    return { ok: false, message: "Couldn't load B2B orders from Shopify." };
  }
}

export async function recentSyncLog(limit = 12) {
  return db.erpSyncLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}
