"use client";
import type { CreditQuote } from "./data";
export async function productionFetch(url: string, init: RequestInit) {
  const input = typeof init.body === "string" ? JSON.parse(init.body) : {};
  let quoted: Response;
  let quote: CreditQuote & { error?: string };
  try {
    quoted = await fetch("/api/studio/credits", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "quote", route: url, input }), cache: "no-store" });
    quote = await quoted.json() as CreditQuote & { error?: string };
    if (!quote || typeof quote !== "object") throw new Error("Invalid estimate response");
  } catch {
    throw new Error("Studio could not connect to check the production estimate. No generation request was sent. Keep your prompt, check your connection, then reopen Studio directly in a browser tab.");
  }
  if (!quoted.ok) throw new Error(quote.error ?? "The production estimate could not load. No processing started.");
  if (quote.funding !== "studio" && quote.funding !== "own") throw new Error("The production estimate was incomplete. No processing started.");
  if (quote.funding === "studio" && (!quote.enabled || !window.confirm(`Start this production for ${quote.credits} SAMADHI credits?\n\nAvailable: ${quote.available} credits. Unsuccessful jobs are refunded.\nThis creates a new paid-processing attempt, including when requesting another variation.`))) {
    throw new Error(quote.enabled ? "Production canceled. No credits were reserved." : quote.message);
  }
  const headers = new Headers(init.headers);
  headers.set("X-Production-Id", crypto.randomUUID());
  if (quote.funding === "studio") headers.set("X-Studio-Credits-Accepted", String(quote.credits));
  try {
    return await submitProduction(url,{...init,headers},input);
  }
  catch {
    throw new Error("The connection was lost while submitting production. Generation may already have started. Do not click Generate again yet: check My Songs and your provider history first to avoid a duplicate charge. Your prompt is still in this form.");
  }
  finally { window.dispatchEvent(new window.Event("samadhi-usage-updated")); }
}
/** Submit work for a quote already confirmed by the user (e.g. Party Files). */
export async function submitProduction(url:string,init:RequestInit,input:Record<string,unknown>){
    const durable=url==="/api/studio/lyric-sync"||url==="/api/studio/create"&&input.action==="song";
    const response=await fetch(durable?"/api/studio/jobs":url,{...init,body:durable?JSON.stringify({route:url,input}):init.body});
    if(!durable||response.status!==202)return response;
    const queued=await response.json() as {jobId?:unknown;songId?:string};
    if(typeof queued.jobId!=="string")throw new Error("The job reference could not be confirmed.");
    window.dispatchEvent(new window.Event("samadhi-jobs-updated"));
    while(true){
      init.signal?.throwIfAborted();
      await new Promise<void>(resolve=>setTimeout(resolve,1500));
      const status=await fetch(`/api/studio/jobs?id=${encodeURIComponent(queued.jobId)}`,{signal:init.signal,cache:"no-store"});
      if(!status.ok)throw new Error("Your saved job continues on the server. Check My Songs before trying again.");
      const saved=await status.json() as {job?:{status:string;error_message?:string};result?:{body:unknown;status:number}};
      if(saved.job?.status==="done"||saved.job?.status==="failed"){
        window.dispatchEvent(new window.Event("samadhi-jobs-updated"));
        if(saved.result)return Response.json(saved.result.body,{status:saved.result.status});
        return Response.json({error:saved.job.error_message??"This attempt didn't finish. Your draft is saved.",songId:queued.songId},{status:502});
      }
    }
}
