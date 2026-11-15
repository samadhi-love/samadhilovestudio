import type { Song } from "./studio-data";

export const playlists = {
  spiritual: { title: "Spiritual Awakening", description: "Devotion, mantra and stillness.", match: /spiritual|devotion|mantra|meditat|prayer/i },
  awakening: { title: "Truth and Wisdom", description: "Songs about remembrance, truth and awakening.", match: /awaken|truth|remember|oneness|remembrance/i },
  international: { title: "International Mixes", description: "Rhythms and instruments from around the world.", match: /arabian|arabic|dabke|turkish|lebanese|international|egyptian|world|oud/i },
  dance: { title: "Dance and Celebration", description: "House, trance and grooves for movement.", match: /dance|house|dabke|trance|techno/i },
  frequency: { title: "Inspirational Frequencies", description: "Uplifting sounds, love and light.", match: /frequenc|inspir|uplift|love and light|euphor/i },
  love: { title: "Love and Light", description: "Connection, compassion and inner light.", match: /love|compassion|light|unity/i },
  meditation: { title: "Meditation and Mantras", description: "Calm instrumentals and meditative chants.", match: /meditat|mantra|chant|stillness/i },
  hiphop: { title: "Clean Hip-Hop and R&B", description: "Positive rap and soulful rhythm and blues.", match: /hip[- ]?hop|r&b|\b(?:rap|soul)\b/i },
};
export type PlaylistId = keyof typeof playlists;

export function suggestedForPlaylist(id: PlaylistId, songs: Song[]) {
  return songs.filter(song => playlists[id].match.test([song.name, song.summary, ...song.tags].join(" "))).map(song => song.id);
}
