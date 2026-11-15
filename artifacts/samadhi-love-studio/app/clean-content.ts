const profanity = /\b(?:fck|fuk|fcking|wtf|fuck(?:s|ed|er|ers|ing)?|motherfuck\w*|shit(?:s|ty|ting)?|bullshit\w*|bitch(?:es|y)?|asshole\w*|dickhead\w*|bastard\w*|cunt\w*|whore\w*|slut\w*|damn(?:ed|ing)?|goddamn\w*|piss(?:ed|es|ing)?|dick|cock|crap|butts?|porn\w*)\b/u;
const arabicProfanity = /(?:^|\s)(?:كس\s*امك|كسمك|شرموط(?:ة)?|قحب(?:ة|ه)|متناك|نيك)(?:\s|$)/u;

const contentRules = [
  { category: "Profanity or vulgar language", match: profanity, alternative: "I can say what I feel with honesty" },
  { category: "Sexually explicit language", match: /\b(?:oral sex|sex tape|blow\s*job|hand\s*job|fingering|bare breasts|sexually graphic|deep\s*throat|masturbat\w*|orgasm\w*|genitals|naked bodies|explicit sex|(?:have|having|wants?) sex)\b/u, alternative: "Come a little closer and dance with me" },
  { category: "Graphic violence", match: /\b(?:slit\s+\w+\s+throat|rip\s+\w+\s+guts|splatter(?:ed)? brains|blood and gore|gouge\s+\w+\s+eyes|blow\s+\w+\s+brains\s+out|dismember\w*|decapitat\w*)\b/u, alternative: "I lay my anger down and make room for peace" },
  { category: "Hateful or degrading language", match: /\b(?:subhuman\w*|nigg(?:er|a)s?|kikes?|spics?|chinks?|faggots?|worthless trash|(?:kill|exterminate) (?:all |the )?(?:jews|muslims|christians|hindus|immigrants|gays|trans people))\b/u, alternative: "Every heart deserves respect and a place to belong" },
];

export const cleanWordsMessage = "This Studio allows clean content only. Use the clean rewrite suggestions or edit the flagged wording to continue.";

export function flagContent(value: string) {
  const text = value.normalize("NFKD").toLowerCase().replace(/\p{M}|\p{Cf}/gu, "").replace(/\s+/g, " ");
  const expanded = text.replace(/(?<=\p{L})[._-](?=\p{L})/gu, "").replace(/[@4]/g, "a").replace(/[!1]/g, "i").replace(/0/g, "o").replace(/[\$5]/g, "s")
    .replace(/\b(?:f[*.]+(?:ck|k)|sh[*.]+t|b[*.]+tch)\b/g, word => word.startsWith("f") ? "fuck" : word.startsWith("sh") ? "shit" : "bitch");
  return contentRules.filter((rule, index) => rule.match.test(text) || rule.match.test(expanded) ||
    (index === 0 && arabicProfanity.test(text.replace(/[^\p{L}\p{N}]+/gu, " "))));
}

export function hasExplicitWords(...values: unknown[]) {
  return values.some(value => typeof value === "string" && flagContent(value).length > 0);
}

export function isExplicitSong(song: { explicit?: boolean; name?: string; notes?: { lyrics?: string }; lyricVideo?: { cues: { text: string }[] } }) {
  return song.explicit === true || hasExplicitWords(song.name, song.notes?.lyrics, song.lyricVideo?.cues.map(cue => cue.text).join("\n"));
}

const wordSwaps = [
  [/\b(?:what the (?:fuck|heck)|wtf)\b/gi, "what in the world"],
  [/\bso (?:fucking|damn)\b/gi, "so"],
  [/\b(?:fucking|damn(?:ed|ing)?|goddamn)\b/gi, "really"],
  [/\b(?:bullshit|shit|crap)\b/gi, "nonsense"],
  [/\b(?:asshole|dickhead|bastard)\b/gi, "troublemaker"],
  [/\bpissed(?: off)?\b/gi, "frustrated"],
] as const;

export function rewriteCleanLine(line: string, direction = false) {
  const rules = flagContent(line);
  if (!rules.length) return line;
  if (rules.every(rule => rule === contentRules[0])) {
    let next = line;
    for (const [match, replacement] of wordSwaps) next = next.replace(match, replacement);
    if (next !== line && !hasExplicitWords(next)) return next;
  }
  const cue = /^(\s*\[)[^\]\r\n]*(\]\s*)$/.exec(line);
  if (cue) return cue[1] + "Clean vocal delivery" + cue[2];
  if (/^\s*\{.*\}\s*$/.test(line)) return "{Warm, clean vocal delivery}";
  return direction ? cleanStyleSuggestion(line) : rules.find(rule => rule !== contentRules[0])?.alternative ?? rules[0].alternative;
}

export function cleanStyleSuggestion(text: string) {
  if (/dabke|arabian|oud|darbuka/i.test(text)) return "Uplifting Arabian Euro House and Lebanese Dabke with oud, darbuka, and a bright, clean chorus.";
  if (/hip.hop|\brap\b|r\s*&\s*b|808|soul/i.test(text)) return "Clean hip-hop and soulful R&B with crisp drums, confident wordplay, warm harmonies, and a hook about resilience.";
  if (/house|dance|festival|techno|trance/i.test(text)) return "Melodic dance music with a bright build, a strong clean hook, and a celebratory drop.";
  return "Uplifting vocals about love, courage, and connection, with clear phrasing and a memorable hook.";
}
