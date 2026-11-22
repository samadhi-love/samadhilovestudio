import { act } from "react";
import assert from "node:assert/strict";

/** Shape It (formerly Custom). Exercise the real disclosure path, rather than assuming advanced fields are on Simple. */
export async function customCreate() {
  const custom = document.querySelector<HTMLButtonElement>('[data-testid="tab-mode-custom"]');
  assert(custom, "Custom creation mode is available");
  await act(async () => custom.click());
  // Shape It folds Your Words, Sound & Soul, Voice, More, Your Sounds and Studio tools; open them all.
  await act(async () => { for (const fold of document.querySelectorAll<HTMLDetailsElement>(".shape-it details")) fold.open = true; });
  await englishCreation();
}

/** These fixtures test English creation; language inference is tested separately. */
export async function englishCreation() {
  const language = document.querySelector('select[aria-label="Singing language"]') as HTMLSelectElement | null;
  if (language) await act(async () => {
    language.value = "en";
    language.dispatchEvent(new window.Event("change", { bubbles: true }));
  });
}

export function creationIdea() {
  const field = document.querySelector<HTMLTextAreaElement>('[data-testid="input-song-idea"],[data-testid="input-song-description"]');
  assert(field, "The current creation mode has a description");
  return field;
}

/** One take per Begin; kept as a no-op so older fixtures read the same. */
export async function oneTake() {
  assert.equal(document.querySelector('[data-testid="checkbox-make-two-versions"]'), null, "There is no take selector: one take per Begin");
}
