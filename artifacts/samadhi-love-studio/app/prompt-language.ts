import type { LanguageChoice, MusicLanguage } from "./music-language";

// These are input aliases, not claims of verified singing pronunciation.
const aliases: [MusicLanguage, string[]][] = [
  ["en", ["english", "anglais", "inglés"]], ["ar", ["arabic", "العربية", "عربي", "عربية", "بالعربي", "بالعربية"]],
  ["es", ["spanish", "español"]], ["fr", ["french", "français"]], ["hi", ["hindi", "हिन्दी", "हिंदी"]],
  ["ja", ["japanese", "日本語"]], ["de", ["german", "deutsch"]], ["it", ["italian", "italiano"]],
  ["pt", ["portuguese", "português"]], ["tr", ["turkish", "türkçe"]], ["ru", ["russian", "русском"]],
  ["ko", ["korean", "한국어"]], ["zh", ["chinese", "mandarin", "中文"]], ["uk", ["ukrainian"]],
  ["pl", ["polish"]], ["nl", ["dutch"]], ["id", ["indonesian", "bahasa indonesia"]], ["sw", ["swahili"]],
  ["he", ["hebrew", "עברית"]], ["fa", ["persian", "farsi", "فارسی"]], ["ur", ["urdu", "اردو"]],
  ["bn", ["bengali", "bangla"]], ["pa", ["punjabi"]], ["ta", ["tamil"]], ["te", ["telugu"]],
  ["vi", ["vietnamese"]], ["th", ["thai"]], ["el", ["greek"]], ["ro", ["romanian"]],
  ["sv", ["swedish"]], ["fi", ["finnish"]], ["no", ["norwegian"]], ["da", ["danish"]],
  ["cs", ["czech"]], ["hu", ["hungarian"]], ["tl", ["filipino", "tagalog"]],
];
const dialectAliases: [NonNullable<LanguageChoice["dialect"]>, string[]][] = [
  ["ar-LB", ["lebanese arabic", "lebanese", "لبناني", "لبنانية", "باللبناني"]],
  ["ar-EG", ["egyptian arabic", "egyptian", "مصري", "مصرية", "بالمصري"]],
  ["ar-x-gulf", ["gulf arabic", "khaleeji", "خليجي", "بالخليجي"]],
  ["ar-SY", ["syrian arabic", "سوري", "بالسوري"]],
  ["ar-IQ", ["iraqi arabic", "عراقي", "بالعراقي"]],
  ["ar-MA", ["moroccan arabic", "moroccan darija", "مغربي", "بالمغربي"]],
  ["ar-PS", ["palestinian arabic", "فلسطيني", "بالفلسطيني"]],
];
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const instructionBefore = /(?:\b(?:sing|sung|singing|lyrics?|vocals?|language|chorus|verses?|write|in|en|auf)|باللغة|بلهجة|لهجة|غني|غنّي|أغنية|اغنية|غنية|كلمات|на)\s*(?:(?:in|is|are|only|the|a|an)\s*|[:=]\s*)*$/iu;
const instructionAfter = /^\s+(?:lyrics?|vocals?|singing|language|chorus|verses?)\b/iu;
const instrumentalContext = /^\s+(?:guitar|oud|piano|instruments?|instrumental|rhythm|beats?|style|influence|flavou?r)\b/iu;
const negated = /(?:\b(?:not|no|without|avoid|rather than)|ليس|مش|بدون)\s*$/iu;

/** Recognize explicit singing instructions, not the language the brief is written in. */
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
  for (const [language, words] of aliases) collect(language, "", words);
  for (const [dialect, words] of dialectAliases) collect("ar", dialect, words);
  // Prefer "Lebanese Arabic" over the shorter overlapping "Arabic".
  const mentions = candidates.filter(c => !candidates.some(other =>
    other !== c && other.start <= c.start && other.end >= c.end && other.end - other.start > c.end - c.start,
  )).sort((a, b) => a.start - b.start);
  const accepted: typeof mentions = [];
  for (const mention of mentions) {
    const before = text.slice(Math.max(0, mention.start - 60), mention.start);
    const after = text.slice(mention.end);
    if (negated.test(before) || instrumentalContext.test(after)) continue;
    const previous = accepted.at(-1);
    const joined = previous && /^(?:\s|,|\/|&|\band\b|\bthen\b|و)+$/u.test(text.slice(previous.end, mention.start));
    const directDialect = !!mention.dialect && /arabic|darija|^بال/u.test(mention.alias);
    if (instructionBefore.test(before) || instructionAfter.test(after) || joined || /^بال/u.test(mention.alias) || directDialect)
      accepted.push(mention);
  }
  if (!accepted.length) return;
  const languages = new Set(accepted.map(c => c.language));
  const dialects = new Set(accepted.map(c => c.dialect).filter(Boolean));
  if (languages.size > 1) return { language: "mixed", dialect: dialects.size === 1 ? accepted.find(c => c.dialect)!.dialect : "" };
  return { language: accepted[0].language, dialect: dialects.size === 1 ? accepted.find(c => c.dialect)!.dialect : "" };
}
