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

/** Two takes is the default; fixtures that assert a single request choose One take in Shape It. */
export async function oneTake() {
  const two = document.querySelector<HTMLInputElement>('[data-testid="checkbox-make-two-versions"]');
  assert(two, "The take selector lives in Shape It");
  if (two.checked) await act(async () => two.click());
  assert.equal(two.checked, false);
}
