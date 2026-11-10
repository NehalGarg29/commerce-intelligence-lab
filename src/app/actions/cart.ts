"use server";

import { refresh } from "next/cache";
import { addLines, CartError, GIFT_NOTE_KEY, removeLine, updateLine } from "@/lib/cart";
import { getProducts } from "@/lib/catalog";
import { RITUALS, RITUAL_IDS, resolveRitual } from "@/lib/rituals";

// Server Actions are public POST endpoints, so every input is validated here,
// not just in the UI.

const VARIANT_ID = /^gid:\/\/shopify\/ProductVariant\/\d+$/;
// Line ids look like gid://shopify/CartLine/<id>?cart=<token>. Shopify also checks
// that the line belongs to the cart id stored in this visitor's cookie.
const LINE_ID = /^gid:\/\/shopify\/CartLine\/[\w-]+(\?cart=[\w-]+)?$/;
const MAX_QTY = 10;

export type AddToBagState = { status: "idle" | "added" | "error"; message: string };

// Gift notes are free text from shoppers: trimmed, length-limited and stripped
// of control characters before they are stored on the Shopify cart line.
function cleanNote(raw: FormDataEntryValue | null): string {
  return String(raw ?? "")
    .replace(/\p{Cc}/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
}

function parseQty(raw: FormDataEntryValue | null, min: number): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= min && n <= MAX_QTY ? n : null;
}

export async function addToBagAction(_prev: AddToBagState, formData: FormData): Promise<AddToBagState> {
  const variantId = String(formData.get("variantId") ?? "");
  const quantity = parseQty(formData.get("quantity"), 1);
  if (!VARIANT_ID.test(variantId) || quantity === null) {
    return { status: "error", message: "Please choose an option and a quantity between 1 and 10." };
  }
  const note = cleanNote(formData.get("giftNote"));
  try {
    await addLines([
      { merchandiseId: variantId, quantity, attributes: note ? [{ key: GIFT_NOTE_KEY, value: note }] : undefined },
    ]);
    refresh();
    return { status: "added", message: note ? "Gift box added with your note." : "Added to your bag." };
  } catch (e) {
    return { status: "error", message: e instanceof CartError ? e.message : "Could not reach the store. Please try again." };
  }
}

export async function updateLineAction(formData: FormData): Promise<void> {
  const lineId = String(formData.get("lineId") ?? "");
  const quantity = parseQty(formData.get("quantity"), 0);
  if (!LINE_ID.test(lineId) || quantity === null) return;
  await (quantity === 0 ? removeLine(lineId) : updateLine(lineId, quantity));
  refresh();
}

export async function removeLineAction(formData: FormData): Promise<void> {
  const lineId = String(formData.get("lineId") ?? "");
  if (!LINE_ID.test(lineId)) return;
  await removeLine(lineId);
  refresh();
}

export async function addRitualAction(_prev: AddToBagState, formData: FormData): Promise<AddToBagState> {
  const id = String(formData.get("ritualId") ?? "");
  const ritual = RITUALS.find((r) => r.id === id);
  if (!RITUAL_IDS.has(id) || !ritual) return { status: "error", message: "Unknown ritual." };

  // Re-check stock on the server at the moment of adding, not what the page showed.
  const resolved = resolveRitual(ritual, await getProducts());
  if (resolved.missing.length) {
    return { status: "error", message: "Part of this ritual just went out of stock, so it can't be added as a set." };
  }
  try {
    await addLines(resolved.items.map((i) => ({ merchandiseId: i.variant.id, quantity: 1 })));
    refresh();
    return { status: "added", message: `${resolved.items.length} items added to your bag.` };
  } catch (e) {
    return { status: "error", message: e instanceof CartError ? e.message : "Could not reach the store. Please try again." };
  }
}

// The advisor can only *prepare* a bag. This action is the shopper's confirmation:
// it accepts at most 4 lines, re-validates every variant id and re-checks live
// stock before anything reaches the Shopify cart.
export async function addAdvisorBagAction(_prev: AddToBagState, formData: FormData): Promise<AddToBagState> {
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("lines") ?? "[]"));
  } catch {
    return { status: "error", message: "Invalid bag." };
  }
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 4) return { status: "error", message: "Invalid bag." };

  const lines: { merchandiseId: string; quantity: number }[] = [];
  for (const item of raw) {
    const id = String((item as { variantId?: unknown })?.variantId ?? "");
    const qty = Number((item as { quantity?: unknown })?.quantity);
    if (!VARIANT_ID.test(id) || !Number.isInteger(qty) || qty < 1 || qty > 3) {
      return { status: "error", message: "Invalid bag." };
    }
    lines.push({ merchandiseId: id, quantity: qty });
  }

  const variants = (await getProducts()).flatMap((p) => p.variants);
  for (const l of lines) {
    const v = variants.find((x) => x.id === l.merchandiseId);
    if (!v || !v.available || (v.quantity !== null && v.quantity < l.quantity)) {
      return { status: "error", message: "Something in this bag just went out of stock. Ask the advisor again." };
    }
  }
  try {
    await addLines(lines);
    refresh();
    return { status: "added", message: `${lines.length} ${lines.length === 1 ? "item" : "items"} added to your bag.` };
  } catch (e) {
    return { status: "error", message: e instanceof CartError ? e.message : "Could not reach the store. Please try again." };
  }
}
