/**
 * "Write them for me" asks the create route for words only. That answer saves
 * nothing, so it carries no library revision: it must not be mistaken for an
 * unconfirmed (possibly charged) song production.
 */
export function wordsOnlyResult(ok: boolean, result: unknown): result is { lyrics: string } {
  if (!ok || !result || typeof result !== "object") return false;
  const value = result as { lyrics?: unknown; revision?: unknown; data?: unknown };
  return typeof value.lyrics === "string" && value.lyrics.trim() !== "" && value.revision === undefined && value.data === undefined;
}
