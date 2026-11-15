import { genreFamilies, genreSearchKey } from "./music-genres";
export type Rhythm = { bpm: number; meter: string; beats: number; pulse: string };
export type CatalogEntry = {
  id: string; name: string; kind: "Genre" | "Instrument" | "Rhythm" | "Vocal" | "Technique" | "Mood";
  region: string; description: string; combine?: string; family?: string;
  rhythm?: Rhythm; bpm?: [number, number]; moods?: string[]; languages?: string[]; vocals?: string[];
};

const genres: CatalogEntry[] = [
  { id: "dabke", name: "Lebanese Dabke", kind: "Genre", region: "Lebanon · Levant", bpm: [105, 150], moods: ["Celebratory"], languages: ["Arabic"], vocals: ["Call and response"], description: "A line-dance tradition with synchronized steps and emphatic accents. Lebanon has its own regional repertoires and performance styles.", combine: "Mijwiz, darbuka, and a bright piano answering the lead motif" },
  { id: "tarab", name: "Arabic Tarab", kind: "Genre", region: "Egypt · Levant", bpm: [65, 120], moods: ["Reflective", "Devotional"], languages: ["Arabic"], vocals: ["Solo"], description: "A performance aesthetic centered on emotional connection, ornamented melody, and interplay between performer and listeners.", combine: "Oud, qanun, ney, riq, and a voice with space for ornamentation" },
  { id: "anatolian", name: "Anatolian Folk", kind: "Genre", region: "Türkiye", bpm: [80, 150], moods: ["Celebratory"], languages: ["Turkish"], vocals: ["Solo"], description: "A broad set of regional folk traditions. Dance meters and instruments vary considerably by locality.", combine: "Bağlama, davul, and a clear unison melody" },
  { id: "rnb", name: "Contemporary R&B", kind: "Genre", region: "United States", bpm: [65, 115], moods: ["Tender", "Uplifting"], languages: ["English"], vocals: ["Solo", "Duet", "Harmony"], description: "Soulful phrasing and expressive harmony over a groove. A clean duet can alternate close-miked verses and harmonized hooks.", combine: "Electric piano, round bass, soft kick, and vocal doubles" },
  { id: "hiphop", name: "Positive Hip-Hop", kind: "Genre", region: "United States", bpm: [70, 115], moods: ["Confident", "Uplifting"], languages: ["English"], vocals: ["Rap", "Duet"], description: "Rhythmic wordplay and beats that can carry stories of resilience, family, and celebration.", combine: "808 bass, hand percussion, and a sung R&B hook" },
  { id: "house", name: "Melodic House", kind: "Genre", region: "United States · Europe", bpm: [115, 132], moods: ["Euphoric", "Uplifting"], languages: ["English", "Instrumental"], vocals: ["Solo", "Instrumental"], description: "House pulse under evolving harmony, spacious synths, and a memorable melodic theme.", combine: "Piano, warm synth bass, filtered pads, and a four-on-the-floor kick" },
  { id: "euro", name: "Eurodance", kind: "Genre", region: "Europe", bpm: [125, 150], moods: ["Euphoric", "Celebratory"], languages: ["English"], vocals: ["Rap", "Duet"], description: "Dance-pop choruses, propulsive kicks, bright synth hooks, and often an alternating rap and sung lead.", combine: "Piano stabs, synth bass, and a sung hook over short rap verses" },
  { id: "ambient", name: "Spiritual Ambient", kind: "Genre", region: "Global", bpm: [45, 85], moods: ["Reflective", "Devotional"], languages: ["Instrumental", "English"], vocals: ["Whisper", "Instrumental"], description: "A spacious production approach with slow harmonic movement, drones, and gentle textures.", combine: "Ney, soft synth pads, and a low frame drum" },
  { id: "afrobeats", name: "Afrobeats", kind: "Genre", region: "Nigeria · Ghana", bpm: [85, 118], moods: ["Celebratory", "Uplifting"], languages: ["English", "Yoruba", "Pidgin"], vocals: ["Solo", "Harmony"], description: "Contemporary West African pop with syncopated percussion, melodic bass, and diverse vocal phrasing.", combine: "Interlocking percussion, clean electric guitar, and bass" },
  { id: "highlife", name: "Highlife", kind: "Genre", region: "Ghana · Nigeria", bpm: [90, 140], moods: ["Celebratory"], languages: ["Akan", "English"], vocals: ["Harmony"], description: "West African styles that include intricate guitar bands and larger dance-band arrangements.", combine: "Two interlocking guitar patterns, bell, and light brass" },
  { id: "hindustani", name: "Hindustani Classical", kind: "Genre", region: "India · South Asia", moods: ["Reflective", "Devotional"], languages: ["Hindi", "Instrumental"], vocals: ["Solo", "Instrumental"], description: "North Indian classical traditions organized around melodic frameworks called ragas and rhythmic cycles called talas.", combine: "Sitar, tabla, and tanpura drone" },
  { id: "citypop", name: "City Pop", kind: "Genre", region: "Japan", bpm: [85, 126], moods: ["Tender", "Uplifting"], languages: ["Japanese"], vocals: ["Solo", "Harmony"], description: "A broad label for Japanese urban pop with funk, disco, jazz, and sophisticated studio arrangements.", combine: "Electric piano, syncopated guitar, synth brass, and melodic bass" },
  { id: "gamelan", name: "Javanese Gamelan", kind: "Genre", region: "Indonesia · Java", moods: ["Reflective"], languages: ["Javanese", "Instrumental"], vocals: ["Solo", "Instrumental"], description: "An ensemble tradition in which gongs mark cycles and instruments weave layers at different rates.", combine: "Gong punctuation, metallophone layers, and kendang cues" },
  { id: "samba", name: "Samba", kind: "Genre", region: "Brazil", bpm: [85, 145], moods: ["Celebratory"], languages: ["Portuguese"], vocals: ["Call and response"], description: "Afro-Brazilian music and dance traditions with many styles, from intimate song circles to large percussion ensembles.", combine: "Surdo, pandeiro, cavaquinho, and a short call-and-response hook" },
  { id: "son", name: "Son Cubano", kind: "Genre", region: "Cuba", bpm: [80, 120], moods: ["Celebratory"], languages: ["Spanish"], vocals: ["Call and response"], description: "Cuban song and dance music with clave-oriented phrasing, repeated instrumental figures, and vocal refrains.", combine: "Tres, bongó, claves, and syncopated bass" },
  { id: "reggae", name: "Roots Reggae", kind: "Genre", region: "Jamaica", bpm: [65, 100], moods: ["Reflective", "Uplifting"], languages: ["English", "Jamaican Patwa"], vocals: ["Solo", "Harmony"], description: "Bass-forward arrangements with offbeat chords and space between drum accents.", combine: "Bass guitar, offbeat guitar, organ, and warm backing vocals" },
  { id: "waltz", name: "Orchestral Waltz", kind: "Genre", region: "Austria · Europe", bpm: [75, 180], moods: ["Tender"], languages: ["Instrumental"], vocals: ["Instrumental"], description: "Triple-meter dance writing with a bass accent and two lighter chord pulses per bar.", combine: "Cello bass, violins, and woodwind counterlines" },
  { id: "cinematic", name: "Cinematic Orchestral", kind: "Genre", region: "Global", bpm: [55, 150], moods: ["Uplifting", "Reflective"], languages: ["Instrumental"], vocals: ["Instrumental", "Choir"], description: "Thematic writing that builds emotion through orchestration, register, and dynamics.", combine: "Cello, piano, strings, soft percussion, and a gradual crescendo" },
];

const instruments: CatalogEntry[] = [
  ["oud", "Oud", "Plucked strings", "Levant · Egypt · Türkiye", "A fretless, bowl-backed lute with a rounded attack. It is central to many Arabic ensembles and also appears in Turkish and other regional traditions.", "Ney, riq, and a gentle bass drone"],
  ["darbuka", "Darbuka", "Hand percussion", "Egypt · Levant · Türkiye", "A goblet drum with a low center stroke and sharp edge strokes. Names and techniques vary across the region.", "Oud, riq, and a steady house kick"],
  ["mijwiz", "Mijwiz", "Reeds", "Lebanon · Syria · Palestine · Jordan", "A double-pipe reed instrument with a bright, tightly blended sound. It is associated with Levantine festivities and Dabke dancing.", "Darbuka, foot stomps, and a simple bass line"],
  ["ney", "Ney", "Flutes", "Egypt · Türkiye · Iran · Levant", "An end-blown flute with a breathy attack. Related traditions use different sizes, tunings, and techniques.", "Oud, qanun, and quiet pads"],
  ["qanun", "Qanun", "Plucked strings", "Levant · Egypt · Türkiye", "A trapezoidal plucked zither whose string courses and tuning levers support delicate ornaments and quick melodic turns.", "Oud, Arabic violin, and riq"],
  ["zurna", "Zurna", "Reeds", "Türkiye · Balkans · Caucasus", "A penetrating double-reed wind used in outdoor festivities. It is often paired with a davul drum.", "Davul and a spacious synth drone"],
  ["riq", "Riq", "Hand percussion", "Egypt · Levant", "A small frame drum with jingles. Players can articulate both dry drum strokes and shimmering accents.", "Qanun, oud, and darbuka"],
  ["baglama", "Bağlama", "Plucked strings", "Türkiye", "A long-necked lute family with bright paired or grouped strings and a rich regional folk repertoire.", "Frame drum, davul, and a restrained bass"],
  ["sitar", "Sitar", "Plucked strings", "India", "A long-necked plucked instrument in Hindustani music. Sympathetic strings ring along with the played notes.", "Tabla, tanpura, and sparse sustained harmony"],
  ["tabla", "Tabla", "Hand percussion", "India · Pakistan", "A pair of tuned hand drums central to Hindustani music. Players use distinct stroke syllables to learn and communicate patterns.", "Sitar, tanpura, and acoustic piano"],
  ["tanpura", "Tanpura", "Plucked strings", "India", "A long-necked drone instrument that supplies a continuous pitch reference for singers and instrumentalists.", "Sitar, voice, and sparse tabla"],
  ["djembe", "Djembe", "Hand percussion", "Guinea · Mali · West Africa", "A goblet-shaped drum from Mandé traditions, with contrasting bass, tone, and slap strokes.", "Dunun, a bell pattern, and a simple refrain"],
  ["didgeridoo", "Didgeridoo", "Drone winds", "Australia · Northern Aboriginal traditions", "A long wind instrument with a continuous drone, rhythmic accents, and varied local names such as yiḏaki in Yolŋu contexts. Follow community guidance for cultural use.", "Sparse percussion and an open, slowly moving texture"],
  ["kora", "Kora", "Plucked strings", "Senegal · Gambia · Mali", "A bridge harp associated with Mandé jeli musicians, with interlocking patterns played by thumbs and index fingers.", "Soft bass, brushed percussion, and sustained strings"],
  ["pandeiro", "Pandeiro", "Hand percussion", "Brazil", "A handheld frame drum with jingles that can provide bass, snap, and bright subdivisions in one part.", "Surdo, cavaquinho, and acoustic bass"],
  ["claves", "Claves", "Hand percussion", "Cuba · Caribbean", "A pair of struck sticks with a clear click. They can mark the timeline around which an ensemble phrases.", "Tres, bongó, and syncopated bass"],
  ["guzheng", "Guzheng", "Plucked strings", "China", "A Chinese plucked zither with movable bridges. Left-hand pressure can bend and color notes after the attack.", "Bowed strings, soft drums, and a light drone"],
  ["shakuhachi", "Shakuhachi", "Flutes", "Japan", "An end-blown bamboo flute known for breath textures and flexible pitch. It appears in solo, ensemble, and contemporary settings.", "Sparse piano, strings, and generous pauses"],
  ["violin", "Violin", "Orchestral strings", "Europe · Global", "A high bowed string instrument. Many classical and folk traditions use it with distinctive tuning and phrasing.", "Cello, piano, and a repeated countermelody"],
  ["cello", "Cello", "Orchestral strings", "Europe · Global", "A bowed instrument with a warm low and middle register. It can anchor harmony or carry a lyrical melody.", "Piano, warm strings, and light percussion"],
  ["piano", "Acoustic Piano", "Acoustic keys", "Italy · Global", "Hammers strike strings when keys are pressed. Its touch-sensitive attack works for both rhythmic chords and intimate melody.", "Cello, brushed drums, or a warm house bass"],
  ["electric-piano", "Electric Piano", "Electronic keys", "United States · Global", "An amplified keyboard sound often heard in soul, jazz, and R&B. Softer playing yields a rounded, bell-like attack.", "Warm bass, light drums, and close lead vocals"],
  ["synth", "Synthesizer", "Electronic", "Global", "A sound-generating instrument with adjustable pitch, tone, and movement. It can create bass, leads, pads, and experimental textures.", "Piano, layered drums, and a slow filter sweep"],
  ["808", "808 Bass", "Electronic", "Japan · United States", "A sustained low kick-derived sound associated with the Roland TR-808 and later hip-hop production.", "A sparse kick pattern, clipped hats, and a clear lead"],
  ["prepared-piano", "Prepared Piano", "Experimental", "United States · Global", "A piano whose strings are altered with removable objects for unusual timbres. It can sound like a compact percussion ensemble.", "Soft synth pad, field recordings, and hand percussion"],
  ["modular", "Modular Synth", "Experimental", "Global", "A synthesizer assembled from patchable modules. Moving a control signal between modules can create evolving textures and unusual rhythms.", "Acoustic percussion, cello, and soft drones"],
].map(([id, name, family, region, description, combine]) => ({ id, name, family, region, description, combine, kind: "Instrument" }));

const rhythms: CatalogEntry[] = ([
  ["dabke-step", "Dabke-inspired Step", "Lebanon · Levant", "A four-beat classroom sketch with a strong stomp and an answering accent. Real Dabke rhythms vary by dance and region.", "Mijwiz, darbuka, and bass", 126, "4/4", 4, "D.t.D.tt"],
  ["maqsum", "Maqsum", "Egypt · Arabic music", "A widely used four-beat percussion cycle. Listen for the contrast between low dum and high tek strokes.", "Darbuka, riq, and oud", 100, "4/4", 4, "Dt.tD.t."],
  ["aksak", "Aksak-inspired 9/8", "Türkiye · Balkans", "An uneven grouping of two, two, two, and three subdivisions. Count 1-2, 1-2, 1-2, 1-2-3.", "Bağlama, davul, and zurna", 190, "9/8", 9, "D.t.t.D.."],
  ["mande", "Mandé-inspired 12-pulse Study", "Guinea · Mali · West Africa", "An introductory bell and drum sketch for hearing repeating accents across four groups of three.", "Djembe, dunun, and bell", 95, "12/8", 4, "D..t.tD.t.t."],
  ["teental", "Teental Count", "India", "A 16-beat Hindustani cycle divided into four groups of four. The teaching track marks the main group starts and the lighter third group.", "Tabla, sitar, and tanpura", 128, "16-beat tala", 16, "DtttDtttttttDttt"],
  ["kendang-study", "Gong Cycle Study", "Indonesia · Java", "An introductory cycle sketch with a long low sound at the start and higher subdivisions between major beats.", "Metallophones, gong, and kendang", 80, "8-pulse study", 8, "D.t.t.t."],
  ["son-clave", "3–2 Son Clave", "Cuba · Caribbean", "Five accents across two bars. The three-side lands on beat one, the and of two, and four. The two-side lands on two and three.", "Claves, bongó, tres, and bass", 96, "4/4 × 2", 8, "t..t..t...t.t..."],
  ["samba-pulse", "Samba Pulse Study", "Brazil", "A simplified bass-and-jingle sketch for hearing the contrast between the two beats and the subdivisions between them.", "Surdo, pandeiro, and cavaquinho", 105, "2/4", 2, "d.t.Dt.t"],
  ["one-drop", "Reggae One-Drop Study", "Jamaica", "A classroom sketch where the strongest drum accent lands on beat three and bright sounds answer on the offbeats.", "Bass guitar, guitar, and organ", 76, "4/4", 4, ".t.tDt.t"],
  ["triple", "Waltz Pulse", "Austria · Europe", "Three beats per bar with a heavier first beat followed by two lighter beats.", "Cello and violins", 120, "3/4", 3, "Dtt"],
  ["house-pulse", "Four on the Floor", "United States · Global", "A kick on each quarter-note beat, with a lighter offbeat sound between kicks.", "Piano, synth bass, and closed hi-hats", 124, "4/4", 4, "DtDtDtDt"],
  ["half-time", "Half-Time Hip-Hop", "United States", "A four-beat loop with the main backbeat on three, creating a slower-feeling groove over faster subdivisions.", "808 bass, hand percussion, and R&B keys", 92, "4/4", 4, "D.ttT.t."],
] as const).map(([id, name, region, description, combine, bpm, meter, beats, pulse]) => ({
  id, name, region, description, combine, kind: "Rhythm", rhythm: { bpm, meter, beats, pulse },
}));

const terms: CatalogEntry[] = [
  ["duet", "Duet", "Vocal", "Two leads share the song. Give each a verse and bring both together on the hook."],
  ["call-response", "Call and Response", "Vocal", "One performer sings or plays a phrase and another answers. Leave enough space for the answer to be clear."],
  ["harmony", "Stacked Harmonies", "Vocal", "Several pitched parts support the same melody. Start with a single harmony and add another in the finale."],
  ["whisper", "Whispered Ad-libs", "Vocal", "Short breathy phrases sit around the lead. Leave the center clear so the words remain understandable."],
  ["choir", "Choir Layers", "Vocal", "A group sound made from several parts or takes. Introduce it in the final chorus to widen the arrangement."],
  ["spoken", "Spoken Word", "Vocal", "Words are delivered in natural speech or a measured rhythm. Leave space between phrases and keep instruments soft beneath them."],
  ["bpm", "BPM and Tempo", "Technique", "Beats per minute measures the speed of the pulse. A track at 120 BPM has two beats each second."],
  ["meter", "Time Signature", "Technique", "A notation for how the beats group. In 4/4 you commonly count four quarter-note beats per bar."],
  ["key", "Musical Key", "Technique", "A home pitch and the group of notes that tend to support it. Choose a range that suits the singer."],
  ["structure", "Verse, Chorus, Bridge and Finale", "Technique", "Verses develop the story, the chorus repeats the hook, a bridge adds contrast, and the finale resolves the song."],
  ["sidechain", "Sidechain Compression", "Technique", "One sound controls the level of another. A kick can briefly lower bass or pads to make room for its attack."],
  ["slapback", "Slapback Echo", "Technique", "A short single echo thickens a voice or instrument while keeping the original sound clear."],
  ["space", "Reverb", "Technique", "A short or long room-like tail gives a sound a sense of space. Keep lead vocals clear by using it sparingly."],
  ["automation", "Automation", "Technique", "Record changes over time, such as turning a filter brighter during the build or lowering a vocal delay in the verse."],
  ["euphoric", "Euphoric", "Mood", "An expansive sense of release. Try a gradual build into a bright chorus with wider harmony."],
  ["tender", "Tender", "Mood", "An intimate and gentle feeling. Try a close vocal, light drums, and restrained harmonies."],
  ["reflective", "Reflective", "Mood", "Space for thought. Try slower chord changes, longer pauses, and a recurring motif."],
  ["celebratory", "Celebratory", "Mood", "A shared feeling of joy. Try a strong pulse, a short refrain, and a group response."],
].map(([id, name, kind, description]) => ({ id, name, kind: kind as CatalogEntry["kind"], description, region: "Global" }));

// Preserve every curated ID/description used by saved collections. Fill registry gaps without inventing cultural or tempo metadata.
const curatedGenreKeys = new Set(genres.map(g => genreSearchKey(g.name)));
const registryGenres: CatalogEntry[] = genreFamilies.flatMap(family => family.genres.filter(name => !curatedGenreKeys.has(genreSearchKey(name))).map(name => ({
  id: "genre-" + genreSearchKey(name), name, kind: "Genre" as const, family: family.name, region: "Origin not specified in this reference",
  description: `${name} is a style option in the ${family.name} family. This registry entry does not prescribe a tempo, instrument set or cultural origin. Specify those details in your creative direction.`,
})));
export const musicCatalog = [...genres, ...instruments, ...rhythms, ...terms, ...registryGenres];
export const promptTemplates = [
  { name: "Beirut to the Main Stage", text: "Arabian Euro House × Lebanese Dabke at 130 BPM. Oud answers a bright piano motif. Darbuka and mijwiz lift the finale. Deep male and soaring female voices trade short lines about love and connection. End with the hook sung together." },
  { name: "Two Voices, One Sky", text: "Uplifting R&B duet at 94 BPM. Electric piano, round bass, and soft syncopated drums. Alternate intimate verses, meet in a harmonized chorus, and open the bridge with a quiet spoken line about gratitude." },
  { name: "First Light", text: "Spiritual ambient instrumental at 68 BPM. Breath-like ney over a soft synth pad, with gentle frame drum and a gradual sunrise-like lift. Leave space between phrases." },
  { name: "Carry the Joy", text: "Clean hip-hop and Afrobeats fusion at 104 BPM. Interlocking guitar, light percussion, and a buoyant bass line. Confident rap verses about resilience and a joyful sung response on the hook." },
];
