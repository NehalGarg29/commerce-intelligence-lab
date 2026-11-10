import { Suspense } from "react";
import Link from "next/link";
import { Search, ShoppingBag, User } from "lucide-react";
import { CartBadge } from "./cart/cart-badge";

const nav = [
  { label: "Shop all", href: "/shop" },
  { label: "For her", href: "/shop?audience=for-her" },
  { label: "For him", href: "/shop?audience=for-him" },
  { label: "Couples", href: "/shop?audience=for-couples" },
  { label: "Care", href: "/shop?category=care" },
];

export function SiteHeader() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/40 bg-ivory/50 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 pt-4 md:px-12 md:py-4">
          <Link href="/" className="leading-tight">
            <span className="block font-display text-2xl tracking-tight text-plum-800 md:text-[28px]">
              Lumen Atelier
            </span>
            <span className="block text-[10px] tracking-[0.18em] text-ink-muted">CONCEPT STOREFRONT</span>
          </Link>

          <nav aria-label="Main" className="hidden gap-8 text-[15px] md:flex">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="text-ink transition hover:text-plum-700">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center">
            <Link href="/shop" aria-label="Search products" className="rounded-full p-3 transition hover:bg-lavender-50">
              <Search size={20} strokeWidth={1.6} />
            </Link>
            <span
              className="hidden rounded-full p-3 text-ink-muted/60 sm:inline-flex"
              role="img"
              aria-label="Customer accounts are not part of this demo"
              title="Customer accounts are not part of this demo"
            >
              <User size={20} strokeWidth={1.6} />
            </span>
            <Link href="/cart" aria-label="Shopping bag" className="relative rounded-full p-3 transition hover:bg-lavender-50">
              <ShoppingBag size={20} strokeWidth={1.6} />
              <Suspense fallback={null}>
                <CartBadge />
              </Suspense>
            </Link>
          </div>
        </div>

        {/* Mobile: the same links as a swipeable row instead of a hidden menu */}
        <nav aria-label="Main mobile" className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3 pt-3 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full border border-lavender-100 px-4 py-2 text-sm text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
