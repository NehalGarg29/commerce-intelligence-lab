"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { adminFetch } from "@/lib/b2b/admin";
import { db } from "@/lib/db";
import { erpAvailable } from "@/lib/erp/compare";
import { getShopifyStock, loadOrderFeed } from "@/lib/erp";

// ERP sync actions. Merchant-only, and every number written to Shopify is
// recomputed on the server from the warehouse table. The browser only says
// which SKUs to fix and what Shopify quantity it was looking at.

export type ErpActionState = { status: "idle" | "done" | "error"; message: string };

const VARIANT_ID = /^gid:\/\/shopify\/ProductVariant\/\d+$/;
const DRAFT_ORDER_ID = /^gid:\/\/shopify\/DraftOrder\/\d+$/;

async function merchant() {
  const s = await getSession();
  return s?.role === "merchant" ? s : null;
}

const PushPayload = z.array(z.object({ variantId: z.string().regex(VARIANT_ID), seen: z.number().int().min(-100000).max(100000) })).min(1).max(100);

type SetQuantities = {
  inventorySetQuantities: {
    inventoryAdjustmentGroup: { changes: { name: string; delta: number }[] } | null;
    userErrors: { field: string[] | null; message: string; code: string | null }[];
  };
};

export async function pushToShopifyAction(_prev: ErpActionState, formData: FormData): Promise<ErpActionState> {
  const s = await merchant();
  if (!s) return { status: "error", message: "Only the merchant team can update Shopify stock." };

  let parsed;
  try {
    parsed = PushPayload.safeParse(JSON.parse(String(formData.get("rows") ?? "[]")));
  } catch {
    return { status: "error", message: "Nothing selected." };
  }
  if (!parsed.success) return { status: "error", message: "Nothing selected." };

  const [shopify, erp] = await Promise.all([getShopifyStock(), db.erpStock.findMany({ where: { variantId: { in: parsed.data.map((r) => r.variantId) } } })]);
  const live = new Map(shopify.map((r) => [r.variantId, r]));
  const wh = new Map(erp.map((r) => [r.variantId, r]));

  const changed: string[] = [];
  const quantities: { inventoryItemId: string; locationId: string; quantity: number; changeFromQuantity: number }[] = [];
  const detail: { sku: string; from: number; to: number }[] = [];
  for (const { variantId, seen } of parsed.data) {
    const row = live.get(variantId);
    const w = wh.get(variantId);
    if (!row || !w || !row.tracked || row.locationId === null || row.available === null) continue;
    // Someone bought or edited stock since the page loaded: don't overwrite blindly.
    if (row.available !== seen) {
      changed.push(row.title);
      continue;
    }
    const target = erpAvailable(w);
    if (target === row.available) continue;
    // changeFromQuantity is Shopify's compare-and-swap check: the write is
    // rejected if stock moved between our read and this write.
    quantities.push({ inventoryItemId: row.inventoryItemId, locationId: row.locationId, quantity: target, changeFromQuantity: row.available });
    detail.push({ sku: row.sku, from: row.available, to: target });
  }

  if (!quantities.length) {
    return changed.length
      ? { status: "error", message: `Shopify stock changed since you loaded the page (${changed.join(", ")}). Refresh and try again.` }
      : { status: "done", message: "Everything selected is already in sync." };
  }

  const key = randomUUID();
  try {
    const data = await adminFetch<SetQuantities>(
      `mutation ErpPush($input: InventorySetQuantitiesInput!, $key: String!) {
        inventorySetQuantities(input: $input) @idempotent(key: $key) {
          inventoryAdjustmentGroup { changes { name delta } }
          userErrors { field message code }
        }
      }`,
      { key, input: { name: "available", reason: "correction", referenceDocumentUri: `erp://lumen-demo/sync/${key}`, quantities } }
    );
    const errs = data.inventorySetQuantities.userErrors;
    if (errs.length) {
      const stale = errs.some((e) => /change_from|compare|stale|mismatch/i.test(`${e.code} ${e.message}`));
      return {
        status: "error",
        message: stale ? "Shopify stock changed while syncing, so nothing was overwritten. Refresh and try again." : `Shopify: ${errs.map((e) => e.message).join("; ")}`,
      };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[erp] push failed:", msg);
    if (/access denied|write_inventory|scope/i.test(msg)) {
      return { status: "error", message: "The Shopify app needs the write_inventory permission. Add it in the Dev Dashboard and reinstall." };
    }
    return { status: "error", message: "Couldn't reach Shopify. Nothing was changed." };
  }

  await db.erpSyncLog
    .create({ data: { type: "push", summary: `Pushed warehouse stock to Shopify for ${detail.length} SKU${detail.length === 1 ? "" : "s"}`, detail, actor: s.name } })
    .catch(() => {});
  refresh();
  const skipped = changed.length ? ` Skipped ${changed.length} that changed in Shopify meanwhile.` : "";
  return { status: "done", message: `Updated ${detail.length} SKU${detail.length === 1 ? "" : "s"} in Shopify.${skipped}` };
}

// Makes the warehouse "move" so the drift between ERP and Shopify can be
// shown again: a retailer shipment is packed, a unit is written off as
// damaged, and an open factory purchase order is received.
export async function simulateWarehouseAction(): Promise<void> {
  const s = await merchant();
  if (!s) return;
  const rows = await db.erpStock.findMany();
  if (!rows.length) return;
  const pick = <T>(xs: T[]): T | undefined => xs[Math.floor(Math.random() * xs.length)];
  const events: string[] = [];

  const shipped = pick(rows.filter((r) => r.onHand >= 3)) ?? null;
  if (shipped) {
    const units = Math.min(shipped.onHand, 2 + Math.floor(Math.random() * 4));
    await db.erpStock.update({ where: { variantId: shipped.variantId }, data: { onHand: { decrement: units } } });
    events.push(`Packed a retail shipment: ${shipped.title} −${units}`);
  }
  const damaged = pick(rows.filter((r) => r.onHand >= 1 && r.variantId !== shipped?.variantId)) ?? null;
  if (damaged) {
    await db.erpStock.update({ where: { variantId: damaged.variantId }, data: { onHand: { decrement: 1 } } });
    events.push(`Damaged in warehouse: ${damaged.title} −1`);
  }
  const receipt = pick(rows.filter((r) => r.incoming > 0)) ?? null;
  if (receipt) {
    await db.erpStock.update({ where: { variantId: receipt.variantId }, data: { onHand: { increment: receipt.incoming }, incoming: 0, incomingEta: null } });
    events.push(`Factory PO received: ${receipt.title} +${receipt.incoming}`);
  }
  if (events.length) {
    await db.erpSyncLog.create({ data: { type: "warehouse", summary: events.join(" · "), detail: events, actor: "Warehouse (simulated)" } }).catch(() => {});
  }
  refresh();
}

// Hands a B2B draft order to the ERP. The warehouse reserves ("allocates")
// the units straight away, which is exactly what makes Shopify's online stock
// go stale until the next sync: retailers and shoppers share one warehouse.
export async function exportOrderAction(formData: FormData): Promise<void> {
  const s = await merchant();
  if (!s) return;
  const id = String(formData.get("draftOrderId") ?? "");
  if (!DRAFT_ORDER_ID.test(id)) return;
  if (await db.erpOrderExport.findUnique({ where: { draftOrderId: id } })) return;

  const feed = await loadOrderFeed();
  const order = feed.ok ? feed.orders.find((o) => o.id === id) : null;
  if (!order) return;

  const lines = order.lines.filter((l) => l.variantId && VARIANT_ID.test(l.variantId));
  const known = new Set((await db.erpStock.findMany({ where: { variantId: { in: lines.map((l) => l.variantId!) } }, select: { variantId: true } })).map((r) => r.variantId));
  const units = order.lines.reduce((n, l) => n + l.quantity, 0);
  await db.$transaction([
    db.erpOrderExport.create({ data: { draftOrderId: id, name: order.name, units, actor: s.name } }),
    ...lines.filter((l) => known.has(l.variantId!)).map((l) => db.erpStock.update({ where: { variantId: l.variantId! }, data: { allocated: { increment: l.quantity } } })),
    db.erpSyncLog.create({
      data: { type: "export", summary: `Sent ${order.name} (${order.company ?? "retailer"}, ${units} units) to the ERP and reserved stock`, detail: { order: order.name, units }, actor: s.name },
    }),
  ]);
  refresh();
}

// Puts the mock warehouse back to its starting state (handy before a demo).
// Shopify itself is never touched by a reset.
export async function resetErpDemoAction(): Promise<void> {
  const s = await merchant();
  if (!s) return;
  await db.$transaction([db.erpStock.deleteMany(), db.erpOrderExport.deleteMany(), db.erpSyncLog.deleteMany()]);
  refresh();
}
