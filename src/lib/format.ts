const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatPrice(min: number, max: number = min): string {
  return min === max ? usd.format(min) : `${usd.format(min)} – ${usd.format(max)}`;
}
