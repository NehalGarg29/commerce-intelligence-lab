export type Tone = "plum" | "rose" | "ivory" | "sage" | "sand";

const tones: Record<Tone, { bg: string; shape: string }> = {
  plum: { bg: "bg-[#E9E3F2]", shape: "bg-[#8E5A84]" },
  rose: { bg: "bg-[#F6ECEF]", shape: "bg-[#D3A6B4]" },
  ivory: { bg: "bg-[#F3EEE6]", shape: "bg-[#E4D8C8]" },
  sage: { bg: "bg-[#EAEFE7]", shape: "bg-[#9DAE97]" },
  sand: { bg: "bg-[#F2EEE6]", shape: "bg-[#C2A98A]" },
};

export function ProductArt({ tone = "plum", className = "h-64" }: { tone?: Tone; className?: string }) {
  const t = tones[tone];
  return (
    <div className={`relative overflow-hidden rounded-2xl ${t.bg} ${className}`} aria-hidden="true">
      <div
        className={`absolute left-1/2 top-1/2 h-[38%] w-[55%] -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-[50%] ${t.shape} shadow-[0_24px_40px_-12px_rgba(58,18,51,0.35)]`}
      />
    </div>
  );
}
