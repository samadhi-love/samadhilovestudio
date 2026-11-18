export const plans = {
  free: { name: "Explorer", price: 0, credits: 0, concurrent: 1, daily: 3, musicSeconds: 360 },
  creator: { name: "Creator", price: 15, credits: 300, concurrent: 1, daily: 20, musicSeconds: 360 },
  pro: { name: "Artist Pro", price: 29, credits: 800, concurrent: 2, daily: 60, musicSeconds: 360 },
  studio: { name: "Studio", price: 49, credits: 1500, concurrent: 3, daily: 100, musicSeconds: 360 },
} as const;
export type Plan = keyof typeof plans;
export type Funding = "own" | "studio";
export type Operation = "music" | "lyrics" | "captions" | "stems" | "voice";
export const operationNames: Record<Operation, string> = { music: "Song generation", lyrics: "Lyric planning", captions: "Caption processing", stems: "Stem separation", voice: "Voice design" };
export function creditPrice(operation: Operation, seconds: number) {
  // Draft retail credit schedule. Activation requires the operator's approved provider quote.
  if (operation === "lyrics") return 2;
  if (operation === "voice") return 0; // Personal connection only; never use the business key.
  return Math.ceil(seconds * ({ music: 18, captions: 1, stems: 12 }[operation]) / 60);
}
export type CreditAccount = { owner: string; plan: Plan; funding: Funding; status: "free" | "beta" | "active" | "paused"; balance: number; period_start: number; period_end: number; last_change: string };
export type UsageJob = { id: string; operation: Operation; funding: Funding; credits: number; seconds: number; status: "held" | "complete" | "refunded"; created_at: number; updated_at: number };
export type CreditsData = { account: Omit<CreditAccount, "last_change">; plans: typeof plans; managedAvailable: boolean;
  billingActive: boolean; limits: { concurrent: number; daily: number; musicSeconds: number; uploadMB: number };
  held: number; active: number; today: number; used: number; expired: boolean; jobs: UsageJob[];
  ledger: { id: string; amount: number; kind: string; note: string; created_at: number }[]; owner: boolean;
};
export type CreditQuote = { operation: Operation; seconds: number; credits: number; funding: Funding; available: number; enabled: boolean; message: string };
