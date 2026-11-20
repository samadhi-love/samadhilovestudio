/** Shared singing-language names for the dropdown, prompt matcher and validation. */
export const musicLanguages = {
  en: "English", ar: "Arabic", es: "Spanish", fr: "French", hi: "Hindi",
  ja: "Japanese", de: "German", it: "Italian", pt: "Portuguese", tr: "Turkish",
  ru: "Russian", ko: "Korean", zh: "Chinese", uk: "Ukrainian", pl: "Polish",
  nl: "Dutch", id: "Indonesian", sw: "Swahili", he: "Hebrew",
  fa: "Persian / Farsi", ur: "Urdu", bn: "Bengali", pa: "Punjabi",
  ta: "Tamil", te: "Telugu", vi: "Vietnamese", th: "Thai", el: "Greek",
  ro: "Romanian", sv: "Swedish", fi: "Finnish", no: "Norwegian",
  da: "Danish", cs: "Czech", hu: "Hungarian", tl: "Filipino / Tagalog",
  yo: "Yoruba", tw: "Akan", pcm: "Pidgin", jam: "Jamaican Patwa", jv: "Javanese",
  mixed: "Mixed languages", other: "Other / not listed",
} as const;
export type MusicLanguage = keyof typeof musicLanguages;
export const musicDialects = {
  "ar-LB": "Lebanese Arabic · لبناني",
  "ar-EG": "Egyptian Arabic",
  "ar-x-gulf": "Khaleeji / Gulf Arabic",
  "ar-SY": "Syrian Arabic", "ar-IQ": "Iraqi Arabic",
  "ar-MA": "Moroccan Arabic / Darija", "ar-PS": "Palestinian Arabic",
  "en-US-south": "Southern US English", "en-US-urban": "Urban American English",
  "en-GB": "British English", "en-x-jamaica": "Jamaican English", "en-NG": "Nigerian English",
  "en-IN": "Indian English", "es-MX": "Mexican Spanish", "es-x-caribbean": "Caribbean Spanish",
  "pt-BR": "Brazilian Portuguese",
} as const;
/** The language each dialect or accent belongs to. */
export const dialectLanguage: Record<keyof typeof musicDialects, "ar" | "en" | "es" | "pt"> = {
  "ar-LB": "ar", "ar-EG": "ar", "ar-x-gulf": "ar", "ar-SY": "ar", "ar-IQ": "ar", "ar-MA": "ar", "ar-PS": "ar",
  "en-US-south": "en", "en-US-urban": "en", "en-GB": "en", "en-x-jamaica": "en", "en-NG": "en", "en-IN": "en",
  "es-MX": "es", "es-x-caribbean": "es", "pt-BR": "pt",
};
/** How each accent sounds when sung (respectful, no caricature). Arabic dialects have their own directions. */
export const accentSound: Partial<Record<keyof typeof musicDialects, string>> = {
  "en-US-south": "relaxed Southern US vowels and warm drawn-out phrasing",
  "en-US-urban": "Black American urban English phrasing and rhythm, natural everyday delivery",
  "en-GB": "British English pronunciation, crisp consonants",
  "en-x-jamaica": "Jamaican English accent with island lilt",
  "en-NG": "Nigerian English accent with bright West African rhythm",
  "en-IN": "Indian English accent with clear melodic diction",
  "es-MX": "Mexican Spanish pronunciation and phrasing",
  "es-x-caribbean": "Caribbean Spanish (Puerto Rico, Cuba, Dominican Republic) pronunciation, relaxed consonants",
  "pt-BR": "Brazilian Portuguese pronunciation, soft open vowels",
};
/** The dialects you can pick for a language ("mixed" can use any). */
export function dialectsFor(language: string) {
  return (Object.keys(musicDialects) as (keyof typeof musicDialects)[]).filter(id => language === "mixed" || dialectLanguage[id] === language);
}
