export type CreateChoice = "vocals" | "instrumental" | "sketch";
export const defaultCreateChoice: CreateChoice = "vocals";
export function recoverCreateChoice(value: unknown): CreateChoice {
  return value === "vocals" || value === "instrumental" || value === "sketch" ? value : defaultCreateChoice;
}
/** Resolve what a submission will do. Only an explicit sketch choice renders locally; nothing falls back. */
export function resolveCreateMode(choice: CreateChoice, connected: boolean, simple = false) {
  const effectiveChoice = simple && choice === "sketch" ? "instrumental" : choice;
  const instrumental = effectiveChoice !== "vocals";
  const localSketch = effectiveChoice === "sketch";
  const needsProvider = !localSketch;
  return { instrumental, localSketch, needsProvider, blocked: needsProvider && !connected,
    label: effectiveChoice === "vocals" ? "Song with singing" : effectiveChoice === "instrumental" ? "Instrumental - no singing" : "Instrumental sketch - no singing" };
}
