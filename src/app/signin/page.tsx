import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Building2, ShieldAlert, ShoppingBag } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/token";
import { listRetailers } from "@/lib/b2b/retailers";
import { signInAction, signOutAction } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Sign in · Lumen Atelier", robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function PersonaButton({
  persona,
  next,
  icon: Icon,
  title,
  sub,
  access,
}: {
  persona: string;
  next: string;
  icon: typeof Building2;
  title: string;
  sub: string;
  access: string;
}) {
  return (
    <form action={signInAction}>
      <input type="hidden" name="persona" value={persona} />
      <input type="hidden" name="next" value={next} />
      <button
        type="submit"
        className="group flex h-full w-full flex-col rounded-3xl border border-lavender-100 bg-white p-6 text-left transition hover:-translate-y-0.5 hover:border-mauve-400/60 hover:shadow-[0_12px_30px_-18px_rgba(46,15,41,0.35)]"
      >
        <Icon size={22} className="text-plum-700" aria-hidden="true" />
        <span className="mt-4 font-display text-xl text-ink group-hover:text-plum-700">{title}</span>
        <span className="mt-1 text-[13px] text-ink-muted">{sub}</span>
        <span className="mt-4 rounded-2xl bg-lavender-50 px-3 py-2 text-[12px] leading-relaxed text-plum-800">{access}</span>
      </button>
    </form>
  );
}

async function SignIn({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const next = safeNext(one(sp.next), "/");
  const denied = one(sp.denied) === "1";
  const [session, { retailers, source }] = await Promise.all([getSession(), listRetailers()]);

  return (
    <>
      {denied && (
        <p className="mt-6 flex items-start gap-2 rounded-2xl bg-[#FBEADD] px-4 py-3 text-[14px] text-[#8A4B0F]">
          <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          Your current role can&apos;t open that page. Sign in with a role that has access.
        </p>
      )}
      {session && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-lavender-100 bg-white px-5 py-4 text-[14px]">
          <span>
            Signed in as <strong className="font-medium text-ink">{session.name}</strong>
          </span>
          <form action={signOutAction}>
            <button type="submit" className="text-plum-800 underline underline-offset-4">Sign out</button>
          </form>
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-[11px] tracking-[0.2em] text-ink-muted">BRAND STAFF</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <PersonaButton
            persona="merchant"
            next={next}
            icon={BarChart3}
            title="Merchant team"
            sub="Brand e-commerce, sales and operations"
            access="Insights · every retail partner · marketing kits"
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] tracking-[0.2em] text-ink-muted">
          RETAIL PARTNERS {source === "shopify" ? "· FROM SHOPIFY B2B" : "· DEMO RETAILERS"}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {retailers.map((r) => (
            <PersonaButton
              key={r.id}
              persona={`retailer:${r.id}`}
              next={next}
              icon={Building2}
              title={`Buyer at ${r.company}`}
              sub={`${r.location}${r.city ? ` · ${r.city}` : ""}`}
              access="Only this company's portal, prices and kits"
            />
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-3xl bg-lavender-50 p-6">
        <p className="flex items-center gap-2 font-display text-lg text-ink">
          <ShoppingBag size={18} className="text-plum-700" aria-hidden="true" /> Shopping for yourself?
        </p>
        <p className="mt-1 text-[14px] text-ink-muted">
          No account needed. Browse, ask the advisor and check out securely with Shopify.{" "}
          <Link href="/shop" className="text-plum-800 underline underline-offset-4">Go to the shop</Link>
        </p>
      </section>
    </>
  );
}

export default function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-16 pt-10 md:px-12 md:pt-14">
      <p className="text-[11px] tracking-[0.2em] text-ink-muted">DEMO SIGN-IN</p>
      <h1 className="mt-3 font-display text-5xl tracking-tight text-plum-800">Sign in</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
        Choose who you are for this demo. Each role gets a signed session and sees only what it&apos;s allowed to. In
        production, retail buyers would sign in with Shopify customer accounts and staff with company SSO.
      </p>
      <Suspense fallback={<div className="mt-10 h-64 animate-pulse rounded-3xl bg-lavender-100/60" />}>
        <SignIn searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
