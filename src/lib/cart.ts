import "server-only";
import { cookies } from "next/headers";
import { shopifyFetch } from "@/lib/shopify";

// A real Shopify cart (Storefront Cart API). We only keep its id in an
// httpOnly cookie; prices, stock and totals always come from Shopify.

const CART_COOKIE = "cart_id";
export const GIFT_NOTE_KEY = "Gift note";

export type NewLine = { merchandiseId: string; quantity: number; attributes?: { key: string; value: string }[] };

export type CartLine = {
  id: string;
  quantity: number;
  variantId: string;
  variantTitle: string;
  unitPrice: number;
  lineTotal: number;
  quantityAvailable: number | null;
  giftNote: string | null;
  product: { handle: string; title: string; brand: string; imageUrl: string | null };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: number;
  lines: CartLine[];
};

const CART_FIELDS = `
  id checkoutUrl totalQuantity
  cost { subtotalAmount { amount } }
  lines(first: 50) {
    nodes {
      id quantity
      attributes { key value }
      cost { totalAmount { amount } }
      merchandise {
        ... on ProductVariant {
          id title quantityAvailable
          price { amount }
          product { handle title vendor featuredImage { url } }
        }
      }
    }
  }
`;

type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: { amount: string } };
  lines: {
    nodes: {
      id: string;
      quantity: number;
      attributes: { key: string; value: string | null }[];
      cost: { totalAmount: { amount: string } };
      merchandise: {
        id: string;
        title: string;
        quantityAvailable: number | null;
        price: { amount: string };
        product: { handle: string; title: string; vendor: string; featuredImage: { url: string } | null };
      };
    }[];
  };
};

type CartPayload = { cart: ShopifyCart | null; userErrors: { message: string }[] };

function toCart(c: ShopifyCart): Cart {
  return {
    id: c.id,
    checkoutUrl: c.checkoutUrl,
    totalQuantity: c.totalQuantity,
    subtotal: Number(c.cost.subtotalAmount.amount),
    lines: c.lines.nodes.map((l) => ({
      id: l.id,
      quantity: l.quantity,
      variantId: l.merchandise.id,
      variantTitle: l.merchandise.title,
      unitPrice: Number(l.merchandise.price.amount),
      lineTotal: Number(l.cost.totalAmount.amount),
      quantityAvailable: l.merchandise.quantityAvailable,
      giftNote: l.attributes.find((a) => a.key === GIFT_NOTE_KEY)?.value ?? null,
      product: {
        handle: l.merchandise.product.handle,
        title: l.merchandise.product.title,
        brand: l.merchandise.product.vendor,
        imageUrl: l.merchandise.product.featuredImage?.url ?? null,
      },
    })),
  };
}

function unwrap(payload: CartPayload): Cart {
  if (payload.userErrors.length) throw new CartError(payload.userErrors.map((e) => e.message).join(" "));
  if (!payload.cart) throw new CartError("Shopify did not return a cart.");
  return toCart(payload.cart);
}

export class CartError extends Error {}

async function getCartId(): Promise<string | null> {
  return (await cookies()).get(CART_COOKIE)?.value ?? null;
}

async function setCartId(id: string) {
  (await cookies()).set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getCart(): Promise<Cart | null> {
  const id = await getCartId();
  if (!id) return null;
  const data = await shopifyFetch<{ cart: ShopifyCart | null }>(
    `query Cart($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`,
    { id }
  );
  return data.cart ? toCart(data.cart) : null;
}

export async function addLine(variantId: string, quantity: number): Promise<Cart> {
  return addLines([{ merchandiseId: variantId, quantity }]);
}

// One round trip for several lines (used by rituals and gift boxes).
export async function addLines(lines: NewLine[]): Promise<Cart> {
  const existing = await getCart();

  if (existing) {
    const data = await shopifyFetch<{ cartLinesAdd: CartPayload }>(
      `mutation Add($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { message } }
      }`,
      { cartId: existing.id, lines }
    );
    return unwrap(data.cartLinesAdd);
  }

  const data = await shopifyFetch<{ cartCreate: CartPayload }>(
    `mutation Create($lines: [CartLineInput!]!) {
      cartCreate(input: { lines: $lines }) { cart { ${CART_FIELDS} } userErrors { message } }
    }`,
    { lines }
  );
  const cart = unwrap(data.cartCreate);
  await setCartId(cart.id);
  return cart;
}

export async function updateLine(lineId: string, quantity: number): Promise<Cart> {
  const cartId = await getCartId();
  if (!cartId) throw new CartError("Your bag has expired. Please add the item again.");
  const data = await shopifyFetch<{ cartLinesUpdate: CartPayload }>(
    `mutation Update($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { message } }
    }`,
    { cartId, lines: [{ id: lineId, quantity }] }
  );
  return unwrap(data.cartLinesUpdate);
}

export async function removeLine(lineId: string): Promise<Cart> {
  const cartId = await getCartId();
  if (!cartId) throw new CartError("Your bag has expired.");
  const data = await shopifyFetch<{ cartLinesRemove: CartPayload }>(
    `mutation Remove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${CART_FIELDS} } userErrors { message } }
    }`,
    { cartId, lineIds: [lineId] }
  );
  return unwrap(data.cartLinesRemove);
}

// For the Agent API: a brand-new cart that is NOT tied to this visitor's cookie.
// The agent gets the Shopify checkout link and a human completes the purchase.
// The `source` attribute shows up on the resulting order in Shopify admin.
export async function createAgentCart(lines: NewLine[], agentName: string): Promise<{ checkoutUrl: string; totalQuantity: number }> {
  const data = await shopifyFetch<{ cartCreate: CartPayload }>(
    `mutation Create($lines: [CartLineInput!]!, $attributes: [AttributeInput!]) {
      cartCreate(input: { lines: $lines, attributes: $attributes }) { cart { ${CART_FIELDS} } userErrors { message } }
    }`,
    {
      lines,
      attributes: [
        { key: "source", value: "agent-api" },
        { key: "agent", value: agentName.slice(0, 60) },
      ],
    }
  );
  const cart = unwrap(data.cartCreate);
  return { checkoutUrl: cart.checkoutUrl, totalQuantity: cart.totalQuantity };
}
