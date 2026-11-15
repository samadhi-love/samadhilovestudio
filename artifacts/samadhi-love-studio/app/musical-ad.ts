export const adStyles = {
  jingle: { name: "Catchy pop jingle", genre: "Pop", direction: "A concise, melodic sung hook with a memorable brand-name ending" },
  rap: { name: "Rap & R&B spot", genre: "Hip-hop, R&B", direction: "Clear rhythmic rap verses and a warm sung brand hook" },
  world: { name: "World fusion campaign", genre: "Arabic Pop, Melodic House", direction: "A coherent multicultural groove with oud, hand percussion and a clear sung hook" },
  acoustic: { name: "Warm acoustic story", genre: "Acoustic, Soul", direction: "Intimate vocals, acoustic guitar and a warm, welcoming melody" },
  dance: { name: "Energetic social ad", genre: "Dance Pop", direction: "An immediate musical hook, upbeat groove and crisp, short vocal phrases" },
  cinematic: { name: "Cinematic brand film", genre: "Cinematic, Electronic", direction: "A restrained cinematic build with clear, spacious sung phrases" },
} as const;
export type MusicalAd = { brand: string; benefit: string; audience: string; cta: string; seconds: 15 | 30 | 60; style: keyof typeof adStyles };
export const emptyMusicalAd: MusicalAd = { brand: "", benefit: "", audience: "", cta: "", seconds: 30, style: "jingle" };
/** Recovery accepts unfinished writing; provider submission still requires isMusicalAd. */
export function recoverMusicalAd(value: unknown):MusicalAd {
 const v=value&&typeof value==="object"?value as Record<string,unknown>:{};
 const text=(key:string,max:number)=>typeof v[key]==="string"?(v[key] as string).slice(0,max):"";
 return{brand:text("brand",70),benefit:text("benefit",140),audience:text("audience",80),cta:text("cta",100),seconds:[15,30,60].includes(v.seconds as number)?v.seconds as MusicalAd["seconds"]:30,style:typeof v.style==="string"&&Object.hasOwn(adStyles,v.style)?v.style as MusicalAd["style"]:"jingle"};
}
export function isMusicalAd(value: unknown): value is MusicalAd {
  const a = value as MusicalAd;
  return !!a && typeof a === "object" && typeof a.brand === "string" && !!a.brand.trim() && a.brand.length <= 70 && typeof a.benefit === "string" && !!a.benefit.trim() && a.benefit.length <= 140 && typeof a.audience === "string" && a.audience.length <= 80 && typeof a.cta === "string" && !!a.cta.trim() && a.cta.length <= 100 && [15,30,60].includes(a.seconds) && Object.hasOwn(adStyles,a.style);
}
export function musicalAdPrompt(ad: MusicalAd) {
  if (!isMusicalAd(ad)) throw new Error("Add a product name, one benefit and a call to action.");
  return `Create an original ${ad.seconds}-second musical advertisement for ${ad.brand.trim()}.\nProduct benefit supplied by the creator: ${ad.benefit.trim()}.\n${ad.audience.trim()?"Audience: "+ad.audience.trim()+".\n":""}Call to action: ${ad.cta.trim()}.\n${adStyles[ad.style].direction}. Start music immediately; use concise phrasing and leave space for the final call to action. Use only the supplied product facts; do not invent endorsements, prices, medical claims or guarantees. Follow the requested language and dialect. This is original music, not an imitation of an existing advertising jingle.`;
}
export function musicalAdSections(ad: MusicalAd) {
  return ad.seconds === 15 ? "[Hook]\n{Immediate brand hook; no silent intro}\n[Brand ending]\n{Clear call to action and resolved musical ending}" : "[Opening hook]\n{Immediate memorable melody}\n[Product story]\n{One clear benefit, concise phrasing}\n[Brand ending]\n{Brand name and call to action; resolved musical ending}";
}
