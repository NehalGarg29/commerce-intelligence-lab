import { Suspense } from "react";
import type { Metadata } from "next";
import { AdvisorPageChat } from "@/components/advisor/advisor-page-chat";

export const metadata: Metadata = {
  title: "Advisor · Lumen Atelier",
  description: "A shopping advisor that checks live stock, demo reviews and store rules before it recommends anything.",
};

export default function AdvisorPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 pb-10 pt-10 md:px-12 md:pt-14">
      <header className="mx-auto mb-8 max-w-3xl">
        <p className="text-[11px] tracking-[0.2em] text-ink-muted">LUMEN ADVISOR</p>
        <h1 className="mt-3 font-display text-5xl tracking-tight text-plum-800 md:text-6xl">
          Ask, <em className="font-normal italic text-plum-700">privately.</em>
        </h1>
      </header>
      <Suspense fallback={<div className="mx-auto h-64 max-w-3xl animate-pulse rounded-3xl bg-lavender-100/60" />}>
        <AdvisorPageChat />
      </Suspense>
    </main>
  );
}
