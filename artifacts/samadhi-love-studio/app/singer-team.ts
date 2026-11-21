/**
 * "Who sings": solo, duet, trio, group chant, choir, call and response, rap + sung hook.
 * The person's words win when the picker is on Auto ("a duo about…" → Duet).
 * For songs with more than one voice, every lyric part is labeled with who sings it
 * ([Verse 1: Male voice]) so both engines trade lines and blend like a real group.
 * Adult voices only: never child or child-like voices.
 */
export type TeamId = "auto" | "solo-female" | "solo-male" | "duet-mf" | "duet-ff" | "duet-mm" | "trio" | "group-chant" | "choir" | "call-response" | "rap-sung";
export type SingerTeam = { id: Exclude<TeamId, "auto">; name: string; icon: string; line: string; arrangement: string; direction: string; voices: number };

export const singerTeams: readonly SingerTeam[] = [
  { id: "solo-female", name: "Female singer", icon: "🎤", line: "One female lead", arrangement: "Solo female lead", voices: 1,
    direction: "Solo female lead singer." },
  { id: "solo-male", name: "Male singer", icon: "🎤", line: "One male lead", arrangement: "Solo male lead", voices: 1,
    direction: "Solo male lead singer." },
  { id: "duet-mf", name: "Duet · man + woman", icon: "💞", line: "Trade verses, harmony on the chorus", arrangement: "Duet", voices: 2,
    direction: "Duet: a male and a female adult singer, two clearly different voices that trade verses and blend in harmony together on every chorus." },
  { id: "duet-ff", name: "Duet · two women", icon: "👭", line: "Two female voices that answer and blend", arrangement: "Duet", voices: 2,
    direction: "Duet: two different adult female singers, one lower and warm, one higher and bright, trading verses and singing the chorus together in harmony." },
  { id: "duet-mm", name: "Duet · two men", icon: "👬", line: "Two male voices that answer and blend", arrangement: "Duet", voices: 2,
    direction: "Duet: two different adult male singers, one deep and warm, one higher and clear, trading verses and singing the chorus together in harmony." },
  { id: "trio", name: "Harmony group", icon: "🎶", line: "Three voices, tight harmonies", arrangement: "Choir / group vocals", voices: 3,
    direction: "Vocal harmony group: three adult singers who take turns on the verses and sing tight three-part harmony on every chorus." },
  { id: "group-chant", name: "Group chant", icon: "📣", line: "Many voices chanting together, claps and stomps", arrangement: "Choir / group vocals", voices: 8,
    direction: "Group chant: a crowd of adult voices chanting together in strong unison, stadium energy with claps and stomps; a lead voice calls and the whole group answers." },
  { id: "choir", name: "Choir", icon: "⛪", line: "Lead voice with a full choir", arrangement: "Choir / group vocals", voices: 12,
    direction: "Choir: a lead adult singer with a full adult choir, rich layered harmonies, the choir rising and joining on every chorus." },
  { id: "call-response", name: "Call & response", icon: "🔁", line: "Lead sings, group answers", arrangement: "Call and response", voices: 6,
    direction: "Call and response: a lead adult singer calls each line and a group of adult voices answers it; everyone sings the chorus together." },
  { id: "rap-sung", name: "Rapper + singer", icon: "🎙️", line: "Rap verses, sung chorus", arrangement: "Call and response", voices: 2,
    direction: "Two performers: an adult rapper raps the verses with clear rhythmic flow, and a separate adult singer sings the chorus and hook melodically." },
];

export function teamById(id: string) { return singerTeams.find(team => team.id === id); }

/** Read who should sing from the person's own words. Negations ("no choir") are ignored. */
export function promptTeam(words: string): SingerTeam | undefined {
  const text = ` ${words.toLowerCase()} `.replace(/\b(?:no|not|without|avoid|never)\s+(?:a\s+|any\s+)?(?:duet|duo|choir|chant(?:ing)?|group|crowd|rap(?:per|ping)?|trio|backing vocals)\b/g, " ");
  const female = "female|woman|women|girl|girls|lady|ladies|she|her";
  const male = "male|man|men|boy|boys|guy|guys|he|him";
  const is = (pattern: RegExp) => pattern.test(text);
  if (is(/\bcall[- ]and[- ](?:response|answer)\b/)) return teamById("call-response");
  if (is(/\b(?:rap|rapper|rapping|rapped|mc)\b/) && is(/\b(?:sung|singer|singing|sings|sing)\s+(?:the\s+)?(?:hook|chorus|refrain)|\b(?:hook|chorus)\s+(?:is\s+)?(?:sung|by\s+a\s+singer)|\bfeat(?:uring|\.)?\s+(?:a\s+)?singer|\brapper\s+(?:and|\+|&|with)\s+(?:a\s+)?singer|\bsinger\s+(?:and|\+|&|with)\s+(?:a\s+)?rapper/)) return teamById("rap-sung");
  if (is(/\b(?:group\s+chant|chant(?:s|ing|ed)?|crowd (?:chant(?:s|ing)?|vocals|singing|sings)|stadium (?:chant|crowd|vocals|singalong)|terrace chant|gang vocals|war cry|everyone (?:sings|chants)|football chant)\b|هتاف|يهتف/) && !is(/\bgregorian\b|\bmonks?\b/)) return teamById("group-chant");
  if (is(/\b(?:choir|choral|chorale|gospel choir|church choir|gregorian|monks?|chorus of voices|mass choir)\b|كورال|جوقة/)) return teamById("choir");
  if (is(/\b(?:trio|three (?:singers|voices|vocalists)|harmony group|vocal group|girl group|boy band|group vocals|singing group)\b/)) return teamById("trio");
  const duo = is(/\b(?:duet|duo|two (?:singers|voices|vocalists)|both singing|sing together|singing together|love duet)\b|ثنائي|دويتو/);
  const twoWomen = is(new RegExp(`\\b(?:two (?:female|women|girls|ladies)|(?:female|women's|girls?) (?:duet|duo)|(?:${female}) and (?:another|a second) (?:woman|girl|female))\\b`));
  const twoMen = is(new RegExp(`\\b(?:two (?:male|men|guys|boys)|(?:male|men's|boys?) (?:duet|duo)|(?:${male}) and (?:another|a second) (?:man|guy|male))\\b`));
  if (twoWomen) return teamById("duet-ff");
  if (twoMen) return teamById("duet-mm");
  const pair = `(?:(?:${male})\\s+(?:and|&|\\+|with)\\s+(?:a\\s+)?(?:${female})|(?:${female})\\s+(?:and|&|\\+|with)\\s+(?:a\\s+)?(?:${male}))`;
  const mixed = is(new RegExp(`\\b${pair}\\s+(?:voices?|singers?|vocals?|vocalists?|duet|duo|singing|sing|sings|trading)\\b|\\b(?:sung|sang|performed)\\s+by\\s+(?:a\\s+)?${pair}\\b`));
  if (duo || mixed) return teamById("duet-mf");
  const voiceWord = "(?:voice|vocals?|vocalist|singer|lead|rapper|sings|singing)";
  if (is(new RegExp(`\\b(?:female|woman|women|girl|lady)\\s+${voiceWord}|\\b(?:sung|sang|performed)\\s+by\\s+(?:a\\s+)?(?:woman|female|girl|lady)\\b`))) return teamById("solo-female");
  if (is(new RegExp(`\\b(?:male|man|men|guy)\\s+${voiceWord}|\\b(?:sung|sang|performed)\\s+by\\s+(?:a\\s+)?(?:man|male|guy)\\b`))) return teamById("solo-male");
  return undefined;
}

/** The team implied by an older "Vocals" setting (Pro voice options). */
export function teamFromArrangement(arrangement: string | undefined): SingerTeam | undefined {
  if (arrangement === "Solo female lead") return teamById("solo-female");
  if (arrangement === "Solo male lead") return teamById("solo-male");
  if (arrangement === "Duet") return teamById("duet-mf");
  if (arrangement === "Call and response") return teamById("call-response");
  if (arrangement === "Choir / group vocals") return teamById("choir");
}

/** Find the team inside a voice direction the client sent (server side). */
export function teamFromDirection(voice: string): SingerTeam | undefined {
  return singerTeams.find(team => team.voices > 1 && voice.includes(team.direction));
}

type Part = "verse" | "pre" | "chorus" | "bridge" | "intro" | "outro" | "other";
function partKind(name: string): Part {
  const n = name.toLowerCase();
  if (/pre[- ]?chorus|build/.test(n)) return "pre";
  if (/chorus|hook|refrain|drop|finale/.test(n)) return "chorus";
  if (/verse|spoken/.test(n)) return "verse";
  if (/bridge|breakdown/.test(n)) return "bridge";
  if (/intro/.test(n)) return "intro";
  if (/outro/.test(n)) return "outro";
  return "other";
}

/** Who sings this part. verseNumber counts verses from 1. */
export function partSinger(team: SingerTeam, kind: Part, verseNumber: number): string {
  const odd = verseNumber % 2 === 1;
  switch (team.id) {
    case "duet-mf": return kind === "verse" ? (odd ? "Male voice" : "Female voice") : kind === "pre" ? (odd ? "Female voice answers the male voice" : "Male voice answers the female voice") : kind === "bridge" ? "Female voice, then both voices" : "Both voices together in harmony";
    case "duet-ff": return kind === "verse" ? (odd ? "First female voice" : "Second female voice") : kind === "pre" ? "Both female voices trading lines" : kind === "bridge" ? "Second female voice, then both" : "Both female voices together in harmony";
    case "duet-mm": return kind === "verse" ? (odd ? "First male voice" : "Second male voice") : kind === "pre" ? "Both male voices trading lines" : kind === "bridge" ? "Second male voice, then both" : "Both male voices together in harmony";
    case "trio": return kind === "verse" ? ["First voice", "Second voice", "Third voice"][(verseNumber - 1) % 3] : kind === "pre" ? "Two voices in harmony" : kind === "bridge" ? "Third voice, then all three" : "All three voices in tight harmony";
    case "group-chant": return kind === "verse" ? "Lead voice calls, the group chants back" : kind === "bridge" ? "Group chanting softly, building up" : "Whole group chanting together in unison with claps and stomps";
    case "choir": return kind === "verse" ? "Lead singer with soft choir behind" : kind === "pre" ? "Choir rising" : kind === "bridge" ? "Choir alone in harmony" : "Full choir with the lead singer";
    case "call-response": return kind === "verse" || kind === "pre" ? "Lead calls each line, group answers" : kind === "bridge" ? "Lead singer alone" : "Everyone together";
    case "rap-sung": return kind === "verse" ? "Rapper" : kind === "pre" ? "Rapper, singer joins" : kind === "bridge" ? "Singer" : kind === "chorus" ? "Singer sings the hook" : "Singer";
    default: return team.arrangement;
  }
}

/**
 * Label each part heading with who sings it. Headings that already carry the
 * person's own direction ([Chorus: whisper], [Verse | Genre: …]) are left alone.
 */
export function labelPartSingers(lyrics: string, team: SingerTeam | undefined): string {
  if (!team || team.voices < 2 || !lyrics.trim()) return lyrics;
  let verse = 0;
  return lyrics.split("\n").map(line => {
    const heading = /^(\s*)\[([^\]:|\r\n]+)\]\s*$/.exec(line);
    if (!heading) return line;
    const name = heading[2].trim(), kind = partKind(name);
    if (!/verse|chorus|hook|refrain|bridge|intro|outro|drop|finale|build|breakdown|spoken/i.test(name)) return line;
    if (kind === "verse") verse++;
    if ((kind === "intro" || kind === "outro") && /instrumental/i.test(name)) return line;
    return `${heading[1]}[${name}: ${partSinger(team, kind, Math.max(1, verse))}]`;
  }).join("\n");
}
