import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { getProducts } from "@/lib/catalog";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { getGuide, guideFor, GUIDES, GUIDE_DISCLAIMER } from "@/lib/guides";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  return guide
    ? { title: `${guide.name}: how to use · Afterglow`, description: guide.summary }
    : { title: "Guide not found · Afterglow" };
}

async function GuideProducts({ slug }: { slug: string }) {
  const products = (await getProducts()).filter((p) => guideFor(p)?.slug === slug);
  if (products.length === 0) return null;
  return (
    <section className="mt-20">
      <p className="text-[11px] tracking-[0.2em] text-ink-muted">IN THE SHOP</p>
      <h2 className="mt-2 font-display text-3xl tracking-tight text-plum-800">Products in this guide</h2>
      <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

async function GuideView({ params }: { params: Params }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  const others = GUIDES.filter((g) => g.group === guide.group && g.slug !== guide.slug).slice(0, 4);

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-[13px] text-ink-muted">
        <Link href="/guides" className="hover:text-plum-700">Guides</Link> <span aria-hidden="true">/</span>{" "}
        <span className="text-ink">{guide.name}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <h1 className="font-display text-5xl tracking-tight text-plum-800 md:text-6xl">{guide.name}</h1>
          <p className="mt-6 font-display text-2xl leading-snug text-ink">{guide.summary}</p>
          <p className="mt-10 text-[11px] tracking-[0.18em] text-ink-muted">GOOD FOR</p>
          <ul className="mt-3 space-y-2.5">
            {guide.goodFor.map((g) => (
              <li key={g} className="flex items-start gap-2.5 text-[16px] text-ink">
                <Check size={18} className="mt-0.5 shrink-0 text-plum-700" aria-hidden="true" /> {g}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-lavender-100 bg-white p-7 md:p-10">
          <p className="text-[11px] tracking-[0.18em] text-ink-muted">GETTING STARTED</p>
          <ol className="mt-5 space-y-5">
            {guide.steps.map((s, i) => (
              <li key={s} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-plum-800 text-[14px] font-medium text-ivory">
                  {i + 1}
                </span>
                <p className="pt-1 text-[16px] leading-relaxed text-ink">{s}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 border-t border-lavender-100 pt-5 text-[12px] leading-relaxed text-ink-muted">
            {GUIDE_DISCLAIMER}
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <GuideProducts slug={guide.slug} />
      </Suspense>

      {others.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl tracking-tight text-plum-800">Related guides</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {others.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="rounded-full border border-lavender-100 bg-white px-5 py-2.5 text-[14px] text-ink transition hover:border-mauve-400 hover:text-plum-700"
              >
                {g.name}
              </Link>
            ))}
            <Link href="/guides" className="rounded-full px-5 py-2.5 text-[14px] font-medium text-plum-800 hover:underline">
              All guides →
            </Link>
          </div>
        </section>
      )}
    </>
  );
}

export default function GuidePage({ params }: { params: Params }) {
  return (
    <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 md:px-12 md:pt-12">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-lavender-100/60" />}>
        <GuideView params={params} />
      </Suspense>
    </main>
  );
}
