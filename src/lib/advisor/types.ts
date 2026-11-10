// Types shared by the advisor engine, its API route and the chat UI.

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type TraceStep = {
  kind: "tool" | "rule" | "model";
  name: string;
  summary: string;
  input?: unknown;
  ms?: number;
  ok: boolean;
};

export type RecommendationCard = {
  handle: string;
  title: string;
  brand: string;
  price: string;
  imageUrl: string | null;
  rating: { average: number; count: number } | null;
  reason: string;
};

export type CartProposalLine = {
  variantId: string;
  handle: string;
  title: string;
  variantTitle: string | null;
  price: number;
  quantity: number;
};
export type CartProposal = { lines: CartProposalLine[]; total: number };

export type AdvisorReply = {
  mode: "ai" | "fallback";
  model: string | null;
  message: string;
  recommendations: RecommendationCard[];
  cart: CartProposal | null;
  notices: string[];
  trace: TraceStep[];
  latencyMs: number;
};
