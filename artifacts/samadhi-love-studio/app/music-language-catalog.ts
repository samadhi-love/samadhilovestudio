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
} as const;
