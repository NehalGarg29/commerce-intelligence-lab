"use client";

import { useSearchParams } from "next/navigation";
import { AdvisorChat, useAdvisorConversation } from "./advisor-chat";

// Full-page advisor (/advisor). ?q= pre-fills the question box.
export function AdvisorPageChat() {
  const params = useSearchParams();
  const convo = useAdvisorConversation();
  return <AdvisorChat convo={convo} variant="page" initialInput={params.get("q") ?? ""} />;
}
