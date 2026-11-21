"use client";
import "./saved-prompt-row.css";
import { useState } from "react";
import type { Template } from "./studio-data";

/** Just Begin: your saved prompts as one-tap chips (newest first), with See all and a search. */
export function SavedPromptRow({ prompts, use, disabled }: { prompts: Template[]; use: (prompt: Template) => void; disabled?: boolean }) {
  const [all, setAll] = useState(false);
  const [search, setSearch] = useState("");
  const ordered = [...prompts.filter(p => p.favorite), ...prompts.filter(p => !p.favorite)];
  const needle = search.trim().toLowerCase();
  const found = needle ? ordered.filter(p => [p.name, p.notes.prompt, p.tags.join(" ")].join(" ").toLowerCase().includes(needle)) : ordered;
  const shown = all ? found : ordered.slice(0, 5);
  return (
    <section className="saved-row" aria-label="My saved prompts" data-testid="saved-prompt-row">
      <h3>My saved prompts <small>{prompts.length}</small></h3>
      {all && <input className="saved-row-search" data-testid="input-saved-row-search" value={search} maxLength={100}
        placeholder="Search your saved prompts" aria-label="Search your saved prompts" onChange={e => setSearch(e.target.value)} />}
      <div className="saved-row-chips">
        {shown.map(p => <button type="button" key={p.id} className="saved-row-chip" disabled={disabled} title={p.notes.prompt || p.name}
          onClick={() => use(p)} data-testid={`saved-row-${p.id}`}>
          {p.favorite ? "★ " : ""}{p.name}
        </button>)}
        {all && !shown.length && <p className="muted">Nothing matches.</p>}
        {prompts.length > 5 && <button type="button" className="text-button" data-testid="button-saved-row-all" onClick={() => { setAll(!all); setSearch(""); }}>
          {all ? "Show fewer" : `See all ${prompts.length}`}</button>}
      </div>
      <p className="muted saved-row-note">Tap one to bring back its words, styles, who sings and video shape.</p>
    </section>
  );
}

/** Name it before saving: filled in from your words, change it if you like. Enter saves, Escape cancels. */
export function SaveNameBox({ suggested, save, cancel, busy }: { suggested: string; save: (name: string) => void; cancel: () => void; busy?: boolean }) {
  const [name, setName] = useState(suggested);
  return (
    // Not a <form>: it sits inside the Create form, so Enter must save the name, never start a song.
    <div className="save-name-box" role="group" aria-label="Name your saved prompt" data-testid="save-name-box">
      <label>Name it
        <input data-testid="input-save-name" value={name} maxLength={100} autoFocus onFocus={e => e.currentTarget.select()}
          onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === "Escape") cancel(); if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); save(name.trim() || suggested); } }} />
      </label>
      <button type="button" className="secondary small" disabled={busy} onClick={() => save(name.trim() || suggested)} data-testid="button-save-name">Save</button>
      <button type="button" className="text-button" onClick={cancel} data-testid="button-cancel-name">Cancel</button>
    </div>
  );
}
