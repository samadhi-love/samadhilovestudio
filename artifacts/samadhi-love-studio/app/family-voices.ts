/**
 * Songs for kids are welcome; child or child-like singing voices are not made.
 * Music services restrict child-like voices to protect children, so any song
 * for kids is sung by warm, friendly adult voices instead.
 */
const forKids = /\b(?:kids?|children'?s?|childrens|nursery|lullab(?:y|ies)|toddlers?|preschool(?:ers)?|kindergarten|sing[- ]?alongs?)\b/i;
const childVoice = /\b(?:(?:young|little)\s+)?(?:child|children|kid|kids|toddler|girl|boy)(?:'s|s'|s)?\s+(?:voices?|vocals?|singers?|choir|chorus)\b|\b(?:boy\s+soprano|child-?like\s+(?:voices?|vocals?|singing)|childlike\s+(?:voices?|vocals?|singing))\b/gi;
export const familyVoiceDirection = "Sung by warm, friendly adult voices (no child or child-like vocals)";
export const familyLeaveOut = "child or child-like vocals";

export type FamilyFields = { prompt?: string; voice?: string; genres?: string; description?: string; negativeStyle?: string };
export function isFamilySong(fields: FamilyFields) {
  const all = [fields.prompt, fields.voice, fields.genres, fields.description].filter(Boolean).join(" ");
  childVoice.lastIndex = 0;
  return forKids.test(all) || childVoice.test(all);
}
const adult = (text: string) => text.replace(childVoice, "friendly adult voices");
/** Returns the same request with kids' songs steered to adult voices. Other songs are unchanged. */
export function familySafe<T extends FamilyFields>(fields: T): T {
  if (!isFamilySong(fields)) return fields;
  const voice = adult(fields.voice?.trim() ?? "");
  const leaveOut = fields.negativeStyle?.trim() ?? "";
  return {
    ...fields,
    ...(fields.prompt !== undefined ? { prompt: adult(fields.prompt) } : {}),
    ...(fields.description !== undefined ? { description: adult(fields.description) } : {}),
    ...(fields.genres !== undefined ? { genres: adult(fields.genres) } : {}),
    voice: voice ? `${voice}; ${familyVoiceDirection}` : familyVoiceDirection,
    negativeStyle: leaveOut.toLowerCase().includes(familyLeaveOut) ? leaveOut : (leaveOut ? `${leaveOut}, ${familyLeaveOut}` : familyLeaveOut).slice(0, 500),
  };
}
