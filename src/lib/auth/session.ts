import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decodeSession, encodeSession, SESSION_COOKIE, SESSION_TTL_MS, type Session } from "./token";

// The authorization layer. Every protected page and route calls one of these
// on the server, so access rules don't depend on the proxy alone.

export const getSession = cache(async (): Promise<Session | null> => {
  return decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
});

export async function startSession(s: Omit<Session, "v" | "exp">) {
  (await cookies()).set(SESSION_COOKIE, encodeSession({ ...s, v: 1, exp: Date.now() + SESSION_TTL_MS }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function requireMerchant(next: string): Promise<Session> {
  const s = await getSession();
  if (!s) redirect(`/signin?next=${encodeURIComponent(next)}`);
  if (s.role !== "merchant") redirect(`/signin?next=${encodeURIComponent(next)}&denied=1`);
  return s;
}

// Merchants can see every retailer; a retailer only their own location.
export async function canViewRetailer(locationId: string): Promise<{ session: Session | null; allowed: boolean }> {
  const s = await getSession();
  return { session: s, allowed: !!s && (s.role === "merchant" || s.locationId === locationId) };
}

export async function requireSignedIn(next: string): Promise<Session> {
  const s = await getSession();
  if (!s) redirect(`/signin?next=${encodeURIComponent(next)}`);
  return s;
}
