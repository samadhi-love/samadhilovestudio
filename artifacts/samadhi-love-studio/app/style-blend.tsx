"use client";
/**
 * One Styles box, like Suno: genres, instruments, moods and energy all blend in
 * one place. Tap chips to add or remove them, search the whole library, or just
 * type. There is no limit on the blend; the engine is given the strongest first.
 */
import { useState } from "react";
import { genreTags, sameGenre } from "./music-genres";
import { soundGroups } from "./shape-it-controls";
import { quickInstruments } from "./auto-instruments";

export const energyChoices = ["Upbeat", "Mid-tempo", "Slow", "Driving", "Laid-back", "Anthemic", "Big drop", "Groovy", "Intimate", "Epic build", "Half-time", "Uplifting"];
const instrumentNames = new Set([...soundGroups.filter(g => g.target === "instruments").flatMap(g => g.items), ...quickInstruments].map(n => n.toLowerCase()));
const instrumentWord = /\b(?:piano|guitars?|drums?|bass|synths?|pads?|organ|strings|violins?|cello|viola|flute|sax(?:ophone)?|trumpets?|horns?|brass|choir|bells|harp|oud|darbuka|tabla|sitar|ukulele|percussion|claps|808|marimba|accordion|harmonica|banjo|mandolin|rhodes|keys|bowls)\b/i;
/** Is this style tag an instrument (sent as instruments) or a genre/mood/energy (sent as style)? */
export const isInstrument = (tag: string) => instrumentNames.has(tag.toLowerCase()) || instrumentWord.test(tag);
/** Split the box into the two lists the engines take, keeping the creator's order. */
export function splitStyles(text: string) {
  const tags = genreTags(text);
  return { genre: tags.filter(t => !isInstrument(t)).join(", "), instruments: tags.filter(isInstrument).join(", ") };
}

const tabs = [
  { id: "genres", label: "Genres", items: soundGroups.find(g => g.name === "Genres")!.items },
  { id: "instruments", label: "Instruments", items: [...new Set([...quickInstruments, ...soundGroups.filter(g => g.target === "instruments").flatMap(g => g.items)])] },
  { id: "moods", label: "Moods", items: soundGroups.find(g => g.name === "Moods")!.items },
  { id: "energy", label: "Energy", items: energyChoices },
] as const;
const firstShown = 28;

export function StyleBlend({ genre, instruments, change, suggest, disabled }: {
  genre: string; instruments: string; change: (genre: string, instruments: string) => void;
  suggest?: () => { genre: string; instruments: string }; disabled?: boolean;
}) {
  const tags = [...genreTags(genre), ...genreTags(instruments)];
  const box = tags.join(", ");
  const [draft, setDraft] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("genres");
  const [all, setAll] = useState(false);
  const [query, setQuery] = useState("");
  const apply = (text: string) => { const next = splitStyles(text); change(next.genre, next.instruments); };
  const has = (name: string) => tags.some(t => sameGenre(t, name));
  const toggle = (name: string) => { setDraft(null); apply((has(name) ? tags.filter(t => !sameGenre(t, name)) : [...tags, name]).join(", ")); };
  const current = tabs.find(t => t.id === tab)!;
  const found = query.trim() ? [...new Set(tabs.flatMap(t => t.items))].filter(n => n.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 40) : null;
  const shown = found ?? (all ? current.items : current.items.slice(0, firstShown));
  return <section className="style-blend" aria-labelledby="style-blend-title" data-testid="style-blend">
    <div className="style-blend-head">
      <h3 id="style-blend-title">Styles</h3>
      {suggest && <button type="button" className="secondary small forge-gold-pill" data-testid="button-style-for-me" disabled={disabled} onClick={() => { const s = suggest(); setDraft(null); change(s.genre, s.instruments); }}>✨ Style it for me</button>}
    </div>
    <textarea className="style-blend-box" data-testid="input-style-blend" rows={3} disabled={disabled} value={draft ?? box}
      placeholder="Soul, Gospel, Hammond organ, choir, uplifting, mid-tempo… tap below or type anything"
      onChange={e => setDraft(e.target.value)} onBlur={() => { if (draft !== null) { apply(draft); setDraft(null); } }}/>
    {tags.length > 0 && <p className="muted" data-testid="text-style-count">Blend of {tags.length} style{tags.length === 1 ? "" : "s"}{tags.length > 1 ? `: ${tags.slice(0, 4).join(" × ")}${tags.length > 4 ? " …" : ""}` : ""}</p>}
    <div className="style-blend-tabs" role="tablist" aria-label="Style groups">
      {tabs.map(t => <button key={t.id} type="button" role="tab" aria-selected={!found && tab === t.id} data-testid={`style-tab-${t.id}`} onClick={() => { setTab(t.id); setAll(false); setQuery(""); }}>{t.label}</button>)}
      <label className="style-blend-search"><span className="sr-only">Find a style</span><input type="search" data-testid="input-style-search" placeholder="Find any style…" value={query} onChange={e => setQuery(e.target.value)}/></label>
    </div>
    <div className="genre-toggles-chips style-blend-chips" role="group" aria-label={found ? "Matching styles" : current.label}>
      {shown.map(name => <button key={name} type="button" className={`chip ${has(name) ? "active" : ""}`} aria-pressed={has(name)} disabled={disabled}
        data-testid={`style-chip-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} onClick={() => toggle(name)}>{name}</button>)}
      {found && !found.length && <span className="muted">Nothing found. Type it in the box: any style works.</span>}
      {!found && !all && current.items.length > firstShown && <button type="button" className="text-button" data-testid="button-styles-all" onClick={() => setAll(true)}>Show all {current.items.length}</button>}
    </div>
  </section>;
}
