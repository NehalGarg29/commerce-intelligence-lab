import { getCart } from "@/lib/cart";

// Reads the visitor's cart cookie, so it streams in separately from the
// rest of the (cacheable) header.
export async function CartBadge() {
  const cart = await getCart().catch(() => null);
  const count = cart?.totalQuantity ?? 0;
  if (count === 0) return null;
  return (
    <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-plum-700 px-1 text-[10px] font-medium text-white">
      {count}
      <span className="sr-only"> items in bag</span>
    </span>
  );
}
