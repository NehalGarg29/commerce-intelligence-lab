"use server";

import { z } from "zod";
import { getProducts } from "@/lib/catalog";
import { canViewRetailer } from "@/lib/auth/session";
import { getRetailer } from "@/lib/b2b/retailers";
import { buildCatalog, resolveKits } from "@/lib/b2b/kits";
import { computeOrder } from "@/lib/b2b/order";
import { adminFetch } from "@/lib/b2b/admin";
import { db } from "@/lib/db";

export type WholesaleOrderState = { status: "idle" | "placed" | "error"; message: string; orderName?: string };

const Payload = z.object({
  items: z.record(z.string().regex(/^[a-z0-9-]{1,80}$/), z.number().int().min(0).max(99)),
  kits: z.record(z.string().regex(/^[a-z0-9-]{1,40}$/), z.number().int().min(0).max(5)),
});

type DraftOrderCreate = {
  draftOrderCreate: {
    draftOrder: { id: string; name: string; totalPriceSet: { shopMoney: { amount: string } } } | null;
    userErrors: { field: string[] | null; message: string }[];
  };
};

// Places a wholesale order as a Shopify B2B draft order for the retailer's
// company location. Everything is recomputed here from live Shopify prices and
// stock. The browser only says which products and kits, never what they cost.
export async function placeWholesaleOrderAction(_prev: WholesaleOrderState, formData: FormData): Promise<WholesaleOrderState> {
  const retailerId = String(formData.get("retailerId") ?? "");
  const poNumber = String(formData.get("poNumber") ?? "").replace(/[^\w\- #/]/g, "").slice(0, 40);

  const { session, allowed } = await canViewRetailer(retailerId);
  if (!session || !allowed) return { status: "error", message: "You can only order for your own company." };

  let parsed;
  try {
    parsed = Payload.safeParse(JSON.parse(String(formData.get("order") ?? "{}")));
  } catch {
    return { status: "error", message: "Invalid order." };
  }
  if (!parsed.success) return { status: "error", message: "Invalid order." };

  const retailer = await getRetailer(retailerId);
  if (!retailer) return { status: "error", message: "Unknown retailer." };
  if (retailer.source !== "shopify" || !retailer.shopify) {
    return { status: "error", message: "Demo retailer: connect Shopify B2B to place real orders. You can still download the CSV." };
  }
  if (!retailer.shopify.contactId) {
    return { status: "error", message: "This company has no contact in Shopify yet. Add a customer to the company, then try again." };
  }

  const catalog = buildCatalog(await getProducts(), retailer.priceList);
  const order = computeOrder(parsed.data, catalog, resolveKits(catalog));
  if (order.lines.length === 0) return { status: "error", message: "Your order is empty." };
  if (order.problems.length) return { status: "error", message: order.problems.join(" ") };

  // Shopify applies the location's catalog price and payment terms itself;
  // kit savings + volume program go on as one order-level discount.
  const discount = Math.round((order.kitSavings + order.tierSavings) * 100) / 100;
  try {
    const data = await adminFetch<DraftOrderCreate>(
      `mutation PlaceWholesaleOrder($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder { id name totalPriceSet { shopMoney { amount } } }
          userErrors { field message }
        }
      }`,
      {
        input: {
          purchasingEntity: {
            purchasingCompany: {
              companyId: retailer.shopify.companyId,
              companyLocationId: retailer.shopify.locationId,
              companyContactId: retailer.shopify.contactId,
            },
          },
          lineItems: order.lines.map((l) => ({ variantId: l.variantId, quantity: l.units })),
          appliedDiscount:
            discount > 0
              ? {
                  title: [order.kitSavings > 0 && "Shelf kits", order.tier && `${order.tier.name} volume tier`].filter(Boolean).join(" + "),
                  value: discount,
                  valueType: "FIXED_AMOUNT",
                }
              : null,
          shippingLine: {
            title: order.freight === 0 ? "Free freight" : "Standard freight",
            priceWithCurrency: { amount: order.freight.toFixed(2), currencyCode: retailer.priceList.currency },
          },
          poNumber: poNumber || null,
          tags: ["lumen-portal", "wholesale"],
          note: `Submitted via the retail partner portal by ${session.name}.`,
        },
      }
    );
    const result = data.draftOrderCreate;
    if (result.userErrors.length || !result.draftOrder) {
      return { status: "error", message: `Shopify: ${result.userErrors.map((e) => e.message).join("; ") || "could not create the order"}` };
    }
    db.event
      .create({ data: { type: "b2b_order_placed", sessionId: retailer.id, metadata: { units: order.units, total: order.total, kits: Object.keys(parsed.data.kits).length } } })
      .catch(() => {});
    return {
      status: "placed",
      orderName: result.draftOrder.name,
      message: `Order ${result.draftOrder.name} sent to our team for review (${retailer.paymentTerms ?? "standard terms"}).`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[b2b] draft order failed:", msg);
    if (/access denied|write_draft_orders|scope/i.test(msg)) {
      return { status: "error", message: "The Shopify app needs the write_draft_orders permission. Add it in the Dev Dashboard and approve the update." };
    }
    return { status: "error", message: "Couldn't reach Shopify to place the order. Please try again." };
  }
}
