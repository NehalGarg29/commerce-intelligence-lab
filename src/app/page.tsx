import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Feather,
  Gem,
  Gift,
  PenLine,
  Leaf,
  MessageSquareQuote,
  Package,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { getCollections, getFeaturedProducts, getProducts } from "@/lib/catalog";
import type { Collection } from "@/lib/catalog/types";
import type { Product } from "@/lib/catalog/types";
import { slugify } from "@/lib/catalog/attributes";
import { productImageSrc } from "@/lib/catalog/local-images";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { RitualCard } from "@/components/rituals/ritual-card";
import { RITUALS, resolveRitual } from "@/lib/rituals";
import { AskAdvisorButton } from "@/components/advisor/ask-advisor-button";

const quickPicks = [
  { label: "New to this", href: "/shop?tag=beginner-friendly" },
  { label: "Whisper-quiet", href: "/shop?tag=whisper-quiet" },
  { label: "Under $100", href: "/shop?maxPrice=100" },
  { label: "For couples", href: "/shop?audience=for-couples" },
  { label: "LGBTQ+", href: "/shop?audience=for-lgbtq" },
];

const values = [
  { icon: Gem, label: "Design-led" },
  { icon: Leaf, label: "Body-safe materials" },
  { icon: Package, label: "Discreet shipping" },
  { icon: MessageSquareQuote, label: "Reviews you can verify" },
  { icon: Feather, label: "Whisper-quiet motors" },
  { icon: ShieldCheck, label: "No account needed" },
];

// Each tile is a Shopify collection: its title and image are managed in the
// Shopify admin. The local image is only a fallback if a collection has none.
const categories = [
  { handle: "for-her", label: "For her", href: "/shop?audience=for-her", fallback: "/images/her.jpg" },
  { handle: "for-him", label: "For him", href: "/shop?audience=for-him", fallback: "/images/him.jpg" },
  { handle: "couples", label: "Couples", href: "/shop?audience=for-couples", fallback: "/images/couples.jpg" },
  { handle: "lgbtq", label: "LGBTQ+", href: "/shop?audience=for-lgbtq", fallback: "/images/couples.jpg" },
  { handle: "care", label: "Care", href: "/shop?category=care", fallback: "/images/care.jpg" },
];

function findCollection(collections: Collection[], handle: string) {
  return collections.find((c) => c.handle === handle);
}

const brands = [
  { name: "Afterglow", line: "Sculptural, design-led massagers and vibrators", lead: "aura-wand" },
  { name: "Velvet Theory", line: "Made to be shared, built for couples", lead: "tide-duo" },
  { name: "Pulse Lab", line: "Strokers, rings and prostate essentials, engineered", lead: "flux-stroker" },
  { name: "Afterglow Essentials", line: "Gentle care for every collection", lead: "silk-glide" },
];

const ADVISOR_EXAMPLE = ["ember-mini", "halo-mini", "drift"];

const steps = [
  { n: "01", title: "Tell it what matters", body: "Budget, experience, what to avoid. Three quick questions, nothing saved." },
  { n: "02", title: "Rules filter first", body: "Out-of-stock and over-budget products are removed before the AI says a word." },
  { n: "03", title: "Picks with proof", body: "Two or three matches, each explained with real review counts. You decide." },
];

function Rail({ products }: { products: Product[] }) {
  return (
    <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-10 md:overflow-visible md:px-0 lg:grid-cols-4">
      {products.map((p) => (
        <div key={p.id} className="w-[72%] shrink-0 snap-start sm:w-[44%] md:w-auto">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}

function RailSkeleton() {
  return (
    <div className="no-scrollbar -mx-5 flex gap-5 overflow-hidden px-5 md:mx-0 md:grid md:grid-cols-2 md:gap-x-6 md:px-0 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="w-[72%] shrink-0 sm:w-[44%] md:w-auto">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}

// Products and order come from the "Featured" collection in Shopify.
async function FeaturedRail() {
  return <Rail products={await getFeaturedProducts()} />;
}

// Built from real catalog tags and live stock: nothing here is hand-picked or invented.
async function BeginnerRail() {
  const products = await getProducts();
  const picks = products
    .filter((p) => p.available && p.tags.includes("beginner-friendly"))
    .sort((a, b) => a.priceMin - b.priceMin)
    .slice(0, 4);
  return <Rail products={picks} />;
}

async function BrandGrid() {
  const products = await getProducts();
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {brands.map((b) => {
        const lead = products.find((p) => p.handle === b.lead);
        const src = lead ? productImageSrc(lead.handle, lead.imageUrl) : null;
        const count = products.filter((p) => p.brand === b.name && !p.tags.includes("gift-box")).length;
        return (
          <Link
            key={b.name}
            href={`/shop?brand=${slugify(b.name)}`}
            className={`group flex flex-col overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:shadow-xl hover:shadow-plum-900/10 border border-lavender-100 bg-white`}
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              {src && (
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-700 ease-out group-hover:scale-105"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col p-6">
              <p className="font-display text-2xl text-ink">{b.name}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{b.line}</p>
              <p className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-plum-700">
                Explore {count} {count === 1 ? "piece" : "pieces"}
                <ArrowRight size={15} className="transition group-hover:translate-x-1" aria-hidden="true" />
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

async function AdvisorExamplePicks() {
  const products = await getProducts();
  const picks = ADVISOR_EXAMPLE.map((h) => products.find((p) => p.handle === h)).filter(
    (p): p is Product => p !== undefined
  );
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {picks.map((p) => (
        <div key={p.id} className="overflow-hidden rounded-xl border border-lavender-100">
          <div className="relative aspect-square">
            <Image src={productImageSrc(p.handle, p.imageUrl) ?? ""} alt="" fill sizes="120px" className="object-cover" />
          </div>
          <p className="px-2 py-1.5 text-center text-[11px] font-medium text-ink">{p.title}</p>
        </div>
      ))}
    </div>
  );
}

async function RitualGrid() {
  const products = await getProducts();
  const rituals = RITUALS.map((r) => resolveRitual(r, products)).filter((r) => r.items.length > 0);
  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-3">
      {rituals.map((r) => (
        <RitualCard key={r.id} ritual={r} />
      ))}
    </div>
  );
}

const GIFT_BOX = "only-for-you-gift-box";

async function GiftImage() {
  const box = (await getProducts()).find((p) => p.handle === GIFT_BOX);
  const src = box?.imageUrl ?? "/images/gift-box.jpg";
  return <Image src={src} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />;
}

function SectionHeading({ eyebrow, title, href, linkLabel }: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[11px] tracking-[0.2em] text-ink-muted">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl tracking-tight text-plum-800 md:text-4xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1.5 text-[15px] font-medium text-plum-700 hover:underline">
          {linkLabel} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const collections = await getCollections();
  const featured = findCollection(collections, "featured") ?? findCollection(collections, "frontpage");
  const heroSrc = featured?.imageUrl ?? "/images/hero.jpg";
  const heroIsRendered = !featured?.imageUrl;
  const tiles = categories.map((c) => {
    const col = findCollection(collections, c.handle);
    return { ...c, image: col?.imageUrl ?? c.fallback };
  });

  return (
    <main className="overflow-x-clip">
      {/* ───────────── Hero ───────────── */}
      <section className="relative isolate flex min-h-[640px] items-end overflow-hidden bg-plum-900 md:min-h-[720px] md:items-center">
        <Image
          src={heroSrc}
          alt=""
          fill
          preload
          sizes="100vw"
          className="-z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-plum-900 via-plum-900/70 to-plum-900/10 md:bg-linear-to-r md:from-plum-900/95 md:via-plum-900/60 md:to-transparent" />

        <div className="mx-auto w-full max-w-7xl px-5 pb-14 pt-40 md:px-12 md:py-32">
          <div className="max-w-xl">
            <p className="fx-fade-up text-[11px] tracking-[0.26em] text-lavender-100 md:text-[12px]">
              THE LUMEN ATELIER COLLECTION
            </p>
            <h1 className="fx-fade-up fx-delay-1 mt-5 font-display text-[44px] leading-[1.02] tracking-tight text-ivory sm:text-6xl md:text-7xl">
              Intimate wellness,
              <br />
              <span className="italic text-lavender-100">elevated.</span>
            </h1>
            <p className="fx-fade-up fx-delay-2 mt-6 max-w-md text-base leading-relaxed text-lavender-50/90 md:text-lg">
              Thoughtfully designed products for modern intimacy and self-care, with an AI advisor that
              shows its evidence.
            </p>
            <div className="fx-fade-up fx-delay-3 mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 font-medium text-plum-800 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-lavender-50"
              >
                Shop the collection
              </Link>
              <AskAdvisorButton className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/60 px-7 font-medium text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                <Sparkles size={16} aria-hidden="true" /> Meet your AI advisor
              </AskAdvisorButton>
            </div>

            <div className="fx-fade-up fx-delay-3 mt-10">
              <p className="text-[11px] tracking-[0.2em] text-lavender-100/80">QUICK PICKS</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {quickPicks.map((q) => (
                  <li key={q.label}>
                    <Link
                      href={q.href}
                      className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm text-white ring-1 ring-white/25 backdrop-blur-sm transition hover:bg-white/20"
                    >
                      {q.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <span className="absolute bottom-3 right-5 text-[10px] text-white/50">
          {heroIsRendered ? "Rendered imagery" : "AI-generated imagery"}
        </span>
      </section>

      {/* ───────────── Values marquee ───────────── */}
      <section aria-label="Our standards" className="overflow-hidden border-b border-lavender-100 py-5">
        <div className="fx-marquee flex w-max">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
              {values.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 px-8 text-sm text-ink">
                  <Icon size={18} strokeWidth={1.6} className="text-plum-700" aria-hidden="true" />
                  <span className="whitespace-nowrap">{label}</span>
                  <span className="ml-8 text-mauve-400" aria-hidden="true">✦</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      {/* ───────────── Shop by ───────────── */}
      <section className="fx-reveal mx-auto max-w-7xl px-5 pt-20 md:px-12 md:pt-24">
        <SectionHeading eyebrow="EXPLORE" title="Shop by" />
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
          {tiles.map((c, i) => (
            <Link
              key={c.label}
              href={c.href}
              className={`group relative overflow-hidden ${
                i === tiles.length - 1 ? "col-span-2 aspect-[2/1] md:col-span-1 md:aspect-[4/5]" : "aspect-[4/5]"
              } rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-plum-700`}
            >
              <Image
                src={c.image}
                alt=""
                fill
                sizes="(min-width: 768px) 20vw, 50vw"
                className="object-cover transition duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-plum-900/75 via-plum-900/5 to-transparent" />
              <span className="absolute bottom-4 left-4 flex items-center gap-2 font-display text-xl text-white md:bottom-5 md:left-5 md:text-2xl">
                {c.label}
                <ArrowRight size={18} className="transition group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────────── Featured ───────────── */}
      <section className="fx-reveal mx-auto max-w-7xl px-5 pt-20 md:px-12 md:pt-24">
        <SectionHeading eyebrow="LIVE FROM THE CATALOG" title="Featured" href="/shop" linkLabel="View all" />
        <div className="mt-8">
          <Suspense fallback={<RailSkeleton />}>
            <FeaturedRail />
          </Suspense>
        </div>
      </section>

      {/* ───────────── Rituals ───────────── */}
      <section className="fx-reveal mx-auto max-w-7xl px-5 pt-20 md:px-12 md:pt-24">
        <SectionHeading eyebrow="CURATED SETS" title="Rituals, not just products" />
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-muted">
          Pieces chosen to be enjoyed together, with simple steps. Add the whole ritual in one tap. Prices and stock are live.
        </p>
        <Suspense fallback={<div className="mt-8 h-[520px] animate-pulse rounded-3xl bg-lavender-100/50" />}>
          <RitualGrid />
        </Suspense>
        <Link
          href="/rituals/build"
          className="group mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-lavender-100 bg-white px-7 py-6 transition hover:border-mauve-400/60"
        >
          <span>
            <span className="block font-display text-2xl text-plum-800">Build your own ritual</span>
            <span className="mt-1 block text-[14px] text-ink-muted">Pick a device, a glide that&apos;s safe with it and an extra. Save 10% on the set.</span>
          </span>
          <span className="inline-flex h-11 items-center gap-2 rounded-full bg-plum-700 px-6 text-sm font-medium text-white">
            Start building <ArrowRight size={15} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </Link>
      </section>

      {/* ───────────── Advisor ───────────── */}
      <section className="fx-reveal mx-auto mt-24 max-w-7xl px-5 md:mt-28 md:px-12">
        <div className="relative border-y border-lavender-100 py-14 md:py-20">

          <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="flex items-center gap-2 text-[11px] tracking-[0.2em] text-ink-muted">
                <Sparkles size={14} aria-hidden="true" /> AI SHOPPING ADVISOR
              </p>
              <h2 className="mt-4 font-display text-4xl leading-tight tracking-tight text-plum-800 md:text-5xl">
                Not sure where to start?
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-ink-muted">
                A private, judgment-free guide that only recommends what is in stock, within your budget,
                and backed by real reviews.
              </p>

              <ol className="mt-10 grid gap-6 sm:grid-cols-3">
                {steps.map((s) => (
                  <li key={s.n}>
                    <p className="font-display text-2xl text-mauve-400">{s.n}</p>
                    <p className="mt-2 font-medium text-ink">{s.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{s.body}</p>
                  </li>
                ))}
              </ol>

              <AskAdvisorButton className="mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-plum-700 px-7 font-medium text-white transition hover:-translate-y-0.5 hover:bg-plum-800"
              >
                Start a conversation <ArrowRight size={16} aria-hidden="true" />
              </AskAdvisorButton>
            </div>

            <figure className="rounded-3xl border border-lavender-100 bg-white p-5 shadow-xl shadow-plum-900/5 md:p-6">
              <figcaption className="mb-4 flex items-center justify-between text-xs text-ink-muted">
                <span className="flex items-center gap-1.5 font-medium text-plum-800">
                  <Sparkles size={14} aria-hidden="true" /> Afterglow advisor
                </span>
                <span className="rounded-full bg-lavender-50 px-2.5 py-1">Example conversation</span>
              </figcaption>
              <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-plum-700 px-4 py-3 text-sm text-white">
                First time, under $100, and it needs to be quiet.
              </div>
              <div className="mt-3 w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-lavender-50 px-4 py-3 text-sm text-ink">
                4 products fit every rule. Here are the 3 with the strongest review evidence for first-timers.
              </div>
              <Suspense fallback={<div className="mt-4 h-36 animate-pulse rounded-xl bg-lavender-50" />}>
                <AdvisorExamplePicks />
              </Suspense>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-ivory px-3 py-2.5 text-[12px] text-ink-muted">
                <SlidersHorizontal size={14} className="shrink-0 text-plum-700" aria-hidden="true" />
                Tool trace: catalog search → stock check → eligibility rules → reviews
              </div>
            </figure>
          </div>
        </div>
      </section>

      {/* ───────────── Beginner picks ───────────── */}
      <section className="fx-reveal mx-auto max-w-7xl px-5 pt-20 md:px-12 md:pt-24">
        <SectionHeading eyebrow="START HERE" title="Easy first picks" href="/shop?tag=beginner-friendly" linkLabel="See all" />
        <div className="mt-8">
          <Suspense fallback={<RailSkeleton />}>
            <BeginnerRail />
          </Suspense>
        </div>
      </section>

      {/* ───────────── Brands ───────────── */}
      <section className="fx-reveal mx-auto max-w-7xl px-5 pt-20 md:px-12 md:pt-24">
        <SectionHeading eyebrow="OUR HOUSE OF BRANDS" title="Four brands, one standard" />
        <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-lavender-100/50" />}>
          <BrandGrid />
        </Suspense>
      </section>

      {/* ───────────── Gifting + privacy ───────────── */}
      <section className="fx-reveal mx-auto mt-24 grid max-w-7xl items-center gap-10 px-5 md:mt-28 md:grid-cols-2 md:gap-14 md:px-12">
        <div className="relative aspect-[7/5] overflow-hidden rounded-[2rem] bg-lavender-50">
          <Suspense fallback={null}>
            <GiftImage />
          </Suspense>
        </div>
        <div>
          <p className="flex items-center gap-2 text-[11px] tracking-[0.2em] text-ink-muted">
            <Gift size={14} aria-hidden="true" /> GIFTING, PRIVATELY
          </p>
          <h2 className="mt-2 font-display text-4xl tracking-tight text-plum-800 md:text-5xl">
            Only for <span className="italic">you</span>.
          </h2>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-ink-muted">
            Add our keepsake gift box to any order: tissue-wrapped, ribbon-sealed, with a card carrying your words.
          </p>
          <ul className="mt-7 space-y-4 text-[16px] leading-relaxed text-ink-muted">
            <li className="flex gap-3">
              <PenLine size={20} className="mt-1 shrink-0 text-plum-700" aria-hidden="true" />
              A personal note, printed on the card. No prices inside.
            </li>
            <li className="flex gap-3">
              <Package size={20} className="mt-1 shrink-0 text-plum-700" aria-hidden="true" />
              Ships inside a plain outer box with a neutral sender name.
            </li>
            <li className="flex gap-3">
              <ShieldCheck size={20} className="mt-1 shrink-0 text-plum-700" aria-hidden="true" />
              No account needed, and advisor conversations are never saved.
            </li>
          </ul>
          <Link
            href={`/products/${GIFT_BOX}`}
            className="mt-9 inline-flex h-12 items-center gap-2 rounded-full bg-plum-700 px-7 font-medium text-white transition hover:-translate-y-0.5 hover:bg-plum-800"
          >
            <Gift size={16} aria-hidden="true" /> Choose a gift box
          </Link>
        </div>
      </section>
    </main>
  );
}
