/**
 * Runs saves one at a time instead of dropping a save that arrives while
 * another is in flight. `isBusy` also covers saves started outside this queue
 * (editors that persist on their own); a queued save waits for those too.
 * A failed save never blocks the ones queued behind it.
 */
export function createSaveQueue(isBusy: () => boolean, waitMs = 50) {
  let tail: Promise<unknown> = Promise.resolve();
  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = tail.then(async () => {
      while (isBusy()) await new Promise(resolve => setTimeout(resolve, waitMs));
      return task();
    });
    tail = run.catch(() => undefined);
    return run;
  };
}
