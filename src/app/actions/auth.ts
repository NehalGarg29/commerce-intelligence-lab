"use server";

import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { endSession, startSession } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/token";
import { getRetailer } from "@/lib/b2b/retailers";

// Demo sign-in: choose a persona. The persona is re-validated on the server
// (a retailer must exist in Shopify B2B right now), then a signed session is set.
// Production would replace this with Shopify customer accounts (B2B buyers) and SSO (staff).
function codeOk(given: string): boolean {
  const expected = process.env.DEMO_ACCESS_CODE;
  if (!expected) return true; // not required (local development)
  const a = Buffer.from(given.trim());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function signInAction(formData: FormData): Promise<void> {
  const persona = String(formData.get("persona") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""), "/");
  if (!codeOk(String(formData.get("code") ?? "").slice(0, 100))) {
    redirect(`/signin?next=${encodeURIComponent(next)}&code=invalid`);
  }

  if (persona === "merchant") {
    await startSession({ role: "merchant", name: "Merchant team" });
    redirect(next === "/" ? "/insights" : next);
  }

  const match = persona.match(/^retailer:([\w-]{1,40})$/);
  if (!match) redirect("/signin");
  const retailer = await getRetailer(match[1]);
  if (!retailer) redirect("/signin");

  await startSession({ role: "retailer", name: `Buyer at ${retailer.company}`, locationId: retailer.id, company: retailer.company });
  // Retailers can only land on their own portal or a marketing kit.
  const own = `/retail/${retailer.id}`;
  redirect(next === own || next.startsWith("/retail/kit/") ? next : own);
}

export async function signOutAction(): Promise<void> {
  await endSession();
  redirect("/");
}
