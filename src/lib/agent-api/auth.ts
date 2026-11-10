import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";

// API keys look like lumen_sk_<43 random chars> (created by scripts/create-api-key.ts).
// Only a SHA-256 hash is stored, so a database leak doesn't leak usable keys.

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export type ApiCaller = { id: string; name: string; prefix: string };

export async function authenticate(req: Request): Promise<ApiCaller | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(lumen_sk_[A-Za-z0-9_-]{20,100})$/);
  if (!match) return null;
  const row = await db.apiKey.findUnique({ where: { keyHash: hashApiKey(match[1]) } });
  if (!row || row.revokedAt) return null;
  // Best-effort usage stamp; never blocks the request.
  db.apiKey.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return { id: row.id, name: row.name, prefix: row.prefix };
}

// 60 calls per minute per key (in memory, per server instance).
const WINDOW_MS = 60_000;
const LIMIT = 60;
const hits = new Map<string, number[]>();

export function rateLimit(keyId: string): { ok: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const recent = (hits.get(keyId) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(keyId, recent);
  return { ok: recent.length <= LIMIT, remaining: Math.max(0, LIMIT - recent.length), resetMs: WINDOW_MS - (now - recent[0]) };
}
