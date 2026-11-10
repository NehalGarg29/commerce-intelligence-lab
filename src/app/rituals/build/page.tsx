import { Suspense } from "react";
import type { Metadata } from "next";
import { getProducts } from "@/lib/catalog";
import { BUNDLE_DISCOUNT_PCT, bundleOptions } from "@/lib/bundle";
import { BundleBuilder } from "@/components/rituals/bundle-builder";

export const metadata: Metadata = {
  title: "Build your ritual · Lumen Atelier",
  description: `Pick a device, a glide and an extra, and save ${BUNDLE_DISCOUNT_PCT}% on the set.`,
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function Builder({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).device;
  const device = typeof raw === "string" && /^[a-z0-9-]{1,80}$/.test(raw) ? raw : null;
  const { devices, care, extras } = bundleOptions(await getProducts());
  return <BundleBuilder devices={devices} care={care} extras={extras} initialDevice={device} />;
}

export default function BuildRitualPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-7xl px-5 pb-16 pt-10 md:px-12 md:pt-14">
      <header className="max-w-3xl">
        <p className="text-[11px] tracking-[0.2em] text-ink-muted">BUILD YOUR RITUAL</p>
        <h1 className="mt-3 font-display text-5xl tracking-tight text-plum-800 md:text-6xl">
          Three pieces. <em className="font-normal italic text-plum-700">{BUNDLE_DISCOUNT_PCT}% off.</em>
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-muted">
          Choose a device, a glide that&apos;s safe with it, and one extra. We check compatibility as you go.
        </p>
      </header>
      <div className="mt-12">
        <Suspense fallback={<div className="h-[600px] animate-pulse rounded-3xl bg-lavender-100/60" />}>
          <Builder searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
