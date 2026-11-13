import Link from "next/link";
import type { Product } from "@/lib/catalog/types";
import { productImageSrc } from "@/lib/catalog/local-images";
import { featureLabels } from "@/lib/catalog/attributes";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./product-image";
import { RatingInline } from "./reviews/stars";
import { CompareToggle } from "./compare/compare-toggle";
import type { Tone } from "./product-art";

const brandTone: Record<string, Tone> = {
  "Afterglow": "plum",
  "Velvet Theory": "rose",
  "Pulse Lab": "sand",
  "Afterglow Essentials": "sage",
};

export function ProductCard({ product }: { product: Product }) {
  const lowStock =
    product.available && product.totalInventory !== null && product.totalInventory <= 5;
  const features = featureLabels(product.tags);
  const imageSrc = productImageSrc(product.handle, product.imageUrl);

  return (
    <article className="group relative h-full">
      <Link
        href={`/products/${product.handle}`}
        className="flex h-full flex-col rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-plum-700"
      >
        <div className="relative">
          <ProductImage
            src={imageSrc}
            alt={product.title}
            tone={brandTone[product.brand] ?? "plum"}
            className="aspect-square shadow-[0_1px_0_rgba(58,18,51,0.04)]"
            imageClassName="transition duration-700 ease-out group-hover:scale-[1.05]"
          />
          {!product.available && (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-ink shadow-sm">
              Sold out
            </span>
          )}
          {lowStock && (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-[#8A4B0F] shadow-sm">
              Only {product.totalInventory} left
            </span>
          )}
          <span className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-2 rounded-full bg-white/95 py-2.5 text-center text-sm font-medium text-plum-800 opacity-0 shadow-sm transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
            View product
          </span>
        </div>

        <p className="mt-4 text-[11px] tracking-[0.16em] text-ink-muted">{product.brand.toUpperCase()}</p>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <h3 className="font-display text-xl text-ink transition group-hover:text-plum-700">{product.title}</h3>
          <p className="shrink-0 text-[15px] text-ink">{formatPrice(product.priceMin, product.priceMax)}</p>
        </div>
        {product.rating && (
          <div className="mt-1.5">
            <RatingInline average={product.rating.average} count={product.rating.count} />
          </div>
        )}
        {features.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Key features">
            {features.map((f) => (
              <li key={f} className="rounded-full bg-lavender-50 px-2.5 py-1 text-[11px] text-plum-800">
                {f}
              </li>
            ))}
          </ul>
        )}
      </Link>
      {!product.tags.includes("gift-box") && (
        <div className="absolute right-3 top-3">
          <CompareToggle item={{ handle: product.handle, title: product.title, imageUrl: imageSrc }} />
        </div>
      )}
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="aspect-square animate-pulse rounded-2xl bg-lavender-100/60" />
      <div className="mt-4 h-3 w-24 animate-pulse rounded bg-lavender-100" />
      <div className="mt-2 h-5 w-40 animate-pulse rounded bg-lavender-100" />
      <div className="mt-3 h-5 w-32 animate-pulse rounded-full bg-lavender-100" />
    </div>
  );
}
