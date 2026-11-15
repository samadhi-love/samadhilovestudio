import { allGenres } from "./music-genres";
import { lyricStyleCues } from "./lyric-style-cues";
import type { Song } from "./studio-data";

const normalize = (s: string) => s.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");
const aliases: Record<string,string[]> = { "Lebanese Dabke":["dabke","dabkeh"], "Hip-hop":["hiphop"], "R&B":["rnb","r and b"], "Drum & Bass":["dnb","drum and bass"], "Lo-fi":["lofi"], "K-Pop":["kpop"], "Afrobeats":["afro beats"] };
const patterns = allGenres.flatMap(genre => [genre,...(aliases[genre]??[])].map(label => ({genre,phrase:normalize(label)}))).sort((a,b)=>b.phrase.length-a.phrase.length);
export function detectPromptGenres(text: string) {
  const normalized = ` ${normalize(text.slice(0,12000))} `, occupied: [number,number][] = [], matches: {genre:string;at:number}[] = [];
  for (const {genre,phrase} of patterns) {
    let at = normalized.indexOf(` ${phrase} `);
    while (at >= 0) {
      const end=at+phrase.length+1, prefix=normalized.slice(Math.max(0,at-32),at).trim();
      if (!/(?:\bno|\bnot|\bwithout|\bavoid|\bexclude)(?:\s+any)?$/.test(prefix) && !occupied.some(([a,b])=>at<b&&end>a)) { matches.push({genre,at});occupied.push([at,end]);break; }
      at=normalized.indexOf(` ${phrase} `,at+1);
    }
  }
  return [...new Set(matches.sort((a,b)=>a.at-b.at).map(m=>m.genre))].slice(0,8);
}
const fallbacks = [["Melodic House","R&B","Spiritual Dance"],["Organic House","World Fusion","Neo Soul"],["Cinematic","Downtempo","Acoustic"]];
const historyCache=new WeakMap<Song,{text:string;genres:string[]}>();
export type GenreFusion = { name: string; genres: string[]; source: string; historyCount: number; cues: ReturnType<typeof lyricStyleCues> };
export function suggestGenreFusion(idea: string, lyrics: string, history: Song[], includeHistory: boolean, variation = 0): GenreFusion {
  const cues=lyricStyleCues(lyrics), current=detectPromptGenres(idea), coded=detectPromptGenres(cues.cues.map(c=>c.genre).join(", "));
  const eligible=includeHistory ? history.filter(s=>!s.deletedAt&&!s.example&&!s.explicit).slice(0,30) : [];
  const counts=new Map<string,number>();
  for(const song of eligible){const text=[song.notes.prompt,...song.tags].join(", ");let remembered=historyCache.get(song);if(remembered?.text!==text){remembered={text,genres:detectPromptGenres(text)};historyCache.set(song,remembered);}for(const g of remembered.genres)counts.set(g,(counts.get(g)??0)+1);}
  const normalized=` ${normalize(idea)} `;
  const excluded=patterns.filter(p=>["no","not","without","avoid","exclude"].some(n=>normalized.includes(` ${n} ${p.phrase} `))).map(p=>p.phrase);
  const allowed=(g:string)=>!excluded.some(phrase=>(` ${normalize(g)} `).includes(` ${phrase} `));
  const learned=[...counts].sort((a,b)=>b[1]-a[1]).map(([genre])=>genre).filter(allowed);
  const explicit=[...new Set([...current,...coded])].filter(allowed);
  const rotate=(items:string[])=>items.length?[...items.slice(variation%items.length),...items.slice(0,variation%items.length)]:[];
  const pool=explicit.length?rotate(explicit):rotate(learned);
  let genres=pool.slice(0,3);
  const additions=[...rotate(learned),...fallbacks[variation%fallbacks.length],"Jazz","Acoustic"].filter(allowed);
  for(const g of additions){if(genres.length>=3)break;if(!genres.includes(g))genres.push(g);}
  if(!genres.length)genres=["World Fusion"];
  return {name:(genres.join(" × ")+" Fusion").slice(0,60),genres,source:explicit.length?"Your current description and explicit lyric style cues":learned.length?"Recurring styles in your saved prompts":"Studio’s creative starting palette",historyCount:eligible.length,cues};
}
export function fusionGenres(fusion:GenreFusion,customName="") { return [(customName.trim()||fusion.name).slice(0,60),...fusion.genres]; }
