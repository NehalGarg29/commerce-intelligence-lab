// Pure comparison logic for the ERP sync page: no I/O, shared by the page,
// the server actions and the export route, and easy to unit-test.

export type ShopifyStockRow = {
  variantId: string;
  inventoryItemId: string;
  locationId: string | null;
  locationName: string | null;
  productHandle: string;
  title: string; // product title, plus variant title when it isn't "Default Title"
  sku: string;
  tracked: boolean;
  available: number | null; // Shopify "available" at the location (null = untracked / no level)
};

export type ErpStockRow = {
  variantId: string;
  onHand: number;
  allocated: number;
  incoming: number;
  incomingEta: Date | null;
};

export type SyncStatus = "in_sync" | "oversell" | "hidden_stock" | "untracked" | "missing_in_erp";

export type SyncRow = ShopifyStockRow & {
  erp: ErpStockRow | null;
  erpAvailable: number | null; // what the warehouse can actually sell: on hand - allocated
  diff: number | null; // shopify - erp; > 0 means Shopify promises stock that doesn't exist
  status: SyncStatus;
};

export const STATUS_META: Record<SyncStatus, { label: string; tone: "good" | "critical" | "warning" | "neutral"; help: string }> = {
  in_sync: { label: "In sync", tone: "good", help: "Shopify matches what the warehouse can sell." },
  oversell: { label: "Oversell risk", tone: "critical", help: "Shopify shows more than the warehouse has. Orders may be cancelled." },
  hidden_stock: { label: "Hidden stock", tone: "warning", help: "The warehouse has stock that Shopify isn't selling." },
  untracked: { label: "Not tracked", tone: "neutral", help: "Inventory tracking is off for this variant in Shopify." },
  missing_in_erp: { label: "Not in ERP", tone: "neutral", help: "No warehouse record for this SKU yet." },
};

export const erpAvailable = (e: Pick<ErpStockRow, "onHand" | "allocated">) => Math.max(0, e.onHand - e.allocated);

export function compareStock(shopify: ShopifyStockRow[], erp: ErpStockRow[]): SyncRow[] {
  const byId = new Map(erp.map((e) => [e.variantId, e]));
  const rows = shopify.map((s): SyncRow => {
    const e = byId.get(s.variantId) ?? null;
    if (!s.tracked || s.available === null || !s.locationId) {
      return { ...s, erp: e, erpAvailable: e ? erpAvailable(e) : null, diff: null, status: "untracked" };
    }
    if (!e) return { ...s, erp: null, erpAvailable: null, diff: null, status: "missing_in_erp" };
    const avail = erpAvailable(e);
    const diff = s.available - avail;
    return { ...s, erp: e, erpAvailable: avail, diff, status: diff === 0 ? "in_sync" : diff > 0 ? "oversell" : "hidden_stock" };
  });
  // Problems first (biggest oversell at the top), then hidden stock, then the rest.
  const rank: Record<SyncStatus, number> = { oversell: 0, hidden_stock: 1, missing_in_erp: 2, in_sync: 3, untracked: 4 };
  return rows.sort((a, b) => rank[a.status] - rank[b.status] || Math.abs(b.diff ?? 0) - Math.abs(a.diff ?? 0) || a.title.localeCompare(b.title));
}

export function summarize(rows: SyncRow[]) {
  const count = (s: SyncStatus) => rows.filter((r) => r.status === s).length;
  return {
    total: rows.length,
    inSync: count("in_sync"),
    oversell: count("oversell"),
    hidden: count("hidden_stock"),
    untracked: count("untracked") + count("missing_in_erp"),
    unitsAtRisk: rows.reduce((n, r) => n + (r.status === "oversell" ? r.diff ?? 0 : 0), 0),
    unitsHidden: rows.reduce((n, r) => n + (r.status === "hidden_stock" ? -(r.diff ?? 0) : 0), 0),
  };
}

// Deterministic starting drift for the demo, so a fresh database always shows a
// realistic mix: most SKUs in sync, a few oversell risks, a few hidden-stock rows.
export function seedDrift(key: string) {
  let h = 2166136261;
  for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  // ~80% in sync, ~10% oversell (negative), ~10% hidden stock (positive).
  const offsets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -3, -2, 4, 6];
  const offset = offsets[h % offsets.length];
  const allocated = (h >>> 4) % 4; // 0-3 units reserved for retailer orders
  const incoming = (h >>> 8) % 6 === 0 ? 24 + ((h >>> 12) % 3) * 12 : 0; // ~1 in 6 SKUs has a factory PO open
  const etaDays = 5 + ((h >>> 16) % 20);
  return { offset, allocated, incoming, etaDays };
}

// ---------------------------------------------------------------------------
// Order feed: Shopify B2B draft order -> the flat shape an ERP import expects.

export type FeedOrder = {
  id: string;
  name: string;
  createdAt: string;
  shopifyStatus: string;
  poNumber: string | null;
  company: string | null;
  location: string | null;
  paymentTerms: string | null;
  currency: string;
  total: number;
  lines: { variantId: string | null; sku: string | null; title: string; quantity: number; lineTotal: number }[];
  exportedAt: string | null;
};

export function feedToCsv(orders: FeedOrder[]): string {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    // Quote everything that needs it and neutralise spreadsheet formula injection.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const header = ["order", "po_number", "company", "location", "payment_terms", "sku", "item", "quantity", "line_total", "currency", "erp_status"];
  const rows = orders.flatMap((o) =>
    o.lines.map((l) => [o.name, o.poNumber, o.company, o.location, o.paymentTerms, l.sku, l.title, l.quantity, l.lineTotal.toFixed(2), o.currency, o.exportedAt ? "sent" : "new"])
  );
  return [header, ...rows].map((r) => r.map(esc).join(",")).join("\n") + "\n";
}

// The JSON an ERP connector (MuleSoft, Celigo...) would map into a sales order.
export function feedToErpJson(orders: FeedOrder[]) {
  return orders.map((o) => ({
    externalId: o.id,
    orderNumber: o.name,
    customerPo: o.poNumber,
    customer: { company: o.company, shipTo: o.location },
    terms: o.paymentTerms,
    currency: o.currency,
    total: o.total,
    lines: o.lines.map((l, i) => ({ line: i + 1, sku: l.sku, description: l.title, quantity: l.quantity, amount: l.lineTotal })),
    status: o.exportedAt ? "sent" : "new",
  }));
}
