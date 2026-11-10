// Storefront events. Anonymous by design: a random per-tab session id, the
// event type, an optional product handle and a tiny metadata object. No
// personal data, no free text, no advisor questions.

export const CLIENT_EVENTS = [
  "product_view",
  "compare_add",
  "advisor_open",
  "advisor_query",
  "advisor_click",
  "add_to_cart",
  "checkout_start",
] as const;
export type ClientEvent = (typeof CLIENT_EVENTS)[number];

// Where an add-to-bag came from.
export const ADD_SOURCES = ["product_page", "advisor", "ritual"] as const;
export type AddSource = (typeof ADD_SOURCES)[number];
