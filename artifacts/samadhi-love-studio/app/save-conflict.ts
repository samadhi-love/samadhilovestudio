/**
 * One automatic retry when a library save loses a race.
 *
 * The library is saved with a revision number. If something else saved first
 * (a song finished in the background, the video editor autosaved, another
 * tab), the server answers 409 "save-conflict". Instead of showing an error and
 * asking the person to reload, the Studio loads the newest copy, replays this
 * edit on top of it (rebaseStudio) and sends it once more. If that also loses,
 * the error is shown and nothing is overwritten.
 */
export type SaveAttempt<T> = { response: Response; result: T | null };

export function isSaveConflict(response: Response, result: unknown) {
  return response.status === 409 && !!result && typeof result === "object" && (result as { code?: unknown }).code === "save-conflict";
}

export async function saveWithConflictRetry<T>(
  attempt: () => Promise<SaveAttempt<T>>,
  refreshLatest: () => Promise<boolean>,
  canRetry = true,
): Promise<SaveAttempt<T>> {
  const first = await attempt();
  if (!canRetry || !isSaveConflict(first.response, first.result)) return first;
  if (!(await refreshLatest())) return first;
  return attempt();
}
