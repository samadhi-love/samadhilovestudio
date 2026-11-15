/** Browsing labels and prompt directions, not a claim of provider-specific models. */
export const genreFamilies = [
  { name: "Arabian & Middle Eastern", genres: ["Arabian Euro House", "Lebanese Dabke", "Arabic Pop", "Lebanese Pop", "Egyptian Pop", "Khaleeji", "Arabic Classical", "Tarab", "Maqam-inspired", "Shaabi", "Mahraganat", "Baladi", "Iraqi Chobi", "Khaliji House", "Arabic Trap", "Arabic R&B", "Oriental Deep House", "Turkish Pop", "Anatolian Rock", "Turkish Folk", "Persian Pop", "Persian Classical", "Kurdish Folk"] },
  { name: "House & Electronic Dance", genres: ["House", "Deep House", "Melodic House", "Progressive House", "Afro House", "Organic House", "Tech House", "Soulful House", "Piano House", "Euro House", "French House", "Future House", "Tropical House", "Electro House", "Disco House", "EDM", "Dance Pop", "Eurodance", "Electro Swing"] },
  { name: "Trance, Techno & Bass", genres: ["Trance", "Uplifting Trance", "Progressive Trance", "Psytrance", "Vocal Trance", "Techno", "Melodic Techno", "Minimal Techno", "Dub Techno", "Hard Techno", "Hardstyle", "Drum & Bass", "Liquid Drum & Bass", "Jungle", "Dubstep", "Future Bass", "UK Garage", "Breakbeat", "UK Bass", "Phonk"] },
  { name: "Pop", genres: ["Pop", "Synth Pop", "Electropop", "Indie Pop", "Dream Pop", "Art Pop", "Bedroom Pop", "Hyperpop", "Chamber Pop", "Pop Rock", "Acoustic Pop", "Teen Pop", "K-Pop", "J-Pop", "C-Pop", "City Pop", "Russian Pop", "Turkish Dance Pop"] },
  { name: "R&B, Soul & Funk", genres: ["R&B", "Contemporary R&B", "Alternative R&B", "Neo Soul", "Soul", "Motown", "Funk", "Disco", "Nu Disco", "Quiet Storm", "New Jack Swing", "Gospel Soul"] },
  { name: "Hip-hop & Rap", genres: ["Hip-hop", "Rap", "Boom Bap", "Trap", "Drill", "UK Drill", "Jazz Rap", "Conscious Hip-hop", "Alternative Hip-hop", "Lo-fi Hip-hop", "Cloud Rap", "G-Funk", "Grime", "Old School Hip-hop", "Melodic Rap"] },
  { name: "Rock & Alternative", genres: ["Rock", "Classic Rock", "Alternative Rock", "Indie Rock", "Hard Rock", "Progressive Rock", "Psychedelic Rock", "Post Rock", "Shoegaze", "Grunge", "Garage Rock", "Surf Rock", "Glam Rock", "Southern Rock", "Math Rock", "New Wave"] },
  { name: "Metal & Punk", genres: ["Heavy Metal", "Symphonic Metal", "Power Metal", "Progressive Metal", "Thrash Metal", "Doom Metal", "Folk Metal", "Metalcore", "Nu Metal", "Punk Rock", "Pop Punk", "Post Punk", "Hardcore Punk", "Emo", "Ska Punk"] },
  { name: "Jazz & Blues", genres: ["Jazz", "Smooth Jazz", "Jazz Fusion", "Bebop", "Swing", "Big Band", "Cool Jazz", "Latin Jazz", "Gypsy Jazz", "Vocal Jazz", "Blues", "Delta Blues", "Chicago Blues", "Blues Rock", "Rhythm & Blues", "Soul Jazz"] },
  { name: "Folk, Acoustic & Country", genres: ["Acoustic", "Singer-Songwriter", "Folk", "Indie Folk", "Contemporary Folk", "Celtic Folk", "Americana", "Country", "Country Pop", "Country Rock", "Bluegrass", "Outlaw Country", "Western Swing", "Appalachian Folk"] },
  { name: "Latin & Caribbean", genres: ["Latin Pop", "Reggaeton", "Latin Trap", "Salsa", "Bachata", "Merengue", "Cumbia", "Vallenato", "Bolero", "Bossa Nova", "Samba", "Forró", "Sertanejo", "Tango", "Flamenco", "Mariachi", "Ranchera", "Corridos", "Reggae", "Dub", "Dancehall", "Soca", "Calypso", "Zouk", "Kompa"] },
  { name: "African Styles", genres: ["Afrobeats", "Afrobeat", "Amapiano", "Gqom", "Highlife", "Juju", "Soukous", "Makossa", "Mbalax", "Bongo Flava", "Kizomba", "Kuduro", "Ethiopian Jazz", "Gnawa", "Raï", "Chaabi", "Maloya"] },
  { name: "South & East Asian", genres: ["Bollywood", "Indian Classical", "Hindustani Classical", "Carnatic", "Bhangra", "Punjabi Pop", "Qawwali", "Ghazal", "Desi Hip-hop", "Indian Fusion", "Dangdut", "Gamelan-inspired", "Thai Pop", "V-Pop", "OPM", "Trot", "Enka", "Chinese Traditional", "Japanese Traditional"] },
  { name: "European & Global Folk", genres: ["Balkan Folk", "Balkan Brass", "Greek Folk", "Rebetiko", "Fado", "Chanson", "Flamenco Fusion", "Russian Folk", "Slavic Folk", "Nordic Folk", "Klezmer", "Polka", "Tarantella", "Georgian Polyphony", "Mongolian Folk", "Andean Folk", "Polynesian-inspired", "World Fusion"] },
  { name: "Classical & Cinematic", genres: ["Classical", "Baroque", "Romantic Classical", "Contemporary Classical", "Orchestral", "Chamber Music", "Solo Piano", "String Quartet", "Opera", "Choral", "Cinematic", "Film Score", "Epic Orchestral", "Trailer Music", "Musical Theatre", "Video Game Soundtrack", "Neoclassical"] },
  { name: "Spiritual & Uplifting", genres: ["Spiritual Dance", "Devotional", "Mantra", "Kirtan", "Bhajan", "Nasheed", "Sufi-inspired", "Gospel", "Contemporary Worship", "Spiritual Ambient", "Meditation", "New Age", "Sacred Choral", "Ecstatic Dance", "Conscious Dance"] },
  { name: "Ambient & Experimental", genres: ["Ambient", "Downtempo", "Chillout", "Trip-hop", "Lo-fi", "Chillhop", "Lounge", "Balearic", "Synthwave", "Retrowave", "Vaporwave", "IDM", "Glitch", "Industrial", "Experimental", "Drone", "Dark Ambient", "Minimalism", "Soundscape"] },
] as const;

export const featuredGenres = ["Arabian Euro House", "Lebanese Dabke", "R&B", "Hip-hop", "Trance", "Spiritual Dance"];
export const popularGenres = [...featuredGenres, "Pop", "Melodic House", "Afrobeats", "Rock", "Country", "Jazz", "Latin Pop", "Reggaeton", "Acoustic", "K-Pop", "Bollywood", "Cinematic", "Ambient", "Gospel"];
export const allGenres: string[] = genreFamilies.flatMap(f => [...f.genres]);
export const genreSearchKey = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
export function sameGenre(a: string, b: string) {
  const left = genreSearchKey(a), right = genreSearchKey(b);
  return left && right ? left === right : a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}
export function uniqueGenreNames(values: readonly string[]) {
  const seen = new Set<string>();
  return values.map(v => v.trim()).filter(v => { const key = genreSearchKey(v) || v.toLocaleLowerCase(); if (!v || seen.has(key)) return false; seen.add(key); return true; });
}
export function genreTags(value: string) { return uniqueGenreNames(value.split(",")); }
export function genreDirection(genres: string[]) { return genres.length ? `Musical styles: ${genres.join(", ")}. Blend these styles into a coherent arrangement.` : ""; }

/** Keep long free-form production notes when short style chips are edited. */
export function replaceGenreTags(text: string, next: string[]) {
  return [...genreTags(text).filter(s => s.length > 60), ...next].join(", ");
}
