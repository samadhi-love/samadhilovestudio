export const feelingIdeas=[{name:'Send some love',text:'A warm, uplifting song about sending love across the world, acoustic guitar and gentle oud, a memorable singable chorus.'},{name:'Dance into the light',text:'Joyful world dance with electronic pulses, darbuka and bright synths, a hopeful chorus about finding our light.'},{name:'Find my calm',text:'A peaceful sung song about finding calm after a difficult day, with soft piano, warm vocals and a gentle chorus.'}] as const;
export const playEnergies={gentle:'Gentle arrangement, breathing room and restrained percussion.',balanced:'A clear memorable hook with a natural rise in energy.',bold:'A confident rhythmic pulse and an uplifting energetic chorus.'};
export const playMoods={warm:'Warm, intimate and welcoming.',dreamy:'Dreamy, spacious and luminous.',hopeful:'Hopeful and emotionally uplifting.'};
export const playLooks={cosmic:{name:'Cosmic',preset:'cosmic-hook'},sacred:{name:'Sacred',preset:'sacred-gold'},cinematic:{name:'Cinematic',preset:'mountain-verse'}};
export type PlayChoices={energy:keyof typeof playEnergies;mood:keyof typeof playMoods;look:keyof typeof playLooks};
export const defaultPlayChoices:PlayChoices={energy:'balanced',mood:'hopeful',look:'cosmic'};
export function validPlayChoices(value:unknown):value is PlayChoices{const v=value as PlayChoices;return !!v&&Object.hasOwn(playEnergies,v.energy)&&Object.hasOwn(playMoods,v.mood)&&Object.hasOwn(playLooks,v.look);}
export function playDirection(value:PlayChoices){return `${playEnergies[value.energy]} ${playMoods[value.mood]} Preserve the supplied lyrics and use an original melody.`;}
/** purpose: what the video is for (YouTube, Shorts, Phone, Square), from the Make your video box. */
export type PlayVisualRequest={look?:string;photo?:File;video?:File;purpose?:import("./video-purpose").VideoPurposeId};
