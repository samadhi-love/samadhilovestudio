import { songBlueprint } from "./song-blueprint";

export const productionChoices = ["Warm tape texture", "Slapback echo", "Short room reverb", "Sidechain compression", "Filter automation", "Dry, close-miked sound"];
export const moodChoices = ["Uplifting", "Tender", "Reflective", "Euphoric", "Devotional", "Celebratory", "Confident", "Peaceful"];
export const vocalChoices = ["Female lead", "Male lead", "Male and female duet", "Call and response", "Stacked harmonies", "Choir layers", "Whispered ad-libs", "Spoken word", "Rhythmic rap"];
export const languageChoices = ["English", "Arabic", "Turkish", "Hindi", "Spanish", "Portuguese", "French", "Japanese", "Mandarin", "Multilingual"];

export type DNA = {
  title: string; concept: string; genre: string; bpm: string; key: string; instruments: string;
  vocal: string; structure: string; emotion: string; production: string;
};

export function makeDNA(concept: string): DNA {
  const instrumental = /\binstrumental\b/i.test(concept);
  const blueprint = songBlueprint(concept, instrumental);
  const vocal = instrumental ? "Instrumental" : /\b(?:duet|call.and.response)\b/i.test(concept) ? "Male and female duet" :
    /\bfemale\b/i.test(concept) ? "Female lead" : /\bmale\b/i.test(concept) ? "Male lead" : "Solo lead with light harmonies";
  const title = /\b(?:gratitude|thankful)\b/i.test(concept) ? "Every Breath a Gift" :
    /\b(?:love|duet|human|life)\b/i.test(concept) ? "All That We Are" :
    /\b(?:dance|party|festival)\b/i.test(concept) ? "The Ground Sings Back" : "The Sound of First Light";
  const openingMood = moodChoices.find(mood => concept.toLowerCase().includes(mood.toLowerCase())) ?? "Uplifting";
  return {
    title, concept, genre: blueprint.genre, bpm: String(blueprint.bpm),
    key: blueprint.preset === "soul" ? "D minor" : blueprint.preset === "dabke" ? "A minor" : "C major",
    instruments: blueprint.instrumentList, vocal,
    structure: "Intro → Verse 1 → Chorus → Verse 2 → Bridge → Final chorus → Outro",
    emotion: `${openingMood} opening → growing anticipation → shared release → a calm close`,
    production: "Keep the first verse intimate. Add a contrasting texture in the bridge, then widen the final hook.",
  };
}

export function dnaArrangements(dna: DNA) {
  return [
    { title: "Intimate session", text: `Start with one lead sound from ${dna.instruments}. Keep percussion light, leave room between phrases, and finish with a stripped reprise.` },
    { title: "Wide finale", text: "Let the first chorus establish the motif. Strip the bridge to the pulse, then bring back the full arrangement and a wider final hook." },
    { title: "Rhythm-forward", text: "Open on the rhythmic pattern, introduce the melody as an answer, and give the percussion a short spotlight before the finale." },
  ];
}

export function dnaPrompt(dna: DNA) {
  return [
    dna.concept.trim(), `Genre: ${dna.genre}. ${dna.bpm} BPM in ${dna.key}.`, `Instruments: ${dna.instruments}.`,
    `Performance: ${dna.vocal}.`, `Structure: ${dna.structure}.`, `Emotional arc: ${dna.emotion}.`, dna.production,
    "Use original, uplifting, family-friendly material.",
  ].filter(Boolean).join("\n");
}
