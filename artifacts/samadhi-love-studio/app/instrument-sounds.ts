/**
 * Short "what it sounds like" words for instruments, so the music engine hears
 * the sound you picked, not just a name it may not know. Kept short on purpose:
 * ACE-Step reads at most 512 characters of style directions in total.
 */
export const instrumentSounds: Record<string, string> = {
  oud: "warm fretless lute, round plucked attack",
  darbuka: "goblet drum, deep doum and crisp tek",
  mijwiz: "bright buzzing double-pipe reed",
  ney: "breathy end-blown reed flute",
  qanun: "shimmering plucked zither, fast ornaments",
  zurna: "loud piercing double-reed horn",
  riq: "small jingling frame drum",
  baglama: "bright long-neck folk lute",
  "bağlama": "bright long-neck folk lute",
  saz: "bright long-neck folk lute",
  sitar: "buzzing sympathetic-string sitar drone",
  tabla: "tuned hand drums, bending bass bayan",
  tanpura: "continuous shimmering drone",
  djembe: "goblet drum, deep bass and sharp slaps",
  didgeridoo: "low droning circular-breath horn",
  kora: "rippling West African harp",
  pandeiro: "Brazilian jingle frame drum, snappy",
  claves: "clear wooden click",
  guzheng: "plucked zither with bending notes",
  shakuhachi: "breathy bamboo flute, bending pitch",
  violin: "singing bowed strings",
  cello: "warm deep bowed strings",
  "acoustic piano": "warm grand piano",
  piano: "warm grand piano",
  "electric piano": "mellow bell-like Rhodes keys",
  rhodes: "mellow bell-like Rhodes keys",
  synthesizer: "lush evolving synth",
  synth: "lush evolving synth",
  "808 bass": "deep booming sliding 808 sub bass",
  "808": "deep booming sliding 808 sub bass",
  "prepared piano": "muted percussive prepared piano",
  "modular synth": "bubbling patchable modular synth",
  "acoustic guitar": "bright strummed acoustic guitar",
  "electric guitar": "clean chorused electric guitar",
  guitar: "bright strummed acoustic guitar",
  "bass guitar": "round warm bass guitar",
  bass: "round warm bass guitar",
  drums: "punchy live drum kit",
  "drum kit": "punchy live drum kit",
  organ: "warm swirling Hammond organ",
  "hammond organ": "warm swirling Hammond organ",
  strings: "lush string section",
  choir: "big soaring choir",
  saxophone: "smoky expressive saxophone",
  sax: "smoky expressive saxophone",
  trumpet: "bright brassy trumpet",
  flute: "airy silver flute",
  harp: "glistening plucked harp",
  ukulele: "light bouncy ukulele",
  banjo: "twangy bright banjo",
  steelpan: "sparkling Caribbean steel pan",
  "steel pan": "sparkling Caribbean steel pan",
  congas: "warm slapped congas",
  bongos: "tight high bongos",
  marimba: "woody mellow marimba",
  kalimba: "soft plucked thumb piano",
  "singing bowl": "long ringing singing bowl",
  "singing bowls": "long ringing singing bowls",
  harmonium: "breathy reedy harmonium",
};

const key = (name: string) => name.toLowerCase().normalize("NFC").replace(/\s+/g, " ").trim();
/** "Oud, Tabla" → "Oud (warm fretless lute, round plucked attack), Tabla (…)". Unknown names stay as written. */
export function describeInstruments(instruments: string) {
  let found = false;
  const described = instruments.split(/\s*[,;]\s*|\s+and\s+/i).map(s => s.trim()).filter(Boolean).map(name => {
    const sound = instrumentSounds[key(name)];
    if (!sound || name.includes("(")) return name;
    found = true;
    return `${name} (${sound})`;
  }).join(", ");
  return found ? described : instruments;
}
