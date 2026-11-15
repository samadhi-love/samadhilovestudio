"use client";
import type { CreditQuote } from "./data";
export async function productionFetch(url: string, init: RequestInit) {
  const input = typeof init.body === "string" ? JSON.parse(init.body) : {};
  const quoted = await fetch("/api/studio/credits", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "quote", route: url, input }), cache: "no-store" });
  const quote = await quoted.json() as CreditQuote & { error?: string };
  if (!quoted.ok) throw new Error(quote.error ?? "The production estimate could not load. No processing started.");
  if (quote.funding !== "studio" && quote.funding !== "own") throw new Error("The production estimate was incomplete. No processing started.");
  if (quote.funding === "studio" && (!quote.enabled || !window.confirm(`Start this production for ${quote.credits} SAMADHI credits?\n\nAvailable: ${quote.available} credits. Unsuccessful jobs are refunded.\nThis creates a new paid-processing attempt, including when requesting another variation.`))) {
    throw new Error(quote.enabled ? "Production canceled. No credits were reserved." : quote.message);
  }
  const headers = new Headers(init.headers);
  headers.set("X-Production-Id", crypto.randomUUID());
  if (quote.funding === "studio") headers.set("X-Studio-Credits-Accepted", String(quote.credits));
  try { return await fetch(url, { ...init, headers }); }
  finally { window.dispatchEvent(new window.Event("samadhi-usage-updated")); }
}
