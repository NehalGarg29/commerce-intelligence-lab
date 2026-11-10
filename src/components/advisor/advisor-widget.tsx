"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Maximize2, Sparkles, X } from "lucide-react";
import { useCompare } from "@/lib/compare-store";
import { OPEN_ADVISOR_EVENT, type OpenAdvisorDetail } from "@/lib/advisor/open";
import { AdvisorChat, useAdvisorConversation } from "./advisor-chat";
import { track } from "@/lib/analytics/track";

// Site-wide chat bubble. It lives in the root layout, so the conversation
// survives navigation: ask, open a recommended product, come back.
export function AdvisorWidget() {
  const pathname = usePathname();
  const convo = useAdvisorConversation();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(0); // turns already seen when the panel was last closed
  const { items } = useCompare();
  const askRef = useRef(convo.ask);

  useEffect(() => {
    askRef.current = convo.ask;
  }, [convo.ask]);

  // Any "Ask the advisor" button on the site opens the widget (optionally with a question).
  useEffect(() => {
    const onOpen = (e: Event) => {
      track("advisor_open");
      setOpen(true);
      const prompt = (e as CustomEvent<OpenAdvisorDetail>).detail?.prompt;
      if (prompt) askRef.current(prompt);
    };
    window.addEventListener(OPEN_ADVISOR_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_ADVISOR_EVENT, onOpen);
  }, []);

  const turnCount = convo.turns.length;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSeen(turnCount);
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, turnCount]);

  const close = () => {
    setSeen(turnCount);
    setOpen(false);
  };

  // The full-page advisor has its own chat.
  if (pathname === "/advisor") return null;

  // Sit above the compare bar when it's showing.
  const lifted = items.length > 0 && pathname !== "/compare";
  // A reply arrived after the panel was closed.
  const unread = !open && turnCount > seen && convo.turns[turnCount - 1].role !== "user";

  return (
    <>
      {open && (
        <section
          role="dialog"
          aria-label="Lumen advisor"
          className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-ivory sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(680px,calc(100vh-3rem))] sm:w-[420px] sm:rounded-3xl sm:border sm:border-lavender-100 sm:shadow-[0_30px_80px_-30px_rgba(46,15,41,0.55)]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-lavender-100 bg-white/80 px-5 py-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-plum-800 text-ivory">
                <Sparkles size={16} aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-lg leading-tight text-plum-800">Lumen advisor</p>
                <p className="text-[12px] text-ink-muted">Private · checks live stock and reviews</p>
              </div>
            </div>
            <div className="flex items-center">
              <Link
                href="/advisor"
                onClick={close}
                aria-label="Open full-page advisor"
                className="hidden rounded-full p-2.5 text-ink-muted transition hover:bg-lavender-50 hover:text-plum-700 sm:inline-flex"
              >
                <Maximize2 size={17} aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={close}
                aria-label="Close advisor"
                className="rounded-full p-2.5 text-ink-muted transition hover:bg-lavender-50 hover:text-plum-700"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>
          </header>
          <AdvisorChat
            convo={convo}
            variant="widget"
            // On phones the chat covers the page, so get out of the way when a product is opened.
            onNavigate={() => window.matchMedia("(max-width: 639px)").matches && close()}
          />
        </section>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => {
            track("advisor_open");
            setOpen(true);
          }}
          aria-label="Open the AI shopping advisor"
          className={`fixed right-4 z-[55] flex h-14 items-center gap-2.5 rounded-full bg-plum-800 pl-4 pr-5 text-ivory shadow-[0_16px_40px_-12px_rgba(46,15,41,0.6)] transition hover:-translate-y-0.5 hover:bg-plum-700 sm:right-6 ${
            lifted ? "bottom-24 sm:bottom-28" : "bottom-4 sm:bottom-6"
          }`}
        >
          <Sparkles size={18} aria-hidden="true" />
          <span className="text-[15px] font-medium">Ask the advisor</span>
          {unread && <span className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-plum-800 bg-mauve-400" aria-label="New reply" />}
        </button>
      )}
    </>
  );
}
