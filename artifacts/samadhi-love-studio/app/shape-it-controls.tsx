"use client";
import { useId, useState } from "react";
import { detectPromptGenres } from "./genre-assist";
import { allGenres, genreSearchKey, genreTags, popularGenres, sameGenre } from "./music-genres";
import { creatorInstruments, defaultCreatorVocals, type CreatorVocalOptions } from "./creator-music-options";

/** Roughly how many picks are written into the engine prompt. Everything else stays saved. */
export const guidedPickLimit = 20;

/** Split stored picks into the subset that guides the engine. Never mutates or trims storage. */
export function splitPicks(genre: string, instruments: string) {
  const g = genreTags(genre), i = genreTags(instruments);
  const genres = g.slice(0, guidedPickLimit);
  const rest = Math.max(0, guidedPickLimit - genres.length);
  return { genres, instruments: i.slice(0, rest), total: g.length + i.length, guiding: genres.length + Math.min(i.length, rest) };
}

export const moodChoices = ["Hopeful", "Dreamy", "Joyful", "Tender", "Spiritual", "Cinematic", "Melancholic", "Energetic", "Calm", "Romantic", "Defiant", "Nostalgic", "Mysterious", "Euphoric", "Playful", "Bittersweet", "Grounded", "Triumphant"];
export const soundGroups: { name: string; target: "genre" | "instruments"; items: string[] }[] = [
  { name: "Genres", target: "genre", items: [...new Set([...popularGenres, ...allGenres])] },
  { name: "Moods", target: "genre", items: moodChoices },
  { name: "Strings", target: "instruments", items: [...creatorInstruments["Strings & guitars"], "Viola", "Double bass", "Mandolin", "Banjo", "Ukulele", "12-string guitar"] },
  { name: "Keys", target: "instruments", items: ["Piano", "Electric piano", "Organ", "Accordion", "Bells", "Marimba", "Rhodes", "Harpsichord", "Celesta", "Vibraphone"] },
  { name: "Percussion", target: "instruments", items: [...creatorInstruments["Rhythm & percussion"], "Tabla", "Darbuka", "Riq", "Timpani", "Taiko", "Tambourine"] },
  { name: "World", target: "instruments", items: [...creatorInstruments["Middle East & Mediterranean"], ...creatorInstruments["World colors"], "Duduk", "Shakuhachi", "Pan flute"] },
  { name: "Electronic", target: "instruments", items: ["Synth bass", "Synth pads", "808 bass", "Drum machine", "Arpeggiator", "Vocoder", "Sub bass", "Granular textures", "Modular synth", "Sidechain pump"] },
  { name: "Winds & brass", target: "instruments", items: [...creatorInstruments["Wind & brass"], "French horn", "Oboe", "Harmonica"] },
];

const visibleCount = 8;

export function SoundSoulPicker({ genre, instruments, changeGenre, changeInstruments, disabled, vision = "" }: {
  vision?: string; genre: string; instruments: string; changeGenre: (next: string | null) => void; changeInstruments: (next: string | null) => void; disabled?: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState(""), [more, setMore] = useState<Record<string, boolean>>({});
  const picks = { genre: genreTags(genre), instruments: genreTags(instruments) };
  const has = (target: "genre" | "instruments", name: string) => picks[target].some(p => sameGenre(p, name));
  function toggle(target: "genre" | "instruments", name: string) {
    const list = picks[target];
    const next = has(target, name) ? list.filter(p => !sameGenre(p, name)) : [...list, name];
    (target === "genre" ? changeGenre : changeInstruments)(next.length ? next.join(", ") : null);
  }
  const key = genreSearchKey(query);
  const { total, guiding } = splitPicks(genre, instruments);
  const detected = detectPromptGenres(vision).filter(name => !has("genre", name));
  return <div className="shape-sound" role="group" aria-labelledby={`${id}-h`}>
    <p id={`${id}-h`} className="sr-only">Sound and soul choices</p>
    <label className="field shape-search">Search sounds
      <input type="search" data-testid="input-search-sounds" value={query} maxLength={60} placeholder="Try oud, dreamy, amapiano, cello" disabled={disabled} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }} />
    </label>
    {soundGroups.map(group => {
      const matches = key ? group.items.filter(n => genreSearchKey(n).includes(key)) : group.items;
      if (!matches.length) return null;
      const open = !!key || more[group.name];
      const chosenHere = matches.filter(n => has(group.target, n));
      const shown = open ? matches : [...new Set([...matches.slice(0, visibleCount), ...chosenHere])];
      const slug = group.name.toLowerCase().replace(/[^a-z]+/g, "-");
      return <section className="shape-group" key={group.name} aria-label={group.name} data-testid={`group-${slug}`}>
        <h4>{group.name}</h4>
        <div className="shape-chips">
          {shown.map(name => <button type="button" key={name} className={`chip shape-chip${has(group.target, name) ? " active" : ""}`} aria-pressed={has(group.target, name)} disabled={disabled} data-testid={`chip-sound-${slug}-${genreSearchKey(name)}`} onClick={() => toggle(group.target, name)}>{name}</button>)}
          {!key && matches.length > visibleCount && <button type="button" className="text-button shape-more" aria-expanded={!!more[group.name]} data-testid={`button-see-more-${slug}`} onClick={() => setMore(m => ({ ...m, [group.name]: !m[group.name] }))}>{more[group.name] ? "See less" : `See more · ${matches.length - visibleCount}`}</button>}
        </div>
      </section>;
    })}
    <div className="actions">
      {detected.length > 0 && <button type="button" className="secondary small" data-testid="button-use-vision-styles" disabled={disabled} onClick={() => changeGenre([...picks.genre, ...detected].join(", "))}>Use styles from my vision · {detected.length}</button>}
      {total > 0 && <button type="button" className="text-button" data-testid="button-clear-picks" disabled={disabled} onClick={() => { changeGenre(null); changeInstruments(null); }}>Clear picks</button>}
    </div>
    <label className="field">Your own words for the sound <span className="muted">· optional, comma separated</span>
      <input data-testid="input-styles" value={genre} placeholder="warm analog tape, desert night, slow build" disabled={disabled} onChange={e => changeGenre(e.target.value.trim() ? e.target.value : null)} />
    </label>
    <label className="field">Instruments, in your words <span className="muted">· optional</span>
      <input data-testid="input-sound-instruments" value={instruments} placeholder="oud, soft piano, hand drums" disabled={disabled} onChange={e => changeInstruments(e.target.value.trim() ? e.target.value : null)} />
    </label>
    <p className="muted shape-note" role="note" data-testid="text-pick-guidance">{total ? `${total} pick${total === 1 ? "" : "s"} kept.` : "Pick as many as you like."} The first {guidedPickLimit} or so guide the music most{total > guiding ? `; ${total - guiding} more are saved with your sound but not sent this time` : ""}.</p>
  </div>;
}

export const voiceParts = [["Male", "Solo male lead"], ["Female", "Solo female lead"], ["Duet", "Duet"], ["Choir", "Choir / group vocals"], ["Call and response", "Call and response"]] as const;
export const voiceStyles = ["Rapper", "Soul", "Gospel lead", "Reggae", "Opera", "R&B", "Crooner", "Folk storyteller", "Country", "Rock belter", "Whispered and intimate", "Spoken word", "Tarab-style lead", "Qawwali-inspired", "Jazz vocalist", "Pop lead"];

export function VoicePicker({ value, change, disabled }: { value: CreatorVocalOptions; change: (next: CreatorVocalOptions) => void; disabled?: boolean }) {
  const [more, setMore] = useState(false);
  const styleShown = more ? voiceStyles : [...new Set([...voiceStyles.slice(0, 5), ...(voiceStyles.includes(value.character ?? "") ? [value.character!] : [])])];
  return <div className="shape-voice" role="group" aria-label="Voice">
    <div className="shape-chips" role="group" aria-label="Who sings">
      {voiceParts.slice(0, more ? voiceParts.length : 4).map(([label, delivery]) => {
        const on = value.delivery === delivery;
        return <button type="button" key={label} className={`chip shape-chip${on ? " active" : ""}`} aria-pressed={on} disabled={disabled} data-testid={`chip-voice-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`} onClick={() => change({ ...value, delivery: on ? defaultCreatorVocals.delivery : delivery })}>{label}</button>;
      })}
    </div>
    <div className="shape-chips" role="group" aria-label="Delivery style">
      {styleShown.map(style => {
        const on = value.character === style;
        return <button type="button" key={style} className={`chip shape-chip${on ? " active" : ""}`} aria-pressed={on} disabled={disabled} data-testid={`chip-voice-style-${style.toLowerCase().replace(/[^a-z]+/g, "-")}`} onClick={() => change({ ...value, character: on ? defaultCreatorVocals.character : style })}>{style}</button>;
      })}
      <button type="button" className="text-button shape-more" aria-expanded={more} data-testid="button-see-more-voice" onClick={() => setMore(v => !v)}>{more ? "See less" : "See more"}</button>
    </div>
    <p className="muted shape-note">These are directions for the music model, not a fixed singer or a guaranteed voice.</p>
  </div>;
}
