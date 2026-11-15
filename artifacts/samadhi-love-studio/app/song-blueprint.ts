import { recommendPreset, recommendTempo, type Preset } from "./creation-guide";

const instruments = [
  ["oud", /\boud\b/i], ["darbuka", /\b(?:darbuka|derbake|doumbek)\b/i],
  ["tabla", /\btabla\b/i], ["mijwiz", /\bmijwiz\b/i], ["zurna", /\bzurna\b/i], ["ney flute", /\b(?:ney|flute)\b/i],
  ["piano", /\bpiano\b/i], ["electric keys", /\b(?:keys|rhodes)\b/i], ["guitar", /\bguitars?\b/i],
  ["strings", /\b(?:strings|violin|cello)\b/i], ["808 bass", /\b808\b/i], ["synth bass", /\b(?:synth bass|sub.bass)\b/i],
  ["synth pads", /\b(?:synths?|pads?)\b/i], ["bells", /\bbells?\b/i], ["hand percussion", /\b(?:drums?|percussion)\b/i],
] as const;

const palettes = {
  dabke: { genre: "Arabian Euro House × Lebanese Dabke", instruments: "oud, darbuka, bright piano, synth bass" },
  house: { genre: "Melodic House", instruments: "bright piano, synth bass, soft pads, four-on-the-floor drums" },
  soul: { genre: "Clean R&B", instruments: "electric keys, warm bass, syncopated drums" },
  still: { genre: "Spiritual Ambient", instruments: "soft bells, spacious pads, gentle bass" },
} satisfies Record<Preset, { genre: string; instruments: string }>;

const sections = /\b(?:final\s+(?:chorus|hook)|pre[ -]?chorus|verse\s*[12]?|chorus|hook|intro(?:duction)?|bridge|breakdown|break|drop|outro|ending)\b/gi;

function sectionName(value: string) {
  const name = value.toLowerCase().trim();
  if (/^final/.test(name)) return "Final Chorus";
  if (/^pre/.test(name)) return "Pre-Chorus";
  if (/^verse/.test(name)) return name.endsWith("2") ? "Verse 2" : "Verse 1";
  if (/^(chorus|hook)$/.test(name)) return "Chorus";
  if (/^intro/.test(name)) return "Intro";
  if (/^(outro|ending)$/.test(name)) return "Outro";
  return name[0].toUpperCase() + name.slice(1);
}

function vocalCue(text: string) {
  const male = /\b(?:male|man|masculine|baritone|tenor)\b/i.test(text);
  const female = /\b(?:female|woman|feminine|soprano|alto)\b/i.test(text);
  const performer = male && female ? "Male and female duet" : male ? "Male lead" : female ? "Female lead" : "";
  return [performer, /\bwhisper\w*\b/i.test(text) && "whispered delivery",
    /\b(?:speak\w*|spoken|talk\w*|narrat\w*)\b/i.test(text) && "spoken delivery",
    /\brap(?:s|ping)?\b/i.test(text) && "rhythmic rap"].filter(Boolean).join(", ");
}

export function songBlueprint(idea: string, instrumental: boolean) {
  const preset = recommendPreset(idea);
  const palette = palettes[preset];
  const genre = preset === "soul" && /\b(?:rap|hip[ -]?hop)\b/i.test(idea) ? "Clean Hip-Hop × R&B" :
    /\b(?:pop rock|rock|reggae|synthpop|country|orchestral|jazz|trance|techno)\b/i.exec(idea)?.[0] ?? palette.genre;
  const bpm = recommendTempo(idea, preset);
  const requested = instruments.filter(([, pattern]) => pattern.test(idea)).map(([name]) => name);
  const instrumentList = requested.length ? requested.join(", ") : palette.instruments;
  const cues = new Map<string, string>();
  for (const phrase of idea.split(/[,;.!?\n]|\b(?:then|followed by|and (?=(?:a |the )?(?:male|female|man|woman|spoken|whisper|verse|chorus|bridge|outro)\b))/i)) {
    const names = [...phrase.matchAll(sections)].map(match => sectionName(match[0]));
    const cue = vocalCue(phrase);
    const sounds = instruments.filter(([, pattern]) => pattern.test(phrase)).map(([name]) => name).join(", ");
    if (!cue && !sounds) continue;
    if (!names.length && /\b(?:start|open|begin)\b/i.test(phrase)) names.push("Intro");
    for (const name of names) {
      const detail = [cue, sounds].filter(Boolean).join(", ");
      if (detail) cues.set(name, [cues.get(name), detail].filter(Boolean).join(", "));
    }
  }
  const duet = /\b(?:duet|call.and.response)\b/i.test(idea);
  const lead = vocalCue(idea);
  const middle = /\bbreakdown\b/i.test(idea) ? "Breakdown" : /\bdrop\b/i.test(idea) ? "Drop" : cues.has("Break") ? "Break" : "Bridge";
  const map = [
    ["Intro", "Introduce the signature motif", "Short opening, introduce the signature motif"],
    ["Verse 1", "Introduce the groove and bass", duet ? "Male lead, close and clear" : "Introduce the story with clear phrasing"],
    ["Pre-Chorus", "Build tension with rising chords", "Build toward the hook"],
    ["Chorus", "Full groove and lead melody", "Sing a memorable hook with fuller instrumentation"],
    ["Verse 2", "Vary the rhythm and motif", duet ? "Female lead answers the first verse" : "Develop the story and vary the phrasing"],
    [middle, middle === "Drop" ? "Release into full percussion and synths" : "Shift the energy with an instrumental contrast", middle === "Drop" ? "Instrumental drop, full rhythm and lead" : "Change the texture before the final hook"],
    ["Final Chorus", "Bring the main motif back with more energy", duet ? "Male and female leads together, repeat the hook" : "Repeat the hook with fuller harmonies"],
    ["Outro", "Resolve the motif and let the instruments fade", "End on the title phrase and let the instruments fade"],
  ];
  const hasSectionVocal = [...cues.values()].some(value => /lead|delivery|duet|rhythmic rap/.test(value));
  const code = map.map(([name, backing, vocals]) => {
    const inferred = !instrumental && !duet && name === "Verse 1" && !hasSectionVocal ? lead : "";
    return `[${name}]\n{${[cues.get(name), inferred, instrumental ? backing : vocals].filter(Boolean).join(". ")}}`;
  }).join("\n\n");
  return { preset, bpm, genre, instrumentList, code };
}
