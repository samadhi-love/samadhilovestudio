/** Musical direction for the authorized generator, not a catalog of cloned singers. */
export function matchVocalToSong(idea:string,genres:string,instruments:string){const text=`${idea} ${genres} ${instruments}`.toLowerCase();let style='Clear, expressive melodic lead with a memorable hook and natural phrasing.';
 if(/r&b|soul/.test(text)&&/hip.?hop|\brap\b|trap/.test(text))style='Rhythmically precise rap verses with a warm, soulful sung hook; keep the requested male, female or duet roles distinct.';
 else if(/reggae|reggaeton|dancehall/.test(text))style='Warm, relaxed rhythmic singing with clear words and syncopated phrasing that fits the requested reggae or dancehall groove.';
 else if(/afrobeats|amapiano/.test(text))style='Warm, bright melodic singing with rhythmic phrasing that complements the selected African dance groove.';
 else if(/r&b|neo.?soul|soulful/.test(text))style='Warm, soulful singing with expressive dynamics, restrained runs and clear phrasing.';
 else if(/hip.?hop|\brap\b|trap|drill|grime/.test(text))style='Rhythmically precise delivery, clear articulation and a distinct melodic hook where requested.';
 else if(/tarab|arabic|lebanese|dabke|khaleeji|turkish|oud|qanun/.test(text))style='Expressive melodic singing with tasteful ornamentation, clear words and phrasing suited to the selected world-music blend.';
 else if(/house|trance|dance|edm|techno/.test(text))style='Bright, confident melodic singing that lifts the chorus and stays clear over the dance groove.';
 else if(/acoustic|folk|country|guitar/.test(text))style='Natural, intimate singing with gentle dynamics and minimal vocal processing.';
 else if(/spiritual|devotional|mantra|ambient/.test(text))style='Gentle, resonant singing with clear sustained words, calm phrasing and restrained reverb.';
 else if(/rock|metal|punk/.test(text))style='Forward, powerful singing with controlled edge and intelligible words; harsh delivery only if requested.';
 else if(/jazz|classical|orchestral/.test(text))style='Smooth, expressive singing with dynamic shading and natural breath-led phrasing.';
 return `${style} Respect explicit performer, range, language and dialect requests in the prompt and approved lyrics. Do not add speech, ad-libs or a duet unless requested.`;
}
