import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-28 border-t border-lavender-100 text-ink">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:px-12">
        <div>
          <p className="font-display text-3xl text-plum-800">Lumen Atelier</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
            An independent concept prototype built to demonstrate an AI commerce intelligence layer on
            Shopify. All products, prices, images and reviews are fictional demo data.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-3 text-sm">
          <p className="text-[11px] tracking-[0.16em] text-ink-muted">SHOP</p>
          <Link href="/shop" className="hover:text-plum-700">Shop all</Link>
          <Link href="/shop?audience=for-her" className="hover:text-plum-700">For her</Link>
          <Link href="/shop?audience=for-him" className="hover:text-plum-700">For him</Link>
          <Link href="/shop?audience=for-couples" className="hover:text-plum-700">Couples</Link>
        </nav>
        <div className="text-sm leading-relaxed text-ink-muted">
          <p className="text-[11px] tracking-[0.16em]">ABOUT THIS DEMO</p>
          <p className="mt-3">Not affiliated with any real brand. Product imagery is rendered for the prototype.</p>
        </div>
      </div>
    </footer>
  );
}
