/**
 * Instruments chosen for you: the genres you tap (and the ones your idea
 * mentions) decide a fitting band. Instruments you name yourself always win.
 */
/** Instrument buttons: tap to put them in the song's Instruments box. */
export const quickInstruments = ["Piano", "Acoustic guitar", "Electric guitar", "Bass", "Drums", "808 bass", "Strings", "Violin", "Cello", "Organ", "Synths", "Pads", "Saxophone", "Trumpet", "Flute", "Harp", "Choir", "Bells", "Singing bowls", "Oud", "Darbuka", "Tabla", "Ukulele", "Hand claps"] as const;
/** Add or remove one instrument from the box's comma list, keeping everything else the creator typed. */
export function toggleInstrument(box: string, name: string) {
  const items = box.split(",").map(s => s.trim()).filter(Boolean);
  const has = items.some(i => i.toLowerCase() === name.toLowerCase());
  return (has ? items.filter(i => i.toLowerCase() !== name.toLowerCase()) : [...items, name]).join(", ");
}
export const inBox = (box: string, name: string) => box.split(",").some(i => i.trim().toLowerCase() === name.toLowerCase());
export const quickGenres = ["Pop", "Soul", "R&B", "Hip Hop", "Gospel", "Rock", "Afrobeats", "Reggae", "Latin", "Country", "Jazz", "Electronic", "Ambient", "Devotional", "Cinematic", "Acoustic", "Kids"] as const;

const palettes: [RegExp, string[]][] = [
  [/\bpop\b/i, ["bright piano", "punchy drums", "warm bass", "shimmering synths", "clean electric guitar"]],
  [/\b(?:soul|neo.?soul)\b/i, ["Rhodes electric piano", "warm bass", "soft drums", "horn section", "organ"]],
  [/\b(?:r&b|rnb)\b/i, ["electric keys", "smooth bass", "crisp snaps and hi-hats", "lush pads", "clean guitar"]],
  [/\b(?:hip[ -]?hop|rap|trap|drill)\b/i, ["hard-hitting drums", "808 bass", "dark piano", "atmospheric pads", "vinyl samples"]],
  [/\bgospel\b/i, ["Hammond organ", "grand piano", "full choir pads", "bass", "live drums", "hand claps"]],
  [/\brock\b/i, ["electric guitars", "bass guitar", "live drums", "piano"]],
  [/\bafro(?:beats?)?\b/i, ["log drums", "afro percussion", "bright guitar licks", "warm bass", "shakers"]],
  [/\b(?:reggae|dancehall)\b/i, ["offbeat guitar skank", "deep bass", "one-drop drums", "organ bubble"]],
  [/\b(?:latin|salsa|bachata|reggaeton|cumbia)\b/i, ["nylon guitar", "congas and bongos", "piano montuno", "bass", "brass"]],
  [/\bcountry\b/i, ["acoustic guitar", "pedal steel", "fiddle", "bass", "brushed drums"]],
  [/\bjazz\b/i, ["upright bass", "jazz piano", "brushed drums", "saxophone"]],
  [/\b(?:electronic|edm|house|techno|dance|trance)\b/i, ["analog synths", "driving electronic drums", "deep sub bass", "arpeggios", "pads"]],
  [/\b(?:ambient|meditat\w*|mantra|healing|sound ?bath|yoga|sleep)\b/i, ["soft pads", "singing bowls", "gentle piano", "airy textures", "slow drone"]],
  [/\b(?:devotional|spiritual|worship|kirtan|bhajan|sacred|prayer)\b/i, ["harmonium", "tanpura drone", "gentle percussion", "soft strings", "bells"]],
  [/\b(?:cinematic|epic|orchestral|film)\b/i, ["orchestral strings", "french horns", "big cinematic drums", "piano", "choir"]],
  [/\b(?:acoustic|folk|unplugged)\b/i, ["acoustic guitar", "soft piano", "light percussion", "cello"]],
  [/\b(?:children'?s|kids?|nursery|lullab\w*|sing[- ]?along)\b/i, ["ukulele", "glockenspiel", "hand claps", "bouncy bass", "soft piano"]],
  [/\b(?:arab\w*|dabke|lebanese|middle eastern)\b/i, ["oud", "darbuka", "qanun", "ney flute", "bass"]],
  [/\b(?:ballad|love song|romantic)\b/i, ["piano", "soft strings", "warm bass", "gentle drums"]],
];
// Instruments named in the idea itself: when present, nothing is added on top.
const named = /\b(?:piano|guitar|violin|cello|strings?|drums?|bass|synths?|organ|harmonium|flute|sax(?:ophone)?|trumpet|horns?|oud|darbuka|tabla|sitar|ukulele|harp|bells?|choir|808)\b/i;
const fallback = ["piano", "acoustic guitar", "warm bass", "light drums", "soft strings"];

/** "Soul, Gospel" → "Soul × Gospel" for the blend label. */
export const blendName = (genres: string[]) => genres.join(" × ");

/** A fitting band for the idea and the tapped genres, at most 6 instruments, or "" when the idea already names its instruments. */
export function autoInstruments(idea: string, genres: string[]) {
  if (named.test(idea)) return "";
  const sources = [...genres, idea];
  const picked: string[][] = [];
  for (const text of sources) for (const [pattern, band] of palettes) if (pattern.test(text) && !picked.includes(band)) picked.push(band);
  if (!picked.length) return fallback.join(", ");
  // Blend: the leading instruments of each style, taking turns, without repeats.
  const out: string[] = [], per = picked.length === 1 ? 6 : picked.length === 2 ? 3 : 2;
  for (let i = 0; i < per; i++) for (const band of picked) if (band[i] && !out.some(x => x.toLowerCase() === band[i].toLowerCase())) out.push(band[i]);
  return out.slice(0, 6).join(", ");
}
