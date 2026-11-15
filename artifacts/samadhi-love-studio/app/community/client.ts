"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { communityApi } from "./data";

export class CommunityError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function communityRequest<T>(url: string, input?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store", signal,
    ...(input && { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }),
  });
  const result = await response.json().catch(() => null) as (T & { error?: string }) | null;
  if (!response.ok || !result) throw new CommunityError(result?.error ?? "Community is temporarily unavailable. Try again.", response.status);
  return result;
}

export function useCommunityResource<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const version = useRef(0);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const request = ++version.current;
    try {
      const result = await communityRequest<T>(url, undefined, signal);
      if (request === version.current && !signal?.aborted) { setData(result); setError(""); }
      return true;
    } catch (error) {
      if (request === version.current && !signal?.aborted)
        setError(error instanceof Error ? error.message : "Community could not load.");
      return false;
    }
  }, [url]);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  async function update(input: Record<string, unknown>, message?: string) {
    if (pending.current) return false;
    pending.current = true;
    setBusy(true); setError(""); setNotice("");
    try {
      await communityRequest(communityApi, input);
      await refresh();
      if (message) setNotice(message);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "The change could not be saved.");
      return false;
    } finally {
      pending.current = false; setBusy(false);
    }
  }
  return { data, error, setError, notice, setNotice, busy, refresh, update };
}
