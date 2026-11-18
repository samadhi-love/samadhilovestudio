import { promptLanguage } from "./prompt-language";
import { musicLanguages, musicDialects, type MusicLanguage } from "./music-language-catalog";
export { musicLanguages, musicDialects, type MusicLanguage } from "./music-language-catalog";
export type LanguageChoice = { language: "auto" | MusicLanguage; dialect: "" | keyof typeof musicDialects; selected?: boolean };
// Remember an explicit choice (including English) separately from the default.
export const defaultLanguageChoice: LanguageChoice = { language: "auto", dialect: "", selected: false };
export type LanguageProfile = LanguageChoice & { resolved: MusicLanguage; source: "selected" | "script-suggestion" | "prompt" | "default" };
export type CapabilityStatus = "tested" | "experimental/unverified" | "unavailable";
const experimental: CapabilityStatus = "experimental/unverified";
export const musicCapabilityRegistry = {
  provider: "ElevenLabs", model: "music_v2_5", checked: "2026-11-15",
  sources: [
    "https://elevenlabs.io/docs/overview/capabilities/music",
    "https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans",
    "https://elevenlabs.io/docs/api-reference/music/compose",
  ],
  // Documentation allows any-language lyrics. That is not a listening-quality test.
  forLanguage(language: MusicLanguage) {
    const status = experimental;
    return { lyricWriting: status, sungAudio: status, dialectFidelity: status,
      transcriptionAlignment: status, captionRendering: experimental };
  },
  singingVoiceId: "unavailable" as CapabilityStatus,
  pronunciationDictionary: "unavailable" as CapabilityStatus,
  audition: { status: experimental, minimumSeconds: 3, free: false },
  audioReviews: [] as string[],
};
export function isLanguageChoice(value: unknown): value is LanguageChoice {
  if (!value || typeof value !== "object") return false;
  const v = value as LanguageChoice;
  return (v.selected === undefined || typeof v.selected === "boolean") &&
    (v.language === "auto" || Object.hasOwn(musicLanguages, v.language)) &&
    (v.dialect === "" || Object.hasOwn(musicDialects, v.dialect) && ["auto", "ar", "mixed"].includes(v.language));
}
export function isLanguageProfile(value: unknown): value is LanguageProfile {
  const p = value as LanguageProfile;
  return isLanguageChoice(value) && Object.hasOwn(musicLanguages, p.resolved) &&
    ["selected", "script-suggestion", "prompt", "default"].includes(p.source) &&
    (p.language === "auto" || p.language === p.resolved) &&
    (!p.dialect || ["ar", "mixed"].includes(p.resolved));
}
/** Conservative suggestions only. Ambiguous input falls back to English.
 * Never use an English production brief as evidence of the intended singing language.
 */
export function suggestLyricLanguage(lyrics: string): MusicLanguage | undefined {
  const text = lyrics.replace(/\[[^\]\n]*\]|\{[^}\n]*\}/g, "");
  const count = (pattern: RegExp) => (text.match(pattern) ?? []).length;
  if (count(/\p{L}/gu) < 2) return;
  const scripts = [
    ["ar", count(/\p{Script=Arabic}/gu)],
    ["hi", count(/\p{Script=Devanagari}/gu)],
    ["ja", count(/[\p{Script=Hiragana}\p{Script=Katakana}]/gu)],
    ["he", count(/\p{Script=Hebrew}/gu)],
    ["ko", count(/\p{Script=Hangul}/gu)],
    ["zh", count(/\p{Script=Han}/gu)],
    ["bn", count(/\p{Script=Bengali}/gu)],
    ["pa", count(/\p{Script=Gurmukhi}/gu)],
    ["ta", count(/\p{Script=Tamil}/gu)],
    ["te", count(/\p{Script=Telugu}/gu)],
    ["th", count(/\p{Script=Thai}/gu)],
    ["el", count(/\p{Script=Greek}/gu)],
    ["ru", count(/\p{Script=Cyrillic}/gu)],
  ] as const;
  // Han alongside Japanese kana is Japanese, not a mixed-language passage.
  const hasKana = scripts.some(([id, n]) => id === "ja" && n >= 2);
  const found = scripts.filter(([id, n]) => n >= 2 && !(id === "zh" && hasKana));
  const latin = count(/\p{Script=Latin}/gu);
  if (found.length > 1 || found.length && latin >= 8) return "mixed";
  if (found.length === 1) {
    if (found[0][0] === "ar") {
      if (/[ٹڈڑںھہے]/u.test(text)) return "ur";
      if (/(?:^|\s)(?:در|را)(?:\s|$)/u.test(text) || /[پچژگ]/u.test(text)) return "fa";
    }
    return found[0][0];
  }
  const words = new Set(text.toLocaleLowerCase().match(/\p{L}+/gu) ?? []);
  const scores = ([
    ["en", ["the", "and", "with", "your", "our", "through", "heart", "love"]],
    ["es", ["el", "los", "las", "una", "nuestro", "corazón", "amor", "cielo"]],
    ["fr", ["les", "une", "notre", "dans", "avec", "cœur", "amour", "lumière"]],
  ] as const).map(([language, hints]) => ({ language, score: hints.filter(word => words.has(word)).length }))
    .sort((a, b) => b.score - a.score);
  // Limited vocabulary heuristics are deliberately tentative, not a language service.
  if (scores[0].score >= 3 && scores[0].score - scores[1].score >= 2) return scores[0].language;
  return;
}
export function resolveLanguage(choice: LanguageChoice, lyrics: string, prompt = ""): LanguageProfile {
  if (!isLanguageChoice(choice)) throw new Error("Choose a listed singing language and an optional compatible dialect.");
  const requested = promptLanguage(prompt);
  const explicit = choice.language !== "auto" && choice.selected !== false;
  const requestedLanguage = requested?.language === "auto" ? undefined : requested?.language;
  const detected = explicit || requestedLanguage ? undefined : suggestLyricLanguage(lyrics);
  const inferred = explicit ? undefined : requestedLanguage ?? detected ?? (choice.dialect ? "ar" : undefined);
  const resolved: MusicLanguage = explicit ? choice.language as MusicLanguage : inferred ?? "en";
  const dialect = ["ar", "mixed"].includes(resolved) ? (explicit ? choice.dialect : requested?.dialect || choice.dialect) : "";
  return { ...choice, language: resolved, dialect, resolved, source: explicit ? "selected" : requestedLanguage ? "prompt" : detected ? "script-suggestion" : choice.dialect ? "selected" : "default" };
}
/** Directions belong in plan styles, never substituted into displayed approved words. */
export function singingDirection(profile: LanguageProfile): string {
  return [
    `Singing language: ${musicLanguages[profile.resolved]}.`,
    "This singing-language target takes priority over conflicting language references elsewhere in the production description; keep its mood, genre and instrument directions.",
    profile.resolved === "mixed" ? "Preserve every passage's original language and script, including code-switching. Do not translate or romanize any passage." :
      "Write original lyrics in this language when no lyrics are supplied. Preserve supplied words and script exactly; never translate or romanize them.",
    profile.dialect === "ar-LB" ? "Lebanese Arabic dialect target: natural conversational Lebanese Levantine phrasing, not formal Modern Standard Arabic or Egyptian Arabic. For newly written Arabic passages use idiomatic Lebanese vocabulary such as shu, baddi, hayda and mish where appropriate, written in Arabic script. Lebanese vocal articulation and colloquial vowel patterns; conversational phrasing, not formal case endings. Preserve any supplied lyrics, including their dialect and mixed-language passages. Dialect fidelity is not guaranteed." : "",
    profile.dialect && profile.dialect !== "ar-LB" ? `Dialect target: ${musicDialects[profile.dialect]}; colloquial vocabulary and vocal pronunciation, not formal Modern Standard Arabic. Do not rewrite supplied lyrics. Fidelity is unverified.` : "",
  ].filter(Boolean).join(" ");
}
export function languageStyles<T extends { positive_styles?: unknown }>(chunks: T[], profile: LanguageProfile): T[] {
  return chunks.map(chunk => ({ ...chunk, positive_styles: [singingDirection(profile),
    ...(Array.isArray(chunk.positive_styles) ? chunk.positive_styles : [])].slice(0, 50) }));
}
/** A cheap script sanity check, not a language-quality or dialect verifier. */
export function generatedScriptIssue(profile: LanguageProfile, lyrics: string): string | undefined {
  const expected: Partial<Record<MusicLanguage, RegExp>> = {
    ar: /\p{Script=Arabic}/u, hi: /\p{Script=Devanagari}/u,
    ja: /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u,
    ko: /\p{Script=Hangul}/u, zh: /\p{Script=Han}/u,
    ru: /\p{Script=Cyrillic}/u, uk: /\p{Script=Cyrillic}/u, he: /\p{Script=Hebrew}/u,
    fa: /\p{Script=Arabic}/u, ur: /\p{Script=Arabic}/u, bn: /\p{Script=Bengali}/u,
    ta: /\p{Script=Tamil}/u, te: /\p{Script=Telugu}/u,
    th: /\p{Script=Thai}/u, el: /\p{Script=Greek}/u,
  };
  const pattern = expected[profile.resolved];
  const words = lyrics.replace(/\[[^\]\n]*\]|\{[^}\n]*\}/g, "");
  if (pattern && !pattern.test(words))
    return `The lyric draft did not contain the expected ${musicLanguages[profile.resolved]} script. No singing request was started. Review the draft or supply your own lyrics; Studio will not translate it automatically.`;
}
export function languageForAudio(song: {
  id: string; audioId?: string; generation?: { audioId?: string; languageProfile?: LanguageProfile };
}): LanguageProfile | undefined {
  return song.generation?.audioId === (song.audioId ?? song.id) ? song.generation.languageProfile : undefined;
}
