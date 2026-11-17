import { act } from "react";
import assert from "node:assert/strict";

/** Exercise the real disclosure path, rather than assuming advanced fields are on Simple. */
export async function customCreate() {
  const custom = document.querySelector<HTMLButtonElement>('[data-testid="tab-mode-custom"]');
  assert(custom, "Custom creation mode is available");
  await act(async () => custom.click());
  const more = document.querySelector<HTMLDetailsElement>(".qc-more");
  if (more) await act(async () => { more.open = true; });
  await englishCreation();
}

/** These fixtures test English creation; language inference is tested separately. */
export async function englishCreation() {
  const language = [...document.querySelectorAll("select")].find(s => s.parentElement?.textContent?.startsWith("Singing language"));
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
