import type { LanguageChoice, MusicLanguage } from "./music-language";
import { musicLanguages, musicDialects, dialectLanguage } from "./music-language-catalog";

// These are input aliases, not claims of verified singing pronunciation.
const extraAliases: [MusicLanguage, string[]][] = [
  ["en", ["english", "anglais", "inglés"]], ["ar", ["arabic", "العربية", "عربي", "عربية", "بالعربي", "بالعربية"]],
  ["es", ["spanish", "español"]], ["fr", ["french", "français"]], ["hi", ["hindi", "हिन्दी", "हिंदी"]],
  ["ja", ["japanese", "日本語"]], ["de", ["german", "deutsch"]], ["it", ["italian", "italiano"]],
  ["pt", ["portuguese", "português", "brazilian portuguese"]], ["tr", ["turkish", "türkçe"]], ["ru", ["russian", "русском"]],
  ["ko", ["korean", "한국어"]], ["zh", ["chinese", "mandarin", "中文"]], ["uk", ["ukrainian"]],
  ["pl", ["polish"]], ["nl", ["dutch"]], ["id", ["indonesian", "bahasa indonesia"]], ["sw", ["swahili"]],
  ["he", ["hebrew", "עברית"]], ["fa", ["persian", "farsi", "فارسی"]], ["ur", ["urdu", "اردو"]],
  ["bn", ["bengali", "bangla"]], ["pa", ["punjabi"]], ["ta", ["tamil"]], ["te", ["telugu"]],
  ["vi", ["vietnamese"]], ["th", ["thai"]], ["el", ["greek"]], ["ro", ["romanian"]],
  ["sv", ["swedish"]], ["fi", ["finnish"]], ["no", ["norwegian"]], ["da", ["danish"]],
  ["cs", ["czech"]], ["hu", ["hungarian"]], ["tl", ["filipino", "tagalog"]],
  ["mixed", ["multilingual", "mixed languages"]],
];
const dialectAliases: [NonNullable<LanguageChoice["dialect"]>, string[]][] = [
  ["ar-LB", ["lebanese arabic", "lebanese", "لبناني", "لبنانية", "باللبناني"]],
  ["ar-EG", ["egyptian arabic", "egyptian", "مصري", "مصرية", "بالمصري"]],
  ["ar-x-gulf", ["gulf arabic", "khaleeji", "خليجي", "بالخليجي"]],
  ["ar-SY", ["syrian arabic", "سوري", "بالسوري"]],
  ["ar-IQ", ["iraqi arabic", "عراقي", "بالعراقي"]],
  ["ar-MA", ["moroccan arabic", "moroccan darija", "مغربي", "بالمغربي"]],
  ["ar-PS", ["palestinian arabic", "فلسطيني", "بالفلسطيني"]],
  ["en-US-south", ["southern accent", "southern drawl", "southern american english"]],
  ["en-US-urban", ["urban accent", "african american english", "black american english", "aave"]],
  ["en-GB", ["british accent", "uk english", "uk accent", "london accent"]],
  ["en-x-jamaica", ["jamaican accent"]],
  ["en-NG", ["nigerian accent"]],
  ["en-IN", ["indian accent"]],
  ["es-MX", ["mexican accent", "español mexicano"]],
  ["es-x-caribbean", ["puerto rican spanish", "cuban spanish", "dominican spanish", "español caribeño"]],
  ["pt-BR", ["brazilian accent", "português brasileiro", "portugues brasileiro"]],
];
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const instructionBefore = /(?:\b(?:sing|sung|singing|lyrics?|vocals?|language|chorus|verses?|write|in|en|auf)|باللغة|بلهجة|لهجة|غني|غنّي|أغنية|اغنية|غنية|كلمات|на)\s*(?:(?:in|is|are|only|the|a|an)\s*|[:=]\s*)*$/iu;
const instructionAfter = /^\s+(?:lyrics?|vocals?|singing|language|chorus|verses?)\b/iu;
const instrumentalContext = /^\s+(?:guitar|oud|piano|instruments?|instrumental|rhythm|beats?|style|influence|flavou?r)\b/iu;
const negated = /(?:\b(?:not|no|without|avoid|rather than|don't|dont)|ليس|مش|بدون)\s*(?:(?:sing|singing|use|write|lyrics?|vocals?)\s+)?(?:in\s*)?$/iu;

/** Match every listed name, preserving negations and instrument-only references. */
export function promptLanguage(prompt: string): LanguageChoice | undefined {
  const text = prompt.normalize("NFKC").toLowerCase();
  const candidates: { start: number; end: number; language: MusicLanguage; dialect: LanguageChoice["dialect"]; alias: string }[] = [];
  const collect = (language: MusicLanguage, dialect: LanguageChoice["dialect"], words: string[]) => {
    for (const alias of words) {
      const pattern = new RegExp(`(?<![\\p{L}])${escape(alias)}(?![\\p{L}])`, "giu");
      for (const match of text.matchAll(pattern)) {
        const start = match.index!;
        candidates.push({ start, end: start + match[0].length, language, dialect, alias });
      }
    }
  };
  for (const [language, label] of Object.entries(musicLanguages)) {
    const words = [label, ...label.split(" / "), ...(extraAliases.find(([id]) => id === language)?.[1] ?? [])];
    collect(language as MusicLanguage, "", [...new Set(language === "other" ? [label] : words)]);
  }
  for (const [dialect, label] of Object.entries(musicDialects)) {
    collect(dialectLanguage[dialect as keyof typeof dialectLanguage], dialect as LanguageChoice["dialect"], [...new Set([label, ...label.split(" · "), ...(dialectAliases.find(([id]) => id === dialect)?.[1] ?? [])])]);
  }
  // Prefer "Lebanese Arabic" over the shorter overlapping "Arabic".
  const mentions = candidates.filter(c => !candidates.some(other =>
    other !== c && other.start <= c.start && other.end >= c.end && other.end - other.start > c.end - c.start,
  )).sort((a, b) => a.start - b.start);
  const accepted: typeof mentions = [];
  for (const mention of mentions) {
    const before = text.slice(Math.max(0, mention.start - 60), mention.start);
    const after = text.slice(mention.end);
    if (negated.test(before) || instrumentalContext.test(after)) continue;
    // A standalone dialect adjective before a genre is not a singing instruction.
    if (mention.dialect && /^(?:lebanese|egyptian|khaleeji)$/u.test(mention.alias) &&
      /^\s+(?:dabke|groove|beats?|rhythm|style)\b/u.test(after) &&
      !instructionBefore.test(before) && !instructionAfter.test(after)) continue;
    accepted.push(mention);
  }
  if (!accepted.length) return;
  const languages = new Set(accepted.map(c => c.language));
  const dialects = new Set(accepted.map(c => c.dialect).filter(Boolean));
  if (languages.size > 1) return { language: "mixed", dialect: dialects.size === 1 ? accepted.find(c => c.dialect)!.dialect : "" };
  return { language: accepted[0].language, dialect: dialects.size === 1 ? accepted.find(c => c.dialect)!.dialect : "" };
}
