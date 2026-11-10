import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, Droplets, Package, RotateCcw, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { getProduct, getProducts } from "@/lib/catalog";
import type { Product } from "@/lib/catalog/types";
import { FEATURE_LABELS } from "@/lib/catalog/attributes";
import { careAdvice } from "@/lib/catalog/compatibility";
import { productImageSrc } from "@/lib/catalog/local-images";
import { formatPrice } from "@/lib/format";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { RitualCard } from "@/components/rituals/ritual-card";
import { CompareToggle } from "@/components/compare/compare-toggle";
import { resolveRitual, ritualsFor } from "@/lib/rituals";
import { HowToUse } from "@/components/guides/how-to-use";
import { guideFor } from "@/lib/guides";
import { ReviewsSection, ReviewsSkeleton } from "@/components/reviews/reviews-section";
import { RatingInline } from "@/components/reviews/stars";

type Params = Promise<{ handle: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProduct((await params).handle);
  return product
    ? { title: `${product.title} · Lumen Atelier`, description: product.description.slice(0, 155) }
    : { title: "Product not found · Lumen Atelier" };
}

const AUDIENCE_TAGS = ["for-her", "for-him", "for-couples"];

function related(product: Product, all: Product[]): Product[] {
  const audiences = product.tags.filter((t) => AUDIENCE_TAGS.includes(t));
  return all
    .filter((p) => p.handle !== product.handle && p.brand !== "Lumen Essentials" && !p.tags.includes("gift-box"))
    .filter((p) => p.brand === product.brand || p.tags.some((t) => audiences.includes(t)))
    .sort((a, b) => Number(b.available) - Number(a.available))
    .slice(0, 4);
}

function PairingCard({ product, all }: { product: Product; all: Product[] }) {
  const advice = careAdvice(product);
  if (!advice) return null;
  const pair = all.find((p) => p.handle === advice.pairWith);
  const avoid = advice.avoid ? all.find((p) => p.handle === advice.avoid) : undefined;
  if (!pair) return null;
  const src = productImageSrc(pair.handle, pair.imageUrl);

  return (
    <div className="rounded-2xl border border-lavender-100 bg-white p-5">
      <p className="flex items-center gap-2 text-[11px] tracking-[0.18em] text-ink-muted">
        <Droplets size={14} aria-hidden="true" /> PAIRS WELL WITH
      </p>
      <Link href={`/products/${pair.handle}`} className="mt-3 flex items-center gap-4 group">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-lavender-50">
          {src && <Image src={src} alt="" fill sizes="64px" className="object-cover" />}
        </div>
        <div className="flex-1">
          <p className="font-display text-lg text-ink group-hover:text-plum-700">{pair.title}</p>
          <p className="text-sm text-ink-muted">{formatPrice(pair.priceMin, pair.priceMax)} · water-based</p>
        </div>
      </Link>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">{advice.reason}</p>
      {avoid && (
        <p className="mt-2 flex items-start gap-2 text-[13px] text-[#8A4B0F]">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          Not recommended with {avoid.title} (silicone-based).
        </p>
      )}
    </div>
  );
}

function Details({ product }: { product: Product }) {
  const features = product.tags.filter((t) => t in FEATURE_LABELS).map((t) => FEATURE_LABELS[t]);
  const sections = [
    {
      title: "Features",
      icon: Sparkles,
      body: features.length ? (
        <ul className="flex flex-wrap gap-2">
          {features.map((f) => (
            <li key={f} className="rounded-full bg-lavender-50 px-3 py-1 text-[13px] text-plum-800">{f}</li>
          ))}
        </ul>
      ) : (
        <p>No feature data has been added for this product yet.</p>
      ),
    },
    {
      title: "Discreet delivery",
      icon: Package,
      body: <p>Ships in a plain, unbranded box with a neutral sender name. Nothing on the outside describes what is inside.</p>,
    },
    {
      title: "Returns",
      icon: RotateCcw,
      body: <p>Demo store: no return policy has been approved for this prototype, so none is shown here or quoted by the advisor.</p>,
    },
  ];

  return (
    <div className="divide-y divide-lavender-100 border-y border-lavender-100">
      {sections.map((s, i) => (
        <details key={s.title} open={i === 0} className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-medium text-ink">
            <span className="flex items-center gap-2.5">
              <s.icon size={17} className="text-plum-700" aria-hidden="true" /> {s.title}
            </span>
            <ChevronDown size={18} className="transition group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-3 text-[14px] leading-relaxed text-ink-muted">{s.body}</div>
        </details>
      ))}
    </div>
  );
}

async function ProductView({ params }: { params: Params }) {
  const { handle } = await params;
  const [product, all] = await Promise.all([getProduct(handle), getProducts()]);
  if (!product) notFound();

  const images =
    product.images.length > 0
      ? product.images
      : [{ url: productImageSrc(product.handle, null) ?? "/images/products/aura-wand.jpg", alt: product.title }];
  const more = related(product, all);
  const rituals = ritualsFor(product.handle)
    .map((r) => resolveRitual(r, all))
    .filter((r) => r.items.length > 1);

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-[13px] text-ink-muted">
        <Link href="/" className="hover:text-plum-700">Home</Link> <span aria-hidden="true">/</span>{" "}
        <Link href="/shop" className="hover:text-plum-700">Shop</Link> <span aria-hidden="true">/</span>{" "}
        <span className="text-ink">{product.title}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
        <ProductGallery images={images} title={product.title} />

        <div className="flex min-w-0 flex-col gap-7">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-ink-muted">{product.brand.toUpperCase()} · {product.type.toUpperCase()}</p>
            <h1 className="mt-2 font-display text-4xl tracking-tight text-plum-800 md:text-5xl">{product.title}</h1>
            {product.rating && (
              <a href="#reviews" className="mt-3 inline-flex hover:opacity-80" aria-label="Jump to reviews">
                <RatingInline average={product.rating.average} count={product.rating.count} size={15} />
              </a>
            )}
            <p className="mt-4 text-[16px] leading-relaxed text-ink-muted">{product.description}</p>
            {guideFor(product) && (
              <a
                href="#how-to-use"
                className="mt-3 inline-block text-[14px] font-medium text-plum-800 underline decoration-mauve-400 underline-offset-4 hover:text-plum-700"
              >
                New to this? See how to use it ↓
              </a>
            )}
          </div>

          <ProductPurchase variants={product.variants} giftNote={product.tags.includes("gift-box")} />

          {!product.tags.includes("gift-box") && (
            <div className="-mt-3">
              <CompareToggle
                variant="inline"
                item={{ handle: product.handle, title: product.title, imageUrl: images[0]?.url ?? null }}
              />
            </div>
          )}

          <ul className="grid grid-cols-1 gap-3 text-[13px] text-ink-muted sm:grid-cols-3">
            <li className="flex items-center gap-2"><Package size={16} className="text-plum-700" aria-hidden="true" /> Plain packaging</li>
            <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-plum-700" aria-hidden="true" /> Secure Shopify checkout</li>
            <li className="flex items-center gap-2"><Sparkles size={16} className="text-plum-700" aria-hidden="true" /> Live stock from Shopify</li>
          </ul>

          <PairingCard product={product} all={all} />
          <Details product={product} />
        </div>
      </div>

      <HowToUse product={product} />

      <Suspense fallback={<ReviewsSkeleton />}>
        <ReviewsSection handle={product.handle} />
      </Suspense>

      {rituals.length > 0 && (
        <section className="mt-24">
          <p className="text-[11px] tracking-[0.2em] text-ink-muted">COMPLETE THE RITUAL</p>
          <h2 className="mt-2 font-display text-3xl tracking-tight text-plum-800 md:text-4xl">Better together</h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {rituals.map((r) => (
              <RitualCard key={r.id} ritual={r} />
            ))}
          </div>
        </section>
      )}

      {more.length > 0 && (
        <section className="mt-24">
          <p className="text-[11px] tracking-[0.2em] text-ink-muted">YOU MAY ALSO LIKE</p>
          <h2 className="mt-2 font-display text-3xl tracking-tight text-plum-800 md:text-4xl">More like this</h2>
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {more.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function ProductSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
      <div className="aspect-square animate-pulse rounded-3xl bg-lavender-100/60" />
      <div className="flex flex-col gap-4">
        <div className="h-3 w-40 animate-pulse rounded bg-lavender-100" />
        <div className="h-12 w-64 animate-pulse rounded bg-lavender-100" />
        <div className="h-20 w-full animate-pulse rounded bg-lavender-100" />
        <div className="h-14 w-full animate-pulse rounded-full bg-lavender-100" />
      </div>
    </div>
  );
}

export default function ProductPage({ params }: { params: Params }) {
  return (
    <main className="mx-auto max-w-7xl px-5 pb-10 pt-8 md:px-12 md:pt-12">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductView params={params} />
      </Suspense>
    </main>
  );
}
