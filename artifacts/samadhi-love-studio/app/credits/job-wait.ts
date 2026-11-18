/**
 * Waits for a saved server job (song creation, lyric timing) to finish.
 *
 * The job keeps running on the server whatever happens here. This only decides
 * how patiently the page keeps checking: phones drop signal, switch from Wi-Fi
 * to cellular, or sleep for a moment. Brief failures are retried quietly; only
 * a sustained outage gives up — and even then the work continues on the server
 * and appears in Your songs.
 */
export type JobStatus = {
  job?: {status: string; error_message?: string};
  result?: {body: unknown; status: number};
};

export const lostConnectionMessage =
  "Your song keeps being made on the server, but this page lost its connection. Check Your songs in a minute — don't press Create again.";

type Options = {
  signal?: AbortSignal;
  /** Gives up after this long without a single good answer (default 2 minutes). */
  outageLimitMs?: number;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  now?: () => number;
};

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", stop);
      resolve();
    }, ms);
    const stop = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    signal?.addEventListener("abort", stop, {once: true});
  });

/** Polls quickly at first (1.5 s), then eases off to every 5 s for long songs. */
export function pollDelay(attempt: number) {
  return Math.min(5000, 1500 + attempt * 250);
}

export async function waitForJob(check: () => Promise<Response>, options: Options = {}): Promise<JobStatus> {
  const sleep = options.sleep ?? wait;
  const now = options.now ?? Date.now;
  const outageLimit = options.outageLimitMs ?? 120_000;
  let lastGood = now();
  for (let attempt = 0; ; attempt++) {
    options.signal?.throwIfAborted();
    await sleep(pollDelay(attempt), options.signal);
    let saved: JobStatus | undefined;
    try {
      const response = await check();
      // 401/403/404 won't fix themselves by waiting: stop and explain.
      if ([401, 403, 404].includes(response.status)) throw new JobGone();
      if (response.ok) saved = (await response.json()) as JobStatus;
    } catch (error) {
      if (error instanceof JobGone) throw new Error("Your saved job continues on the server. Check Your songs before trying again.");
      if (options.signal?.aborted) throw error;
      // Network drop or a malformed reply: treat as temporary.
    }
    if (!saved) {
      if (now() - lastGood > outageLimit) throw new Error(lostConnectionMessage);
      continue;
    }
    lastGood = now();
    if (saved.job?.status === "done" || saved.job?.status === "failed") return saved;
  }
}

class JobGone extends Error {}
