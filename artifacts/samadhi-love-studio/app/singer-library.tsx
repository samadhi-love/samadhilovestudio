"use client";
/**
 * The singer library: ready-made AI singers described as vocal traditions and
 * tones (not real people, no imitation of any artist). "Auto" picks the singer
 * that fits the genre: R&B and soul get a lead in the Black American gospel and
 * soul tradition, hip hop gets a Black American MC, both female or male.
 * Anything the person writes (e.g. "male voice") or picks always wins.
 */
export type SingerArrangement = "Solo female lead" | "Solo male lead" | "Duet" | "Choir / group vocals";
export type Singer = { id: string; name: string; line: string; arrangement: SingerArrangement; direction: string; fits: RegExp };

export const singers: readonly Singer[] = [
  { id: "rnb-female", name: "Soulful R&B · female", line: "Warm, rich alto · smooth runs · gospel and soul roots", arrangement: "Solo female lead", fits: /r&b|rnb|neo.?soul|\bsoul|quiet storm|motown/,
    direction: "Singer: a soulful Black American female R&B lead in the gospel and soul tradition; warm, rich alto with smooth runs and tasteful melisma, intimate verses and a soaring, powerful chorus." },
  { id: "rnb-male", name: "Smooth R&B · male", line: "Silky tenor · falsetto lifts · intimate and warm", arrangement: "Solo male lead", fits: /r&b|rnb|neo.?soul|\bsoul|quiet storm|new jack/,
    direction: "Singer: a smooth Black American male R&B lead in the soul and gospel tradition; silky tenor with falsetto lifts, tasteful runs and a warm, intimate delivery." },
  { id: "hiphop-male", name: "Hip-hop MC · male", line: "Confident flow · punchy and clear · tight on the beat", arrangement: "Solo male lead", fits: /hip.?hop|\brap\b|trap|drill|boom bap|grime/,
    direction: "Rapper: a confident Black American male hip-hop MC; clear rhythmic flow, punchy articulation, conversational swagger and a tight pocket on the beat, with a catchy melodic hook." },
  { id: "hiphop-female", name: "Hip-hop MC · female", line: "Sharp flow · bold and charismatic · melodic hook", arrangement: "Solo female lead", fits: /hip.?hop|\brap\b|trap|drill|boom bap/,
    direction: "Rapper: a bold Black American female hip-hop MC; sharp rhythmic flow, crisp articulation, charismatic delivery and a melodic sung hook." },
  { id: "gospel", name: "Gospel lead + choir", line: "Powerful lead · choir answers · uplifting", arrangement: "Choir / group vocals", fits: /gospel|worship|praise|church/,
    direction: "Singer: a powerful Black gospel lead with choir call-and-response, rich harmonies, joyful dynamics and soaring final choruses." },
  { id: "afrobeats", name: "Afrobeats · female", line: "Bright, warm · rhythmic melodies · West African flavor", arrangement: "Solo female lead", fits: /afrobeats?|amapiano|afro.?pop|highlife/,
    direction: "Singer: a bright, warm West African Afrobeats lead with rhythmic melodic phrasing and a light Nigerian English lilt." },
  { id: "pop-female", name: "Pop star · female", line: "Bright and clear · catchy · modern polish", arrangement: "Solo female lead", fits: /\bpop\b|dance pop|electropop/,
    direction: "Singer: a bright, clear modern female pop lead with confident, catchy phrasing and polished harmonies." },
  { id: "pop-male", name: "Pop-rock · male", line: "Clear and powerful · anthem chorus", arrangement: "Solo male lead", fits: /rock|pop.?rock|anthem|indie/,
    direction: "Singer: a clear, powerful male pop-rock lead with controlled grit and an anthemic chorus." },
  { id: "latin", name: "Latin pop · male", line: "Warm and passionate · Spanish phrasing", arrangement: "Solo male lead", fits: /latin|reggaeton|bachata|salsa|bossa|spanish/,
    direction: "Singer: a warm, passionate Latin pop male lead with natural Spanish phrasing and rhythmic flair." },
  { id: "tarab", name: "Arabic tarab · male", line: "Expressive · ornamented · heartfelt", arrangement: "Solo male lead", fits: /tarab|arabic|lebanese|dabke|khaleeji|maqam/,
    direction: "Singer: an expressive Arabic male tarab singer with tasteful ornamentation, emotional phrasing and clear words." },
  { id: "spiritual", name: "Spiritual · calm voice", line: "Gentle and resonant · healing and calm", arrangement: "Solo female lead", fits: /spiritual|devotional|mantra|meditat|healing|ambient/,
    direction: "Singer: a gentle, resonant devotional voice with calm sustained phrasing and a peaceful, healing tone." },
  { id: "country", name: "Country storyteller · male", line: "Honest and warm · storytelling", arrangement: "Solo male lead", fits: /country|americana|folk|bluegrass/,
    direction: "Singer: an honest, warm male country storyteller with natural twang and clear, heartfelt words." },
];

/** "Auto": the singer that fits the genre and description, or none (Studio decides). */
export function autoSinger(idea: string, genres: string): Singer | undefined {
  const text = `${idea} ${genres}`.toLowerCase();
  if (/\bduet\b|\bchoir\b|group vocals|call.and.response/.test(text)) return undefined; // the description already says who sings
  const fitting = singers.filter(singer => singer.fits.test(text));
  if (!fitting.length) return undefined;
  // "male" never matches inside "female" (word boundaries).
  const female = /\b(female|woman|women|girl)\b/.test(text), male = /\b(male|man|men|guy)\b/.test(text);
  return (female && !male ? fitting.find(s => s.arrangement === "Solo female lead") : male && !female ? fitting.find(s => s.arrangement === "Solo male lead") : undefined) ?? fitting[0];
}
export function singerById(id: string) { return singers.find(singer => singer.id === id); }

export function SingerChoice({ value, change, auto, disabled }: { value: string; change: (id: string) => void; auto?: Singer; disabled?: boolean }) {
  return (
    <fieldset className="singer-choice" data-testid="singer-choice" disabled={disabled}>
      <legend>AI singer</legend>
      <div className="singer-options" role="radiogroup" aria-label="Choose the AI singer">
        <button type="button" role="radio" aria-checked={value === "auto"} onClick={() => change("auto")} data-testid="singer-auto">
          <strong>✦ Auto</strong><span>{auto ? `Fits your song: ${auto.name}` : "Studio picks the best fit"}</span>
        </button>
        {singers.map(singer => (
          <button type="button" role="radio" key={singer.id} aria-checked={value === singer.id} onClick={() => change(singer.id)} data-testid={`singer-${singer.id}`}>
            <strong>{singer.name}</strong><span>{singer.line}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
