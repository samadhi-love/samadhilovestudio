import { freshSong, type Song, type Template } from "./studio-data";
import { genreDirection, genreFamilies, sameGenre, uniqueGenreNames } from "./music-genres";

type SongForm = "song" | "instrumental" | "mantra" | "rap" | "dance";
type Recipe = [id: string, name: string, genres: string[], bpm: number, instruments: string, vibe: string, vocals: string, form?: SongForm];
const recipes: Recipe[] = [
  ["dabke-festival", "Lebanese Dabke Festival", ["Lebanese Dabke", "Euro House"], 130, "mijwiz, darbuka, handclaps, bright piano and warm bass", "A communal celebration with a clear call-and-response hook.", "Alternate short solo calls and a group response; leave space for the percussion.", "dance"],
  ["tarab-ballad", "Egyptian Tarab Ballad", ["Tarab", "Egyptian Pop"], 78, "oud, qanun, ney, strings and restrained riq", "An expressive, spacious ballad with an unfolding emotional arc.", "A clear solo lead with measured ornamentation; preserve the chosen dialect."],
  ["khaleeji-moonlight", "Khaleeji Moonlight", ["Khaleeji", "Arabic Pop"], 104, "oud, mirwas-inspired hand percussion, strings and rounded bass", "A warm Gulf-inspired groove with a generous melodic refrain.", "An articulate solo lead with brief answering harmonies."],
  ["sunrise-house", "Melodic House Sunrise", ["Melodic House", "Progressive House"], 122, "piano, evolving arpeggios, sidechained pads and a rounded kick", "A patient sunrise build that opens into a melodic chorus.", "An airy but intelligible lead with short, memorable phrases.", "dance"],
  ["afro-house-circle", "Afro House Circle", ["Afro House", "Soulful House"], 120, "layered hand percussion, mallets, warm chords and a grounded bass", "An uplifting circular groove with room for dancers and voices.", "A soulful lead answered by light group harmonies.", "dance"],
  ["organic-desert", "Organic Desert Groove", ["Organic House", "Oriental Deep House"], 116, "oud textures, shakers, soft kick, acoustic plucks and deep bass", "A flowing instrumental journey with an intimate acoustic center.", "Instrumental direction: no sung lead; let melodic instruments answer each other.", "instrumental"],
  ["trance-skyline", "Uplifting Trance Skyline", ["Uplifting Trance", "Trance"], 138, "supersaw chords, rolling bass, arpeggios and spacious pads", "A broad emotional lift with a calm breakdown before the final peak.", "A clear melodic lead; avoid crowded syllables before the drop.", "dance"],
  ["vocal-trance-lift", "Vocal Trance Lift", ["Vocal Trance", "Progressive Trance"], 134, "pulsing bass, luminous plucks, piano and wide synth chords", "A hopeful vocal refrain carried into an energetic dance arrangement.", "A centered solo vocal with a restrained harmony on the last phrase.", "dance"],
  ["liquid-flight", "Liquid Drum & Bass Flight", ["Liquid Drum & Bass", "Drum & Bass"], 172, "fluid breakbeats, soft piano, sub-bass and floating pads", "Fast drums beneath a gentle, spacious melodic story.", "Use relaxed half-time phrasing and distinct breaths between lines.", "dance"],
  ["neon-pop", "Neon Synth Pop", ["Synth Pop", "Electropop"], 112, "bright synths, gated drums, melodic bass and small guitar accents", "A colorful pop song with a crisp, singable chorus.", "A conversational verse and a clear, layered chorus."],
  ["kpop-hook", "K-Pop Hook Garden", ["K-Pop", "Dance Pop"], 118, "tight drums, glossy synth hooks, bass and rhythmic vocal accents", "A playful pop arrangement with contrasting sections and a strong hook.", "Assign lead and response parts clearly; use an optional short rhythmic passage."],
  ["acoustic-daylight", "Acoustic Pop Daylight", ["Acoustic Pop", "Singer-Songwriter"], 96, "acoustic guitar, soft piano, brushed drums and gentle bass", "An approachable, heartfelt song that grows without losing intimacy.", "A natural solo vocal with light chorus harmonies."],
  ["velvet-soul", "Velvet Neo Soul", ["Neo Soul", "Soul"], 82, "electric piano, expressive bass, dry drums and muted guitar", "Warm extended chords and a close, unhurried groove.", "A present lead with tasteful ad-libs only in the later chorus."],
  ["midnight-rnb", "Midnight R&B", ["Contemporary R&B", "Alternative R&B"], 74, "soft keys, sub-bass, sparse drums and atmospheric guitar", "An intimate late-night song with space around every line.", "An intelligible close lead; keep reverb restrained and backing vocals separate."],
  ["sunshine-funk", "Sunshine Funk", ["Funk", "Disco"], 112, "rhythm guitar, syncopated bass, horns and tight acoustic drums", "A bright, positive pocket with an inviting chorus.", "A rhythmic lead with short group responses."],
  ["conscious-boom-bap", "Conscious Boom Bap", ["Conscious Hip-hop", "Boom Bap"], 90, "original dusty drum textures, warm keys, upright-style bass and horn accents", "A thoughtful story over a steady, uncluttered groove.", "Articulate rhythmic verses with a simple sung hook.", "rap"],
  ["cinematic-trap", "Cinematic Trap Journey", ["Trap", "Hip-hop"], 140, "808 bass, crisp hi-hats, orchestral accents and a restrained piano motif", "A dramatic half-time arrangement with space for a personal story.", "Clear, measured rap delivery; give strong syllables breathing room.", "rap"],
  ["melodic-rap", "Melodic Rap Horizon", ["Melodic Rap", "R&B"], 92, "soft guitar, 808 bass, warm pads and tight percussion", "A melodic refrain connects reflective verses to an uplifting finale.", "Alternate articulate rap and a clearly sung hook.", "rap"],
  ["indie-open-road", "Indie Rock Open Road", ["Indie Rock", "Alternative Rock"], 124, "jangling guitars, live drums, melodic bass and small organ accents", "An open, energetic band song with a memorable refrain.", "A natural lead that stays clear above the guitars."],
  ["progressive-rock", "Progressive Rock Journey", ["Progressive Rock", "Rock"], 108, "layered guitars, piano, expressive bass and dynamic acoustic drums", "A connected arrangement with changing textures and a returning theme.", "Use clear section contrasts and a recurring melodic lead."],
  ["post-rock-horizon", "Post Rock Horizon", ["Post Rock", "Ambient"], 88, "delay guitar, bowed textures, bass and gradually expanding drums", "A patient instrumental rise from quiet detail to a broad finale.", "Instrumental direction: no lead lyric; repeat and develop an original motif.", "instrumental"],
  ["symphonic-metal", "Symphonic Metal Anthem", ["Symphonic Metal", "Heavy Metal"], 132, "orchestral strings, heavy guitars, bass, choir textures and dynamic drums", "A dramatic anthem with a hopeful central refrain.", "A clear melodic lead; keep choir layers behind the words."],
  ["pop-punk-spark", "Pop Punk Spark", ["Pop Punk", "Punk Rock"], 160, "bright power-chord guitars, picked bass and energetic drums", "A quick, optimistic band song with a direct chorus.", "An energetic, intelligible lead with brief group harmonies."],
  ["power-metal-quest", "Power Metal Quest", ["Power Metal", "Symphonic Metal"], 150, "galloping guitars, melodic bass, orchestral accents and driving drums", "A melodic journey about courage, cooperation and renewal.", "A clear sustained lead; leave instrumental replies between longer phrases."],
  ["jazz-trio", "Midnight Jazz Trio", ["Jazz", "Cool Jazz"], 92, "piano, upright bass and brushed acoustic drums", "An intimate instrumental conversation built around a returning theme.", "Instrumental direction: trade melodic phrases without a vocal lead.", "instrumental"],
  ["latin-jazz-terrace", "Latin Jazz Terrace", ["Latin Jazz", "Bossa Nova"], 108, "nylon guitar, piano, upright bass and light Latin percussion", "A gentle syncopated melody with a warm, airy feel.", "A relaxed solo vocal, or adapt the melody to an instrumental lead."],
  ["blues-slow-burn", "Blues Slow Burn", ["Blues", "Soul"], 72, "expressive electric guitar, organ, bass and restrained drums", "A spacious blues story with instrumental answers after each phrase.", "An honest, clear lead; avoid filling every bar with words."],
  ["folk-campfire", "Folk Campfire", ["Folk", "Acoustic"], 88, "fingerpicked guitar, subtle hand percussion and warm acoustic bass", "A small, welcoming story with a chorus people can share.", "A natural lead with an optional final group refrain."],
  ["country-story", "Country Story Road", ["Country", "Americana"], 100, "acoustic guitar, pedal-steel textures, bass and a light backbeat", "A concrete story that resolves into a memorable, warm chorus.", "Conversational verses and an articulate melodic chorus."],
  ["bluegrass-gathering", "Bluegrass Gathering", ["Bluegrass", "Appalachian Folk"], 128, "banjo, fiddle, mandolin, acoustic guitar and upright bass", "An acoustic gathering with lively instrumental exchanges.", "A clear lead with close refrain harmonies."],
  ["bachata-stars", "Bachata Under the Stars", ["Bachata", "Latin Pop"], 122, "repeating guitar figures, bass, bongos and guira textures", "A tender dance song with an easy melodic refrain.", "A clear solo lead with a short answering harmony."],
  ["reggaeton-sunset", "Reggaeton Sunset", ["Reggaeton", "Latin Pop"], 96, "dembow-inspired percussion, rounded bass, bright plucks and soft chords", "A positive, relaxed dance song with a memorable hook.", "Use short clean phrases and distinct rhythmic responses.", "dance"],
  ["salsa-celebration", "Salsa Celebration", ["Salsa", "Latin Jazz"], 104, "piano montuno, bass, congas, timbales and bright brass", "A joyful band arrangement with a clear call-and-response center.", "Alternate a readable lead story with a concise group refrain."],
  ["amapiano-garden", "Amapiano Garden", ["Amapiano", "Afrobeats"], 112, "piano chords, log-drum-style bass, shakers and soft percussion", "A patient, buoyant groove that develops around a simple motif.", "A relaxed melodic lead with space for percussion.", "dance"],
  ["afrobeats-radiance", "Afrobeats Radiance", ["Afrobeats"], 104, "interlocking percussion, melodic guitar, warm bass and light synths", "A bright, flowing groove with an inviting refrain.", "An articulate lead with brief, playful responses."],
  ["highlife-homecoming", "Highlife Homecoming", ["Highlife", "Afrobeat"], 114, "interlocking guitars, brass, bass and layered live percussion", "A joyful homecoming carried by melodic band interplay.", "A clear lead and a warm answering group."],
  ["bollywood-celebration", "Bollywood Celebration", ["Bollywood", "Indian Fusion"], 116, "dholak, tabla textures, strings, melodic flute and bright bass", "A colorful song with contrasting verses and a celebratory refrain.", "Keep syllables and performer roles clear in the selected language."],
  ["bhangra-energy", "Bhangra Energy", ["Bhangra", "Punjabi Pop"], 128, "dhol, tumbi textures, bass and bright synth accents", "An energetic dance arrangement with rhythmic melodic calls.", "A clear lead with brief group responses and breathing space.", "dance"],
  ["east-asian-cinema", "East Asian Cinematic Garden", ["Chinese Traditional", "Cinematic"], 76, "plucked-string textures, bowed melody, bamboo-flute textures and soft percussion", "A spacious instrumental scene with a recurring original melody.", "Instrumental direction: let the melodic instruments lead without sung words.", "instrumental"],
  ["balkan-brass", "Balkan Brass Gathering", ["Balkan Brass", "Balkan Folk"], 136, "brass ensemble, tapan-inspired drums and agile acoustic bass", "A lively communal dance with clear instrumental answers.", "A concise lead refrain with optional group responses."],
  ["celtic-river", "Celtic Folk River", ["Celtic Folk", "Contemporary Folk"], 94, "fiddle, whistle, acoustic guitar and a light frame drum", "A flowing acoustic story with a gently rising refrain.", "A natural clear lead; leave room for instrumental turns."],
  ["slavic-folk-dance", "Slavic Folk Dance", ["Slavic Folk", "Russian Folk"], 118, "accordion, plucked strings, acoustic bass and hand percussion", "A warm folk-dance arrangement with a repeating melodic center.", "A clear lead in the chosen language with short group answers."],
  ["orchestral-rise", "Orchestral Rise", ["Orchestral", "Film Score"], 84, "strings, piano, woodwinds, brass and restrained orchestral percussion", "An instrumental theme that grows from intimate detail into a broad resolution.", "Instrumental direction: develop an original theme without a lyric lead.", "instrumental"],
  ["piano-reflections", "Solo Piano Reflections", ["Solo Piano", "Neoclassical"], 68, "solo acoustic piano with natural room detail", "A gentle instrumental conversation with a recognizable returning motif.", "Instrumental direction: phrased melody with silence between musical thoughts.", "instrumental"],
  ["string-quartet", "String Quartet Heart", ["String Quartet", "Chamber Music"], 80, "two violins, viola and cello", "An intimate original theme shared between four acoustic voices.", "Instrumental direction: distinguish the melodic and supporting string lines.", "instrumental"],
  ["mantra-light", "Mantra of Light", ["Mantra", "Spiritual Ambient"], 72, "soft drone, gentle bells, acoustic plucks and restrained hand percussion", "A repeating original devotional phrase that slowly opens into harmony.", "Use the user's approved words, clear syllables and spacious repetitions.", "mantra"],
  ["kirtan-devotion", "Kirtan Devotion", ["Kirtan", "Devotional"], 90, "harmonium textures, hand percussion, acoustic strings and soft drone", "A patient devotional call-and-response with a welcoming final refrain.", "Separate the lead call and group response; preserve approved wording.", "mantra"],
  ["devotional-nasheed", "Devotional Nasheed", ["Nasheed", "Devotional"], 76, "voice-led textures with optional restrained hand percussion", "A respectful devotional song centered on clearly delivered words.", "A clear solo or group vocal; adapt percussion to the user's preference.", "mantra"],
  ["cosmic-soundscape", "Cosmic Soundscape", ["Ambient", "Soundscape"], 60, "evolving pads, slow bells, airy textures and gentle low drones", "An instrumental atmosphere with an unhurried sense of spaciousness.", "Instrumental direction: no lyric lead; use gradual melodic and timbral changes.", "instrumental"],
  ["downtempo-journey", "Downtempo Journey", ["Downtempo", "Trip-hop"], 86, "soft breakbeats, electric piano, warm bass and atmospheric guitar", "A reflective groove with a small, memorable melodic hook.", "A close, articulate lead with restrained effects."],
  ["lofi-window", "Lo-fi Study Window", ["Lo-fi", "Chillhop"], 78, "warm keys, original soft drum textures, rounded bass and subtle ambience", "A gentle instrumental loop that evolves without crowding the listener.", "Instrumental direction: no lyric lead; leave space around the melody.", "instrumental"],
];
const structures: Record<SongForm, string> = {
  song: "[Intro]\n\n[Verse 1]\n\n[Pre-Chorus]\n\n[Chorus]\n\n[Verse 2]\n\n[Chorus]\n\n[Bridge]\n\n[Final Chorus]\n\n[Outro]",
  rap: "[Intro]\n\n[Verse 1 - Rap]\n\n[Hook - Sung]\n\n[Verse 2 - Rap]\n\n[Hook - Sung]\n\n[Bridge]\n\n[Final Hook]",
  dance: "[Intro]\n\n[Verse]\n\n[Build]\n\n[Chorus]\n\n[Instrumental Drop]\n\n[Verse 2]\n\n[Breakdown]\n\n[Final Chorus]\n\n[Outro]",
  mantra: "[Quiet Intro]\n\n[Lead Call]\n\n[Group Response]\n\n[Verse]\n\n[Refrain]\n\n[Instrumental Space]\n\n[Final Refrain]\n\n[Quiet Outro]",
  instrumental: "[Instrumental Intro]\n\n[Theme A]\n\n[Theme B]\n\n[Development]\n\n[Quiet Breakdown]\n\n[Theme A - Return]\n\n[Instrumental Outro]",
};
export const studioSongPresets: Template[] = recipes.map(([id, name, genres, bpm, instruments, vibe, vocals, form = "song"]) => ({
  id: "preset-" + id, name, description: vibe, tags: genres,
  notes: { lyrics: structures[form], prompt: `${genreDirection(genres)}\n${bpm} BPM. ${vibe} Use ${instruments}. Build an original arrangement with clear section contrasts and a satisfying final return.`,
    vocals, instruments, cover: `Original artwork inspired by ${name.toLowerCase()}; an uncluttered palette with room for the artist's name.`,
    video: form === "instrumental" ? "Use slow section-aware background changes and restrained motion around the original melody." : "Keep lyric lines readable with a contrast overlay; change emphasis at the refrain and leave instrumental gaps clear.",
    promotion: "Choose a representative short excerpt after the recording is ready; review credits and rights before sharing or publishing." },
}));
export function isStudioPreset(id: string) { return studioSongPresets.some(preset => preset.id === id); }
/** Merge only for browsing; never insert defaults into or overwrite saved user data. */
export function availableSongTemplates(saved: Template[]) {
  const ids = new Set(saved.map(template => template.id));
  return [...saved, ...studioSongPresets.filter(template => !ids.has(template.id))];
}
export function templateFamilies(template: Template): string[] {
  return genreFamilies.filter(family => template.tags.some(tag => family.genres.some(genre => sameGenre(tag, genre)))).map(family => family.name);
}
export function filterSongTemplates(templates: Template[], search: string, family: string, savedTemplateIds?: string[]) {
  const query = search.trim().toLocaleLowerCase();
  return templates.filter(template => (!query || [template.name, template.description, ...template.tags].join(" ").toLocaleLowerCase().includes(query)) &&
    (family === "All templates" || family === "Saved templates" && (savedTemplateIds ? savedTemplateIds.includes(template.id) : !isStudioPreset(template.id)) || templateFamilies(template).includes(family)));
}
export function songFromStarter(id: string, title: string, index: number, template: Template | undefined, styles: string[], stylePrompt = ""): Song {
  const song = freshSong(id, title.trim(), index, template), genres = uniqueGenreNames(styles);
  song.tags = genres;
  const unchanged = !!template && genres.length === template.tags.length && genres.every((genre, i) => sameGenre(genre, template.tags[i]));
  if (!unchanged && genres.length) song.notes.prompt = [genreDirection(genres), template && "Chosen styles take priority over conflicting style references in the editable template notes below.", song.notes.prompt].filter(Boolean).join("\n\n");
  if (stylePrompt.trim()) song.notes.prompt = [stylePrompt.trim(), song.notes.prompt].filter(Boolean).join("\n\n");
  return song;
}
