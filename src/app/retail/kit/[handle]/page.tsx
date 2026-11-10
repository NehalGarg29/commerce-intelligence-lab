import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ShieldCheck } from "lucide-react";
import { getProduct } from "@/lib/catalog";
import { getProductReviews } from "@/lib/reviews";
import { buildKit } from "@/lib/b2b/kit";
import { CopyButton } from "@/components/b2b/copy-button";
import { requireSignedIn } from "@/lib/auth/session";

type Params = Promise<{ handle: string }>;

export const metadata: Metadata = { title: "Marketing kit · Lumen Atelier", robots: { index: false, follow: false } };

function Block({ title, copy, children }: { title: string; copy?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-lavender-100 bg-white p-6 md:p-7">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-xl text-ink">{title}</h2>
        {copy && <CopyButton text={copy} />}
      </div>
      <div className="mt-4 text-[15px] leading-relaxed text-ink-muted">{children}</div>
    </section>
  );
}

async function Kit({ params }: { params: Params }) {
  const { handle } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(handle)) notFound();
  const session = await requireSignedIn(`/retail/kit/${handle}`);
  const [product, intel] = await Promise.all([getProduct(handle), getProductReviews(handle)]);
  if (!product) notFound();
  const k = buildKit(product, intel);

  return (
    <>
      <Link href={session.role === "merchant" ? "/retail" : `/retail/${session.locationId}`} className="text-[13px] text-ink-muted hover:text-plum-700">
        ← Retail partner portal
      </Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-ink-muted">MARKETING KIT</p>
          <h1 className="mt-3 font-display text-5xl tracking-tight text-plum-800">{k.title}</h1>
          <p className="mt-2 text-[15px] text-ink-muted">{k.brand} · Suggested retail (MSRP) {k.retailPrice}</p>
        </div>
        <a
          href={`/api/retail/kit/${k.handle}`}
          download
          className="inline-flex h-11 items-center gap-2 rounded-full bg-plum-700 px-6 text-sm font-medium text-white transition hover:bg-plum-800"
        >
          <Download size={15} aria-hidden="true" /> Download kit (.md)
        </a>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Block title="Approved description" copy={k.description}>
          <p>{k.description}</p>
        </Block>
        <Block title="Key features" copy={k.features.join(", ")}>
          <ul className="flex flex-wrap gap-2">
            {k.features.map((f) => (
              <li key={f} className="rounded-full bg-lavender-50 px-3 py-1 text-[13px] text-plum-800">{f}</li>
            ))}
          </ul>
        </Block>
        <Block title="Ready-to-use captions">
          <ul className="space-y-3">
            {k.captions.map((c) => (
              <li key={c} className="flex items-start justify-between gap-3 rounded-2xl bg-ivory p-3 text-ink">
                <span>{c}</span>
                <CopyButton text={c} />
              </li>
            ))}
          </ul>
        </Block>
        {k.howTo && (
          <Block title="How to use (for staff)" copy={[k.howTo.summary, ...k.howTo.steps].join("\n")}>
            <p>{k.howTo.summary}</p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5">
              {k.howTo.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </Block>
        )}
        {k.care.length > 0 && (
          <Block title="Care" copy={k.care.join("\n")}>
            <ul className="list-disc space-y-1.5 pl-5">
              {k.care.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Block>
        )}
        <Block title="Usage rules">
          <ul className="space-y-2">
            {k.rules.map((r) => (
              <li key={r} className="flex items-start gap-2">
                <ShieldCheck size={15} className="mt-1 shrink-0 text-plum-700" aria-hidden="true" /> {r}
              </li>
            ))}
          </ul>
          {k.praisedFor.length > 0 && (
            <p className="mt-4 text-[13px]">
              Internal only (demo reviews): shoppers most often praise {k.praisedFor.map((x) => `${x.label.toLowerCase()} (${x.mentions})`).join(", ")}.
            </p>
          )}
        </Block>
      </div>

      {k.images.length > 0 && (
        <section className="mt-5 rounded-3xl border border-lavender-100 bg-white p-6 md:p-7">
          <h2 className="font-display text-xl text-ink">Images</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {k.images.map((img) => (
              <li key={img.url}>
                <a href={img.url} target="_blank" rel="noreferrer" className="group block">
                  <span className="relative block aspect-square overflow-hidden rounded-2xl bg-lavender-50">
                    <Image src={img.url} alt={img.alt} fill sizes="200px" className="object-cover transition group-hover:scale-105" />
                  </span>
                  <span className="mt-2 block text-[12px] text-ink-muted">Open full size</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export default function KitPage({ params }: { params: Params }) {
  return (
    <main className="mx-auto max-w-7xl px-5 pb-16 pt-10 md:px-12 md:pt-14">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-lavender-100/60" />}>
        <Kit params={params} />
      </Suspense>
    </main>
  );
}
