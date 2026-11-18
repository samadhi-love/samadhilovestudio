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
  "Didn't finish checking your saved work. Try again in Saved work status to reconnect. Your song may still be running — don't press Create again.";

/** A confirmed job exists; reconnecting must never resubmit its paid work. */
export class JobWaitError extends Error {
  constructor(message = lostConnectionMessage) {
    super(message);
    this.name = "JobWaitError";
  }
}

type Options = {
  signal?: AbortSignal;
  /** Gives up after this long without a single good answer (default 2 minutes). */
  outageLimitMs?: number;
  requestTimeoutMs?: number;
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

/** Bound both fetch and response-body reading, even if the transport ignores abort. */
export async function readJobReply<T>(
  check: (signal: AbortSignal) => Promise<Response>,
  timeoutMs = 15_000,
  signal?: AbortSignal,
): Promise<{status: number; body?: T}> {
  signal?.throwIfAborted();
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stop: (() => void) | undefined;
  try {
    return await Promise.race([
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          const error = new JobWaitError();
          controller.abort(error);
          reject(error);
        }, timeoutMs);
        stop = () => {
          controller.abort(signal?.reason);
          reject(signal?.reason);
        };
        signal?.addEventListener("abort", stop, {once: true});
      }),
      Promise.resolve().then(async () => {
        controller.signal.throwIfAborted();
        const response = await check(controller.signal);
        return {status: response.status, body: response.ok ? await response.json() as T : undefined};
      }),
    ]);
  } finally {
    clearTimeout(timer);
    if (stop) signal?.removeEventListener("abort", stop);
  }
}

export async function waitForJob(check: (signal: AbortSignal) => Promise<Response>, options: Options = {}): Promise<JobStatus> {
  const sleep = options.sleep ?? wait;
  const now = options.now ?? Date.now;
  const outageLimit = options.outageLimitMs ?? 120_000;
  let lastGood = now();
  for (let attempt = 0; ; attempt++) {
    options.signal?.throwIfAborted();
    let remaining = outageLimit - (now() - lastGood);
    if (remaining <= 0) throw new JobWaitError();
    await sleep(Math.min(pollDelay(attempt), remaining), options.signal);
    remaining = outageLimit - (now() - lastGood);
    if (remaining < 0) throw new JobWaitError();
    let saved: JobStatus | undefined;
    try {
      const response = await readJobReply<JobStatus>(
        check, Math.max(1, Math.min(options.requestTimeoutMs ?? 15_000, remaining)), options.signal,
      );
      // 401/403/404 won't fix themselves by waiting: stop and explain.
      if ([401, 403, 404].includes(response.status)) throw new JobGone();
      if (response.body?.job && ["waiting", "working", "done", "failed"].includes(response.body.job.status))
        saved = response.body;
    } catch (error) {
      if (error instanceof JobGone) throw new JobWaitError("Didn't finish checking your saved work. Check Your songs and sign in again before trying again. Don't press Create again.");
      if (options.signal?.aborted) throw error;
      // Network drop or a malformed reply: treat as temporary.
    }
    if (!saved) {
      if (now() - lastGood >= outageLimit) throw new JobWaitError();
      continue;
    }
    lastGood = now();
    if (saved.job?.status === "done" || saved.job?.status === "failed") return saved;
  }
}

class JobGone extends Error {}
