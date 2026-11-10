"use client";

import type { AddSource, ClientEvent } from "./events";

const SESSION_KEY = "lumen:sid";

// Random id per browser tab, so the funnel can be counted per visit without
// knowing who anyone is. Falls back to an in-memory id if storage is blocked.
let memorySid: string | null = null;
function sessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    memorySid ??= crypto.randomUUID();
    return memorySid;
  }
}

export function track(type: ClientEvent, data: { productHandle?: string; source?: AddSource; count?: number } = {}) {
  try {
    const body = JSON.stringify({ type, sessionId: sessionId(), ...data });
    // sendBeacon survives page navigation (e.g. clicking through to checkout).
    if (!navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }))) {
      fetch("/api/events", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    }
  } catch {
    // Analytics must never break the store.
  }
}
