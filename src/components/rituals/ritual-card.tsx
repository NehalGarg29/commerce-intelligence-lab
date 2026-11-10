import Image from "next/image";
import Link from "next/link";
import type { ResolvedRitual } from "@/lib/rituals";
import { productImageSrc } from "@/lib/catalog/local-images";
import { formatPrice } from "@/lib/format";
import { RitualAddButton } from "./ritual-add-button";

export function RitualCard({ ritual, compact = false }: { ritual: ResolvedRitual; compact?: boolean }) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-lavender-100 bg-white p-6 md:p-7">
      <div className="grid grid-cols-3 gap-2">
        {ritual.items.map(({ product }) => {
          const src = productImageSrc(product.handle, product.imageUrl);
          return (
            <Link key={product.id} href={`/products/${product.handle}`} className="relative aspect-square overflow-hidden rounded-2xl bg-lavender-50">
              {src && <Image src={src} alt={product.title} fill sizes="160px" className="object-cover transition duration-500 hover:scale-105" />}
            </Link>
          );
        })}
      </div>

      <p className="mt-6 text-[11px] tracking-[0.18em] text-ink-muted">{ritual.items.length} PIECES · RITUAL</p>
      <h3 className="mt-1 font-display text-2xl text-plum-800">{ritual.name}</h3>
      <p className="mt-1 text-[15px] text-ink-muted">{ritual.tagline}</p>

      {!compact && (
        <ol className="mt-5 space-y-3">
          {ritual.items.map(({ product, variant, text }, i) => (
            <li key={product.id} className="flex gap-3 text-[14px] leading-relaxed">
              <span className="font-display text-lg leading-6 text-mauve-400">{i + 1}</span>
              <span>
                <Link href={`/products/${product.handle}`} className="font-medium text-ink hover:text-plum-700">{product.title}</Link>
                <span className="text-ink-muted"> · {formatPrice(variant.price)}</span>
                <br />
                <span className="text-ink-muted">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-auto pt-6">
        <RitualAddButton ritualId={ritual.id} total={ritual.total} disabled={ritual.missing.length > 0} />
      </div>
    </article>
  );
}
