import { createHmac, timingSafeEqual } from "node:crypto";

// Signed session tokens: base64url(JSON payload) + "." + HMAC-SHA256 signature.
// Tamper-proof (any change breaks the signature) and self-expiring. No
// database lookup needed, so the proxy can check them cheaply too.

export type Role = "merchant" | "retailer";

export type Session = {
  v: 1;
  role: Role;
  name: string;
  locationId?: string; // retailers only: the Shopify company location they may see
  company?: string;
  exp: number; // unix ms
};

export const SESSION_COOKIE = "lumen_session";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET (32+ chars) is required in production");
  // Local development only: a fixed fallback so sign-in works before the secret is set.
  return "dev-only-insecure-secret-change-me-0123456789";
}

const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

export function encodeSession(s: Session): string {
  const data = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function decodeSession(token: string | undefined | null): Session | null {
  if (!token || token.length > 2048) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = Buffer.from(sign(data));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const s = JSON.parse(Buffer.from(data, "base64url").toString()) as Session;
    if (s.v !== 1 || (s.role !== "merchant" && s.role !== "retailer") || typeof s.exp !== "number") return null;
    if (Date.now() > s.exp) return null;
    if (s.role === "retailer" && !s.locationId) return null;
    return s;
  } catch {
    return null;
  }
}

// Only allow redirects back to our own pages (no open redirects).
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  return next && /^\/(?!\/)[\w\-/?=&%.]*$/.test(next) ? next : fallback;
}
