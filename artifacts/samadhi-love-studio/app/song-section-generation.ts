import { defaultLanguageChoice, languageForAudio, resolveLanguage, type LanguageChoice } from "./music-language";
import type { Song } from "./studio-data";

export function replacementLanguageChoice(song: Song): LanguageChoice {
  const profile = languageForAudio(song);
  // This is new writing, not the original supplied lyrics: resolve saved Auto to
  // its saved target so the backend does not try to detect language from nothing.
  return profile ? { language: profile.resolved, dialect: profile.dialect } : defaultLanguageChoice;
}
export function sectionGenerationPayload(source: Song, choice: LanguageChoice, instrumental: boolean, prompt: string, seconds: number) {
  if (!prompt.trim()) throw new Error("Describe the replacement section first.");
  if (!instrumental) resolveLanguage(choice, "");
  return {
    action: "song", ...choice, instrumental,
    title: (source.name + " · Replacement section").slice(0, 100),
    prompt: (prompt + ". Create an original replacement section with an immediate musical start and a blendable ending. Match the requested instruments, tempo, key and delivery; no silent intro.").slice(0, 1600),
    duration: Math.max(3, Math.min(120, Math.round(seconds))),
    openingMode: "direct", projectId: source.id,
  };
}
