"use client";

import { useId, useMemo, useState } from "react";
import { detectPromptGenres } from "./genre-assist";
import { allGenres, genreFamilies, genreSearchKey, popularGenres, sameGenre, uniqueGenreNames } from "./music-genres";

export function GenrePicker({ value, change, disabled = false, label = "Genres & style blend", single = false, allowCustom = true, extraOptions = [], maxSelected = 8, initialBrowse = false, prompt, changePrompt }: {
  value: string[]; change: (next: string[]) => void; disabled?: boolean; label?: string;
  single?: boolean; allowCustom?: boolean; extraOptions?: string[]; maxSelected?: number; initialBrowse?: boolean; prompt?: string; changePrompt?: (text: string) => void;
}) {
  const id = useId(), [browse, setBrowse] = useState(initialBrowse), [category, setCategory] = useState("All genres"), [query, setQuery] = useState(""), [custom, setCustom] = useState(""), [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const detected = useMemo(() => detectPromptGenres(prompt ?? ""), [prompt]);
  const chosen = uniqueGenreNames(value);
  const selected = (name: string) => chosen.some(v => sameGenre(v, name));
  const family = genreFamilies.find(f => f.name === category);
  const options = uniqueGenreNames(browse ? family ? [...family.genres] : [...allGenres, ...extraOptions] : [...popularGenres, ...extraOptions.filter(g=>!allGenres.some(known => sameGenre(known, g))).slice(0,12)]);
  const matches = options.filter(g => !browse || !query.trim() || genreSearchKey(g).includes(genreSearchKey(query)));
  function toggle(name: string) {
    setError("");
    if (selected(name)) change(chosen.filter(v => !sameGenre(v, name)));
    else if (single) change([name]);
    else if (chosen.length < maxSelected) change([...chosen, name]);
  }
  function addCustom() {
    const name = custom.trim().replace(/\s+/g," ");
    if (!name || !genreSearchKey(name) || name.length > 60 || /[,\r\n]/.test(name)) { setError("Use a style name of 1–60 characters without commas."); return; }
    if (!single && chosen.length >= maxSelected && !selected(name)) { setError(`Choose up to ${maxSelected} styles. Remove one to add another.`); return; }
    if (!selected(name)) toggle(allGenres.find(g => sameGenre(g, name)) ?? name);
    setCustom("");
  }
  return <section className={`genre-picker${expanded ? " genre-picker-expanded" : ""}`} role="group" aria-labelledby={`${id}-heading`}>
    <div className="genre-picker-head"><div><h3 id={`${id}-heading`}>{label}</h3><p>{single ? "Choose a style to filter your library." : `Click to combine styles. Choose up to ${maxSelected}; click again to remove.`}</p></div>
      {!single && <button type="button" className="secondary small genre-expand" aria-expanded={expanded} aria-controls={`${id}-style-window`} disabled={disabled} onClick={() => { setExpanded(v => !v); if (!expanded) setBrowse(true); }}>{expanded ? "Compact styles window" : "Expand styles window"}</button>}
      <button type="button" role="switch" aria-checked={browse} aria-controls={`${id}-options`} className="genre-browse-toggle" disabled={disabled} onClick={()=>setBrowse(v=>!v)}><span className="genre-switch-track" aria-hidden="true"><span/></span> Browse all genres <small>{allGenres.length}</small></button>
    </div>
    {(!single || !!chosen.length) && <div className="genre-selected" aria-label="Selected genres"><span>{single ? "Filter:" : `Selected styles · ${chosen.length}/${maxSelected}`}</span>{!single && !chosen.length && <span>Click genres below to build your blend.</span>}{chosen.map(name=><button type="button" key={name} className="genre-pill selected" aria-label={`Remove ${name}`} disabled={disabled} onClick={()=>change(chosen.filter(v=>!sameGenre(v,name)))}>{name}<span aria-hidden="true">×</span></button>)}<button type="button" className="text-button" disabled={disabled} onClick={()=>change([])}>{single ? "Show all songs" : "Clear selection"}</button></div>}
    <div className="genre-style-window" id={`${id}-style-window`}>
    {browse && <div className="genre-search-row"><label htmlFor={`${id}-search`}>Search genres<input id={`${id}-search`} type="search" value={query} maxLength={100} placeholder="Try jazz, dabke, hip hop, or afro…" disabled={disabled} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")e.preventDefault();}}/></label><label htmlFor={`${id}-family`}>Genre family<select id={`${id}-family`} value={category} disabled={disabled} onChange={e=>setCategory(e.target.value)}><option>All genres</option>{genreFamilies.map(f=><option key={f.name}>{f.name}</option>)}</select></label></div>}
    <div className="genre-options" id={`${id}-options`} aria-label={browse ? "All genre choices" : "Popular genre choices"}>{matches.map(name=><button type="button" key={name} className={`genre-pill${selected(name)?" selected":""}`} aria-pressed={selected(name)} disabled={disabled || (!single && chosen.length>=maxSelected && !selected(name))} onClick={()=>toggle(name)}>{selected(name)&&<span aria-hidden="true">✓</span>}{name}</button>)}</div>
    {!matches.length && <p role="status">No matching genres in this family. Choose All genres or try another search.</p>}
    {allowCustom && <div className="genre-custom"><label htmlFor={`${id}-custom`}>Your own style or fusion<input id={`${id}-custom`} value={custom} maxLength={60} disabled={disabled} placeholder="e.g. Oud jazz fusion" onChange={e=>{setCustom(e.target.value);setError("");}} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addCustom();}}}/></label><button type="button" className="secondary small" disabled={disabled||!custom.trim()} onClick={addCustom}>Add style</button></div>}
    </div>
    {!single && changePrompt && <details className="genre-prompt"><summary>Or paste your own music / style prompt</summary><label htmlFor={`${id}-prompt`}>Full music direction<textarea id={`${id}-prompt`} rows={5} maxLength={1000} disabled={disabled} value={prompt ?? ""} onChange={e => { changePrompt(e.target.value); setError(""); }} placeholder="Blend jazz, dabke and deep house; warm oud, gentle female vocals, a bright chorus, no rap…"/></label><p>{(prompt ?? "").length}/1000 characters · Your complete text is kept as creative direction; in Create, this also updates the song description. Recognized genre names are suggestions, not an analysis of audio.</p>
      {detected.length ? <><p className="genre-detected">Recognized styles: {detected.join(", ")}</p><button type="button" className="secondary small" disabled={disabled} onClick={() => { change(detected.slice(0, maxSelected)); setError(""); }}>Use detected styles</button></> : <p>No catalog genre names recognized yet. Your full direction can still be used.</p>}
      <button type="button" className="secondary small" disabled={disabled || !(prompt ?? "").trim()} onClick={() => { change([]); setError(""); }}>Use prompt without genre chips</button>
    </details>}
    {!single && chosen.length>=maxSelected && <p className="muted" role="status">{maxSelected} styles selected. Remove one to add another.</p>}
    {error && <p className="notice" role="alert">{error}</p>}
  </section>;
}
